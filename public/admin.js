const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n ? Number(n).toLocaleString('vi-VN') + '₫' : 'Liên hệ');

const PRODUCT_STATUS = { available: 'Còn hàng', sold: 'Hết hàng', hidden: 'Ngừng bán' };

let products = [];
let suppliers = [];
let editingId = null;
let images = []; // { url } ảnh đã có, hoặc { file, preview } ảnh mới chọn

async function api(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  // Hết phiên đăng nhập → tải lại để server hiện trang đăng nhập
  if (res.status === 401) location.reload();
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra.');
  return data;
}
const fmtDate = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);
const supplierName = (id) => suppliers.find((s) => s.id === id)?.name || '';

// Ngày hết bảo hành từ nhà cung cấp = ngày nhập + số tháng bảo hành
function warrantyEnd(importDate, months) {
  if (!importDate || !Number(months)) return null;
  const d = new Date(importDate + 'T00:00:00');
  d.setMonth(d.getMonth() + Number(months));
  return d;
}

function warrantyText(importDate, months) {
  const end = warrantyEnd(importDate, months);
  if (!end) return null;
  const days = Math.ceil((end - new Date()) / 86400000);
  return days >= 0
    ? { ok: true, text: `Còn BH NCC đến ${fmtDate(end)} (${days} ngày)` }
    : { ok: false, text: `Hết BH NCC từ ${fmtDate(end)}` };
}

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'form-msg ' + (ok ? 'ok' : 'err');
}

// ---------- Khởi động & đăng xuất ----------
async function showApp() {
  await loadSuppliers();
  await Promise.all([loadProducts(), loadSettings()]);
  // Mở thẳng form sửa khi đi từ trang Tra cứu (/admin#edit=<id>)
  const editId = location.hash.match(/^#edit=(.+)$/)?.[1];
  const product = editId && products.find((p) => p.id === editId);
  if (product) {
    history.replaceState(null, '', '/admin');
    openForm(product);
  }
}

$('#logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/';
});

// ---------- Tabs ----------
$$('.tabs button').forEach((btn) =>
  btn.addEventListener('click', () => {
    $$('.tabs button').forEach((b) => b.classList.toggle('active', b === btn));
    $$('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== btn.dataset.tab));
    if (btn.dataset.tab === 'products') renderProducts();
    if (btn.dataset.tab === 'suppliers') renderSuppliers();
  })
);

// ---------- Sản phẩm ----------
async function loadProducts() {
  products = await api('/api/admin/products');
  renderProducts();
  renderSuppliers();
}

function renderProducts() {
  const count = (s) => products.filter((p) => p.status === s).length;
  $('#stats').innerHTML = `
    <span class="stat">Còn hàng: <b>${count('available')}</b></span>
    <span class="stat">Hết hàng: <b>${count('sold')}</b></span>
    <span class="stat">Ngừng bán: <b>${count('hidden')}</b></span>`;

  const q = $('#p-search').value.trim().toLowerCase();
  const sup = $('#p-supplier').value;
  const list = products.filter((p) =>
    (!q || [p.name, p.brand, p.cpu, p.serial, supplierName(p.supplierId)].join(' ').toLowerCase().includes(q))
    && (!sup || (sup === '__none' ? !p.supplierId : p.supplierId === sup)));

  $('#product-rows').innerHTML = list.length ? list.map((p) => `
    <tr data-id="${esc(p.id)}">
      <td>
        <div class="prod-cell">
          ${p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : '<span class="no-thumb">💻</span>'}
          <div><strong>${esc(p.name)}</strong>
            <small>${esc([p.cpu, p.ram, p.storage].filter(Boolean).join(' · '))}</small>
            ${optionCount(p) ? `<small class="opt-count">+ ${optionCount(p)} tuỳ chọn nâng cấp</small>` : ''}</div>
        </div>
      </td>
      <td><strong>${money(p.price)}</strong></td>
      <td class="import-cell">${importCell(p)}</td>
      <td><span class="status status-${p.status}">${PRODUCT_STATUS[p.status]}</span></td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" data-action="edit">Sửa</button>
          ${p.status === 'sold'
            ? '<button class="btn btn-ghost btn-sm" data-action="available">Còn hàng lại</button>'
            : '<button class="btn btn-outline btn-sm" data-action="sold">Hết hàng</button>'}
          <button class="btn btn-danger btn-sm" data-action="delete">Xoá</button>
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="5" class="row-empty">${products.length ? 'Không có máy nào khớp tìm kiếm.' : 'Chưa có máy nào. Bấm "+ Thêm máy" để bắt đầu.'}</td></tr>`;
}

const optionCount = (p) => (p.options?.ram?.length || 0) + (p.options?.storage?.length || 0);

function importCell(p) {
  const w = warrantyText(p.importDate, p.supplierWarranty);
  const name = supplierName(p.supplierId);
  if (!name && !p.serial && !p.importDate) return '<span class="muted">Chưa nhập thông tin</span>';
  return `
    ${name ? `<b>${esc(name)}</b>` : '<span class="muted">Chưa chọn NCC</span>'}
    ${p.serial ? `<small>S/N: ${esc(p.serial)}</small>` : ''}
    ${p.importDate ? `<small>Nhập: ${fmtDate(new Date(p.importDate + 'T00:00:00'))}</small>` : ''}
    ${w ? `<span class="wbadge ${w.ok ? 'w-ok' : 'w-off'}">${w.text}</span>` : ''}`;
}

$('#p-search').addEventListener('input', renderProducts);
$('#p-supplier').addEventListener('input', renderProducts);

$('#product-rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.closest('tr').dataset.id;
  const product = products.find((p) => p.id === id);
  const action = btn.dataset.action;
  try {
    if (action === 'edit') return openForm(product);
    if (action === 'delete') {
      if (!confirm(`Xoá hẳn "${product.name}"? Không thể khôi phục.`)) return;
      await api(`/api/admin/products/${id}`, { method: 'DELETE' });
    } else {
      await api(`/api/admin/products/${id}/status`, json('PATCH', { status: action }));
    }
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Form thêm/sửa ----------
const form = $('#product-form');
const dialog = $('#product-dialog');

function openForm(product) {
  editingId = product ? product.id : null;
  form.reset();
  $('.form-msg', form).textContent = '';
  $('#form-title').textContent = product ? 'Sửa thông tin máy' : 'Thêm máy mới';
  if (product) {
    for (const [key, value] of Object.entries(product)) {
      const field = form.elements[key];
      if (!field || field.type === 'file') continue;
      if (Array.isArray(value)) field.value = value.join('\n');
      else field.value = ['price', 'supplierWarranty'].includes(key) && !value ? '' : value;
    }
  }
  ['ram', 'storage'].forEach((type) => {
    $(`[data-rows="${type}"]`).innerHTML = '';
    (product?.options?.[type] || []).forEach((o) => addOptionRow(type, o));
  });
  updateOptionBase();
  fillSupplierSelect(product?.supplierId || '');
  if (!product) form.elements.importDate.value = today();
  updateWarrantyHint();
  images = product ? product.images.map((url) => ({ url })) : [];
  renderImages();
  dialog.showModal();
}

function renderImages() {
  $('#image-list').innerHTML = images.map((img, i) => `
    <div class="image-item ${i === 0 ? 'first' : ''}">
      <img src="${esc(img.url || img.preview)}" alt="">
      <button type="button" data-index="${i}" aria-label="Xoá ảnh">×</button>
    </div>`).join('');
}

$('#image-list').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-index]');
  if (!btn) return;
  const [removed] = images.splice(Number(btn.dataset.index), 1);
  if (removed.preview) URL.revokeObjectURL(removed.preview);
  renderImages();
});

$('#image-input').addEventListener('change', (e) => {
  for (const file of e.target.files) images.push({ file, preview: URL.createObjectURL(file) });
  // Server luôn xếp ảnh cũ trước ảnh mới, nên hiển thị theo đúng thứ tự đó
  images.sort((a, b) => (a.url ? 0 : 1) - (b.url ? 0 : 1));
  e.target.value = '';
  renderImages();
});

$('#add-product').addEventListener('click', () => openForm(null));
$('#cancel-form').addEventListener('click', () => dialog.close());
$('.dialog-close', dialog).addEventListener('click', () => dialog.close());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  data.delete('images');
  data.set('keepImages', JSON.stringify(images.filter((i) => i.url).map((i) => i.url)));
  data.set('options', JSON.stringify(readOptions()));
  images.filter((i) => i.file).forEach((i) => data.append('images', i.file));

  const btn = $('#save-product');
  btn.disabled = true;
  btn.textContent = 'Đang lưu...';
  try {
    await api(editingId ? `/api/admin/products/${editingId}` : '/api/admin/products', {
      method: editingId ? 'PUT' : 'POST',
      body: data,
    });
    dialog.close();
    loadProducts();
  } catch (err) {
    showMsg($('.form-msg', form), err.message, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lưu';
  }
});

// ---------- Tuỳ chọn nâng cấp RAM / ổ cứng ----------
const OPTION_HINTS = { ram: ['vd: 16GB', 'vd: 600000'], storage: ['vd: SSD 512GB', 'vd: 500000'] };

function addOptionRow(type, option = {}) {
  const row = document.createElement('div');
  row.className = 'opt-row';
  row.innerHTML = `
    <input data-f="label" maxlength="50" placeholder="${OPTION_HINTS[type][0]}" value="${esc(option.label || '')}">
    <input data-f="extra" inputmode="numeric" placeholder="+ giá (${OPTION_HINTS[type][1]})" value="${option.extra || ''}">
    <button type="button" class="btn btn-danger btn-sm" data-del-opt aria-label="Xoá dòng">×</button>`;
  $(`[data-rows="${type}"]`).append(row);
  return row;
}

function readOptions() {
  const options = {};
  ['ram', 'storage'].forEach((type) => {
    options[type] = $$(`[data-rows="${type}"] .opt-row`)
      .map((row) => ({
        label: $('[data-f=label]', row).value.trim(),
        extra: Number($('[data-f=extra]', row).value.replace(/\D/g, '')) || 0,
      }))
      .filter((o) => o.label);
  });
  return options;
}

function updateOptionBase() {
  ['ram', 'storage'].forEach((type) => ($(`[data-base="${type}"]`).textContent = form.elements[type].value.trim() || '—'));
}

form.elements.ram.addEventListener('input', updateOptionBase);
form.elements.storage.addEventListener('input', updateOptionBase);
form.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add-opt]');
  if (add) $('[data-f=label]', addOptionRow(add.dataset.addOpt)).focus();
  const del = e.target.closest('[data-del-opt]');
  if (del) del.closest('.opt-row').remove();
});

function updateWarrantyHint() {
  const w = warrantyText(form.elements.importDate.value, form.elements.supplierWarranty.value.replace(/\D/g, ''));
  const hint = $('#warranty-hint');
  hint.textContent = w ? w.text : 'Nhập ngày nhập và số tháng bảo hành để biết máy còn bảo hành từ nhà cung cấp đến khi nào.';
  hint.className = 'muted import-hint ' + (w ? (w.ok ? 'w-ok' : 'w-off') : '');
}
form.elements.importDate.addEventListener('input', updateWarrantyHint);
form.elements.supplierWarranty.addEventListener('input', updateWarrantyHint);

// Thêm nhanh nhà cung cấp ngay trong form thêm máy
$('#quick-supplier').addEventListener('click', async () => {
  const name = prompt('Tên nhà cung cấp mới:');
  if (!name || !name.trim()) return;
  const phone = prompt('Số điện thoại nhà cung cấp (có thể bỏ trống):') || '';
  try {
    const supplier = await api('/api/admin/suppliers', json('POST', { name, phone }));
    await loadSuppliers();
    fillSupplierSelect(supplier.id);
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Nhà cung cấp ----------
async function loadSuppliers() {
  suppliers = await api('/api/admin/suppliers');
  suppliers.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const filter = $('#p-supplier');
  const current = filter.value;
  filter.innerHTML = '<option value="">Tất cả nhà cung cấp</option>'
    + suppliers.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')
    + '<option value="__none">— Chưa chọn nhà cung cấp</option>';
  filter.value = [...filter.options].some((o) => o.value === current) ? current : '';
  renderSuppliers();
}

function fillSupplierSelect(selected) {
  $('#supplier-select').innerHTML = '<option value="">— Chọn nhà cung cấp —</option>'
    + suppliers.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}${s.phone ? ' · ' + esc(s.phone) : ''}</option>`).join('');
  $('#supplier-select').value = selected;
}

function renderSuppliers() {
  $('#supplier-list').innerHTML = suppliers.length ? suppliers.map((s) => {
    const mine = products.filter((p) => p.supplierId === s.id);
    const inWarranty = mine.filter((p) => warrantyText(p.importDate, p.supplierWarranty)?.ok).length;
    return `
      <article class="supplier" data-id="${esc(s.id)}">
        <div>
          <h3>${esc(s.name)}</h3>
          ${s.phone ? `<a class="phone" href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a>` : ''}
          ${s.address ? `<p class="meta">${esc(s.address)}</p>` : ''}
        </div>
        <div class="supplier-stats">
          <span><b>${mine.length}</b> máy đã nhập</span>
          <span><b>${inWarranty}</b> máy còn BH NCC</span>
        </div>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        <div class="actions">
          <button class="btn btn-outline btn-sm" data-sup="view">Xem các máy</button>
          <button class="btn btn-ghost btn-sm" data-sup="edit">Sửa</button>
          <button class="btn btn-danger btn-sm" data-sup="delete">Xoá</button>
        </div>
      </article>`;
  }).join('') : '<div class="empty-box">Chưa có nhà cung cấp nào. Bấm "+ Thêm nhà cung cấp" để bắt đầu.</div>';
}

const supplierDialog = $('#supplier-dialog');
const supplierForm = $('#supplier-form');
let editingSupplierId = null;

function openSupplierForm(supplier) {
  editingSupplierId = supplier ? supplier.id : null;
  supplierForm.reset();
  $('.form-msg', supplierForm).textContent = '';
  $('#supplier-title').textContent = supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp';
  if (supplier) ['name', 'phone', 'address', 'note'].forEach((k) => (supplierForm.elements[k].value = supplier[k] || ''));
  supplierDialog.showModal();
}

$('#add-supplier').addEventListener('click', () => openSupplierForm(null));
$$('.dialog-close, [data-close]', supplierDialog).forEach((b) => b.addEventListener('click', () => supplierDialog.close()));

supplierForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const body = json(editingSupplierId ? 'PUT' : 'POST', Object.fromEntries(new FormData(supplierForm)));
    await api(editingSupplierId ? `/api/admin/suppliers/${editingSupplierId}` : '/api/admin/suppliers', body);
    supplierDialog.close();
    await loadSuppliers();
    renderProducts();
  } catch (err) {
    showMsg($('.form-msg', supplierForm), err.message, false);
  }
});

$('#supplier-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-sup]');
  if (!btn) return;
  const supplier = suppliers.find((s) => s.id === btn.closest('.supplier').dataset.id);
  if (btn.dataset.sup === 'edit') return openSupplierForm(supplier);
  if (btn.dataset.sup === 'view') {
    $('#p-search').value = '';
    $('#p-supplier').value = supplier.id;
    $('.tabs [data-tab="products"]').click();
    return;
  }
  if (!confirm(`Xoá nhà cung cấp "${supplier.name}"?`)) return;
  try {
    await api(`/api/admin/suppliers/${supplier.id}`, { method: 'DELETE' });
    await loadSuppliers();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Cài đặt ----------
async function loadSettings() {
  const settings = await api('/api/settings');
  const f = $('#settings-form');
  for (const [key, value] of Object.entries(settings)) if (f.elements[key]) f.elements[key].value = value;
}

$('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('.form-msg', e.target);
  try {
    await api('/api/admin/settings', json('PUT', Object.fromEntries(new FormData(e.target))));
    showMsg(msg, 'Đã lưu!', true);
  } catch (err) {
    showMsg(msg, err.message, false);
  }
});

$('#password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('.form-msg', e.target);
  try {
    await api('/api/admin/password', json('POST', Object.fromEntries(new FormData(e.target))));
    e.target.reset();
    showMsg(msg, 'Đã đổi mật khẩu!', true);
  } catch (err) {
    showMsg(msg, err.message, false);
  }
});

// ---------- Khởi động ----------
showApp();
