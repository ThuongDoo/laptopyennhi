// Trang tra cứu nội bộ: tìm máy, xem giá theo cấu hình, sao chép tin + ảnh gửi khách
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n ? Number(n).toLocaleString('vi-VN') + 'đ' : 'Liên hệ');
// Bỏ dấu tiếng Việt và dấu nháy để "lets note" khớp "Let's note"
const normalize = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/['’`]/g, '');

const CATEGORIES = [
  { id: 'van-phong', name: 'Văn phòng – Học tập' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'do-hoa', name: 'Đồ hoạ – Kỹ thuật' },
  { id: 'mong-nhe', name: 'Mỏng nhẹ – Doanh nhân' },
  { id: 'macbook', name: 'MacBook' },
];
const STATUS = { available: ['Còn hàng', 'st-ok'], sold: ['Hết hàng', 'st-off'], hidden: ['Ngừng bán', 'st-hide'] };
const PRICE_RANGES = [
  { id: '0-6', label: 'Dưới 6 triệu', min: 1, max: 6e6 },
  { id: '6-8', label: '6 – 8 triệu', min: 6e6, max: 8e6 },
  { id: '8-10', label: '8 – 10 triệu', min: 8e6, max: 10e6 },
  { id: '10+', label: 'Từ 10 triệu', min: 10e6, max: Infinity },
  { id: 'lh', label: 'Chưa có giá (liên hệ)', min: 0, max: 1 },
];

// ---------- Icon (Lucide) ----------
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
  pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
};
const icon = (name, size = 18) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// ---------- Dữ liệu ----------
let products = [];
let suppliers = [];
let settings = {};
const filters = { q: '', brand: '', cat: '', price: '', ram: '', all: false, sort: 'new' };

async function api(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) location.reload();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra.');
  return data;
}

const supplierOf = (p) => suppliers.find((s) => s.id === p.supplierId);
const ramKey = (text) => ((text || '').match(/\d+\s*GB/i)?.[0] || '').replace(/\s/g, '').toUpperCase();
const ramKeys = (p) => [p.ram, ...(p.options?.ram || []).map((o) => o.label)].map(ramKey).filter(Boolean);

// Danh sách lựa chọn của 1 loại (RAM / ổ cứng): cấu hình gốc + các mức nâng cấp
function choicesOf(p, type) {
  return [{ label: p[type] || '', extra: 0, base: true }, ...(p.options?.[type] || [])];
}

// Chuỗi tìm kiếm của mỗi máy (bỏ dấu để gõ không dấu vẫn ra)
const haystack = (p) => normalize([
  p.name, p.brand, p.cpu, p.ram, p.storage, p.screen, p.gpu, p.condition, p.serial,
  supplierOf(p)?.name, ...(p.options?.ram || []).map((o) => o.label), ...(p.options?.storage || []).map((o) => o.label),
].join(' ')).replace(/\s+/g, ' ');

function filtered() {
  const words = normalize(filters.q).split(/\s+/).filter(Boolean);
  const range = PRICE_RANGES.find((r) => r.id === filters.price);
  const list = products.filter((p) => {
    if (!filters.all && p.status !== 'available') return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.cat && (p.category || 'van-phong') !== filters.cat) return false;
    if (range && !(p.price >= range.min && p.price < range.max)) return false;
    if (filters.ram && !ramKeys(p).includes(filters.ram)) return false;
    if (words.length) {
      // So khớp cả khi gõ dính liền: "16gb" khớp "16GB", "i7" khớp "i7-1185G7"
      const text = p._hay;
      const compact = text.replace(/[^a-z0-9]/g, '');
      return words.every((w) => text.includes(w) || compact.includes(w.replace(/[^a-z0-9]/g, '')));
    }
    return true;
  });
  const order = { available: 0, sold: 1, hidden: 2 };
  list.sort((a, b) => {
    if (a.status !== b.status) return order[a.status] - order[b.status];
    if (filters.sort === 'asc') return (a.price || Infinity) - (b.price || Infinity);
    if (filters.sort === 'desc') return b.price - a.price;
    if (filters.sort === 'name') return a.name.localeCompare(b.name, 'vi');
    return b.createdAt - a.createdAt;
  });
  return list;
}

// ---------- Danh sách ----------
function renderFilters() {
  const pool = products.filter((p) => filters.all || p.status === 'available');
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  $('#brand-chips').innerHTML = [
    `<button class="chip ${!filters.brand ? 'active' : ''}" data-brand="">Tất cả <small>${pool.length}</small></button>`,
    ...brands.map((b) => `<button class="chip ${filters.brand === b ? 'active' : ''}" data-brand="${esc(b)}">${esc(b)} <small>${pool.filter((p) => p.brand === b).length}</small></button>`),
  ].join('');

  const rams = [...new Set(products.flatMap(ramKeys))].sort((a, b) => parseInt(a) - parseInt(b));
  const fill = (el, first, items, value) => {
    el.innerHTML = `<option value="">${first}</option>` + items.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
    el.value = value;
  };
  fill($('#f-cat'), 'Mọi nhu cầu', CATEGORIES.map((c) => [c.id, c.name]), filters.cat);
  fill($('#f-price'), 'Mọi mức giá', PRICE_RANGES.map((r) => [r.id, r.label]), filters.price);
  fill($('#f-ram'), 'Mọi RAM', rams.map((r) => [r, 'RAM ' + r + ' (kể cả nâng cấp)']), filters.ram);
}

function rowHTML(p) {
  const [statusLabel, statusClass] = STATUS[p.status] || STATUS.available;
  const specs = [p.cpu, p.ram && 'RAM ' + p.ram, p.storage, p.screen, p.gpu].filter(Boolean);
  const variants = [
    ...(p.options?.ram || []).map((o) => ['RAM ' + o.label, o.extra]),
    ...(p.options?.storage || []).map((o) => [o.label, o.extra]),
  ];
  return `
    <article class="row ${p.status !== 'available' ? 'is-off' : ''}" data-id="${esc(p.id)}">
      <div class="row-main" role="button" tabindex="0" data-open aria-label="Xem chi tiết ${esc(p.name)}">
        <div class="thumb">
          ${p.images[0] ? `<img src="${esc(p.images[0])}" alt="" loading="lazy">` : icon('laptop', 28)}
          ${p.images.length > 1 ? `<span class="thumb-count">${p.images.length}</span>` : ''}
        </div>
        <div class="row-info">
          <div class="row-title"><b>${esc(p.name)}</b><span class="st ${statusClass}">${statusLabel}</span></div>
          <div class="row-specs">${specs.map(esc).join(' · ')}</div>
          <div class="row-meta">
            ${p.condition ? `<span>${esc(p.condition)}</span>` : ''}
            ${p.warranty ? `<span>BH ${esc(p.warranty)}</span>` : ''}
            ${supplierOf(p) ? `<span class="meta-sup">${icon('lock', 12)} ${esc(supplierOf(p).name)}</span>` : ''}
          </div>
        </div>
        <div class="row-price">
          <strong class="${p.price ? '' : 'contact'}">${money(p.price)}</strong>
          ${variants.map(([label, extra]) => `<small>${esc(label)}: <b>${p.price ? money(p.price + extra) : '+' + money(extra)}</b></small>`).join('')}
        </div>
      </div>
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" data-quick-copy title="Sao chép tin nhắn cấu hình gốc">${icon('copy', 16)}<span>Sao chép tin</span></button>
      </div>
    </article>`;
}

function render() {
  const list = filtered();
  $('#results').innerHTML = list.map(rowHTML).join('');
  $('#count').textContent = `${list.length} máy`;
  const empty = $('#empty');
  empty.hidden = list.length > 0;
  if (!list.length) {
    empty.innerHTML = products.length
      ? `Không tìm thấy máy phù hợp${filters.q ? ` với “${esc(filters.q)}”` : ''}. ${!filters.all ? '<button class="link" data-show-all>Tìm cả máy hết hàng</button>' : ''}`
      : 'Chưa có máy nào. <a href="/admin">Thêm máy trong trang Quản lý</a>.';
  }
}

function update() {
  renderFilters();
  render();
}

// ---------- Tin nhắn gửi khách ----------
const MSG_OPTS_KEY = 'tracuu.msgOpts';
function loadMsgOpts() {
  try {
    return { desc: false, gifts: true, contact: true, ...JSON.parse(localStorage.getItem(MSG_OPTS_KEY) || '{}') };
  } catch {
    return { desc: false, gifts: true, contact: true };
  }
}
function saveMsgOpts(opts) {
  try { localStorage.setItem(MSG_OPTS_KEY, JSON.stringify(opts)); } catch { /* bỏ qua */ }
}

function buildMessage(p, choice, opts) {
  const ram = choice.ram?.label || p.ram;
  const storage = choice.storage?.label || p.storage;
  const total = p.price ? p.price + (choice.ram?.extra || 0) + (choice.storage?.extra || 0) : 0;
  const lines = [`💻 ${p.name}`];
  [['CPU', p.cpu], ['RAM', ram], ['Ổ cứng', storage], ['Màn hình', p.screen], ['Card đồ hoạ', p.gpu], ['Tình trạng', p.condition]]
    .filter(([, v]) => v)
    .forEach(([k, v]) => lines.push(`🔹 ${k}: ${v}`));
  if (p.warranty) lines.push(`🛡️ Bảo hành: ${p.warranty}`);
  lines.push(`💰 Giá: ${total ? money(total) : 'liên hệ để được báo giá'}`);

  if (opts.desc && p.description) {
    lines.push('');
    p.description.split('\n').forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (line.startsWith('## ')) lines.push(`\n✅ ${line.slice(3)}:`);
      else if (line.startsWith('- ')) lines.push(`• ${line.slice(2)}`);
      else lines.push(line);
    });
  }
  const gifts = (settings.gifts || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (opts.gifts && gifts.length) {
    lines.push('', '🎁 Ưu đãi khi mua:');
    gifts.forEach((g) => lines.push(`• ${g}`));
  }
  if (opts.contact) {
    lines.push('');
    if (settings.phone) lines.push(`📞 ${settings.shopName || ''}: ${settings.phone}${settings.zalo ? ' (Zalo)' : ''}`.replace(' : ', ': '));
    if (settings.address) lines.push(`📍 ${settings.address}`);
    if (settings.openHours) lines.push(`🕗 ${settings.openHours}`);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

// ---------- Sao chép / tải ----------
async function copyText(text) {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* thử cách dự phòng bên dưới */ }
  // Dự phòng khi mở qua http (vd: điện thoại vào bằng IP mạng LAN)
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  (document.querySelector('dialog[open]') || document.body).append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

const canCopyImage = () => window.isSecureContext && navigator.clipboard?.write && window.ClipboardItem;

async function copyImage(url) {
  // Clipboard chỉ nhận PNG → vẽ lại ảnh qua canvas
  const png = (async () => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  })();
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

const slug = (s) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fileName = (p, i, url) => `${slug(p.name)}-${i + 1}${(url.match(/\.\w+$/) || ['.jpg'])[0]}`;

function download(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  (document.querySelector('dialog[open]') || document.body).append(a);
  a.click();
  a.remove();
}

async function shareImages(p, urls, text) {
  const files = await Promise.all(urls.map(async (url, i) => {
    const blob = await (await fetch(url)).blob();
    return new File([blob], fileName(p, i, url), { type: blob.type });
  }));
  if (!navigator.canShare?.({ files })) throw new Error('Thiết bị không hỗ trợ chia sẻ ảnh.');
  await navigator.share({ files, text });
}

let toastTimer;
function toast(message, type = 'ok') {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast show toast-${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast'), 2600);
}

// ---------- Chi tiết máy ----------
function warrantyInfo(p) {
  if (!p.importDate || !p.supplierWarranty) return '';
  const end = new Date(p.importDate + 'T00:00:00');
  end.setMonth(end.getMonth() + Number(p.supplierWarranty));
  const days = Math.ceil((end - new Date()) / 86400000);
  const date = end.toLocaleDateString('vi-VN');
  return days >= 0 ? `<span class="w-ok">Còn BH NCC đến ${date} (${days} ngày)</span>` : `<span class="w-off">Hết BH NCC từ ${date}</span>`;
}

function formatDescription(text) {
  let html = '';
  let list = [];
  const flush = () => {
    if (list.length) html += `<ul>${list.map((li) => `<li>${icon('check', 15)}<span>${li}</span></li>`).join('')}</ul>`;
    list = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ')) { list.push(esc(line.slice(2))); continue; }
    flush();
    if (line.startsWith('## ')) html += `<h4>${esc(line.slice(3))}</h4>`;
    else if (line) html += `<p>${esc(line)}</p>`;
  }
  flush();
  return html;
}

function openDetail(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const [statusLabel, statusClass] = STATUS[p.status] || STATUS.available;
  const groups = [['ram', 'RAM'], ['storage', 'Ổ cứng']]
    .map(([type, title]) => ({ type, title, list: choicesOf(p, type) }));
  const choice = { ram: groups[0].list[0], storage: groups[1].list[0] };
  const opts = loadMsgOpts();
  const sup = supplierOf(p);
  const total = () => (p.price ? p.price + choice.ram.extra + choice.storage.extra : 0);
  const hasOptions = groups.some((g) => g.list.length > 1);

  // Bảng giá mọi tổ hợp RAM × ổ cứng
  const combos = [];
  for (const r of groups[0].list) for (const s of groups[1].list) combos.push({ r, s, price: p.price ? p.price + r.extra + s.extra : 0 });

  const specRows = [
    ['Hãng', p.brand], ['Nhu cầu', CATEGORIES.find((c) => c.id === p.category)?.name], ['CPU', p.cpu], ['RAM', p.ram],
    ['Ổ cứng', p.storage], ['Màn hình', p.screen], ['Card đồ hoạ', p.gpu], ['Tình trạng', p.condition], ['Bảo hành', p.warranty],
  ].filter(([, v]) => v);

  $('#detail-body').innerHTML = `
    <header class="d-head">
      <div>
        <h2 id="d-name">${esc(p.name)}</h2>
        <div class="d-sub"><span class="st ${statusClass}">${statusLabel}</span>${p.brand ? `<span>${esc(p.brand)}</span>` : ''}</div>
      </div>
      <a class="btn btn-ghost btn-sm" href="/admin#edit=${esc(p.id)}">${icon('pen', 15)} Sửa</a>
      <button class="d-close" data-close aria-label="Đóng">${icon('x', 22)}</button>
    </header>

    <div class="d-body">
      <section class="d-gallery">
        ${p.images.length ? `
          <div class="g-main"><img src="${esc(p.images[0])}" alt="${esc(p.name)}" id="g-img" data-i="0"></div>
          ${p.images.length > 1 ? `<div class="g-thumbs">${p.images.map((src, i) => `<button class="${i === 0 ? 'active' : ''}" data-thumb="${i}" aria-label="Ảnh ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}
          <div class="g-actions">
            <button class="btn btn-ghost btn-sm" data-img="copy">${icon('copy', 15)} Sao chép ảnh này</button>
            <button class="btn btn-ghost btn-sm" data-img="download">${icon('download', 15)} Tải ảnh này</button>
            ${p.images.length > 1 ? `<button class="btn btn-ghost btn-sm" data-img="download-all">${icon('download', 15)} Tải cả ${p.images.length} ảnh</button>` : ''}
            ${navigator.canShare ? `<button class="btn btn-ghost btn-sm" data-img="share">${icon('share', 15)} Chia sẻ ảnh</button>` : ''}
          </div>` : `
          <div class="g-empty">${icon('image', 36)}<p>Máy này chưa có ảnh.<br><a href="/admin#edit=${esc(p.id)}">Thêm ảnh trong trang Quản lý</a></p></div>`}
      </section>

      <section class="d-section">
        <div class="d-price">
          <span>${icon('tag', 16)} Giá theo cấu hình đang chọn</span>
          <strong id="d-total">${money(total())}</strong>
        </div>
        ${hasOptions ? groups.filter((g) => g.list.length > 1).map((g) => `
          <div class="opt-group">
            <span class="opt-title">${g.title}</span>
            <div class="opt-list">${g.list.map((o, i) => `
              <button class="opt ${i === 0 ? 'active' : ''}" data-type="${g.type}" data-i="${i}" aria-pressed="${i === 0}">
                <b>${esc(o.label || 'Mặc định')}</b><small>${o.base ? 'Gốc' : '+' + money(o.extra)}</small>
              </button>`).join('')}</div>
          </div>`).join('') : ''}
        ${combos.length > 1 ? `
          <details class="combo" ${combos.length <= 6 ? 'open' : ''}>
            <summary>Bảng giá tất cả cấu hình (${combos.length})</summary>
            <table>${combos.map((c) => `
              <tr data-combo="${groups[0].list.indexOf(c.r)},${groups[1].list.indexOf(c.s)}">
                <td>${esc([c.r.label && 'RAM ' + c.r.label, c.s.label].filter(Boolean).join(' · ') || 'Cấu hình gốc')}</td>
                <td>${c.price ? money(c.price) : (c.r.extra + c.s.extra ? '+' + money(c.r.extra + c.s.extra) : 'Liên hệ')}</td>
              </tr>`).join('')}</table>
          </details>` : ''}
      </section>

      <section class="d-section d-msg">
        <h3>${icon('chat', 17)} Tin nhắn gửi khách</h3>
        <div class="msg-opts">
          <label><input type="checkbox" data-opt="desc" ${opts.desc ? 'checked' : ''}> Kèm mô tả</label>
          <label><input type="checkbox" data-opt="gifts" ${opts.gifts ? 'checked' : ''}> Kèm ưu đãi</label>
          <label><input type="checkbox" data-opt="contact" ${opts.contact ? 'checked' : ''}> Kèm SĐT, địa chỉ shop</label>
        </div>
        <textarea id="msg" rows="10" aria-label="Nội dung tin nhắn"></textarea>
        <p class="hint">Có thể sửa trực tiếp trước khi sao chép. Đổi cấu hình hoặc tuỳ chọn ở trên thì tin nhắn được tạo lại.</p>
        <button class="btn btn-primary btn-block btn-lg" data-copy-msg>${icon('copy', 18)} Sao chép tin nhắn</button>
      </section>

      <section class="d-section">
        <h3>Thông số</h3>
        <table class="spec">${specRows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>
      </section>

      ${p.description ? `<section class="d-section"><h3>Mô tả</h3><div class="desc">${formatDescription(p.description)}</div></section>` : ''}

      ${p.postLinks?.length ? `
        <section class="d-section">
          <h3>${icon('link', 17)} Bài đăng của máy này</h3>
          <div class="links">${p.postLinks.map((url) => {
            let host = url;
            try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* giữ nguyên */ }
            return `<div class="link-row"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon('link', 14)} ${esc(host)}</a><button class="btn btn-ghost btn-sm" data-copy-link="${esc(url)}">Sao chép link</button></div>`;
          }).join('')}</div>
        </section>` : ''}

      <section class="d-section d-internal">
        <h3>${icon('lock', 16)} Nội bộ <small>(không có trong tin gửi khách)</small></h3>
        <table class="spec">
          <tr><th>Nhà cung cấp</th><td>${sup ? `${esc(sup.name)}${sup.phone ? ` · <a href="tel:${esc(sup.phone.replace(/[^\d+]/g, ''))}">${esc(sup.phone)}</a>` : ''}` : '<span class="muted">Chưa chọn</span>'}</td></tr>
          ${p.serial ? `<tr><th>Serial</th><td>${esc(p.serial)}</td></tr>` : ''}
          ${p.importDate ? `<tr><th>Ngày nhập</th><td>${new Date(p.importDate + 'T00:00:00').toLocaleDateString('vi-VN')}</td></tr>` : ''}
          ${warrantyInfo(p) ? `<tr><th>BH nhà cung cấp</th><td>${warrantyInfo(p)}</td></tr>` : ''}
        </table>
      </section>
    </div>`;

  const body = $('#detail-body');
  const msg = $('#msg', body);
  const refreshMessage = () => (msg.value = buildMessage(p, choice, opts));
  const selectOption = (type, i) => {
    choice[type] = groups.find((g) => g.type === type).list[i];
    $$(`.opt[data-type="${type}"]`, body).forEach((b) => {
      const on = +b.dataset.i === i;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
    });
    $('#d-total', body).textContent = money(total());
    $$('tr[data-combo]', body).forEach((tr) =>
      tr.classList.toggle('active', tr.dataset.combo === `${groups[0].list.indexOf(choice.ram)},${groups[1].list.indexOf(choice.storage)}`));
    refreshMessage();
  };
  refreshMessage();
  selectOption('ram', 0);

  body.onclick = async (e) => {
    const t = e.target;
    if (t.closest('[data-close]')) return $('#detail').close();

    const opt = t.closest('.opt');
    if (opt) return selectOption(opt.dataset.type, +opt.dataset.i);

    const combo = t.closest('tr[data-combo]');
    if (combo) {
      const [r, s] = combo.dataset.combo.split(',').map(Number);
      selectOption('ram', r);
      return selectOption('storage', s);
    }

    const thumb = t.closest('[data-thumb]');
    if (thumb) {
      const i = +thumb.dataset.thumb;
      $('#g-img', body).src = p.images[i];
      $('#g-img', body).dataset.i = i;
      $$('[data-thumb]', body).forEach((b) => b.classList.toggle('active', b === thumb));
      return;
    }

    if (t.closest('[data-copy-msg]')) {
      return toast((await copyText(msg.value)) ? 'Đã sao chép tin nhắn — dán vào Zalo/Messenger để gửi' : 'Không sao chép được, hãy bôi đen và sao chép thủ công', 'ok');
    }

    const link = t.closest('[data-copy-link]');
    if (link) return toast((await copyText(link.dataset.copyLink)) ? 'Đã sao chép link' : 'Không sao chép được link', 'ok');

    const imgBtn = t.closest('[data-img]');
    if (imgBtn) {
      const i = +($('#g-img', body)?.dataset.i || 0);
      const action = imgBtn.dataset.img;
      try {
        if (action === 'copy') {
          if (!canCopyImage()) return toast('Trình duyệt không cho sao chép ảnh ở đây — hãy dùng nút "Tải ảnh"', 'warn');
          try {
            await copyImage(p.images[i]);
          } catch {
            return toast('Không sao chép được ảnh — hãy dùng nút "Tải ảnh này"', 'warn');
          }
          toast('Đã sao chép ảnh — dán (Ctrl+V) vào khung chat');
        }
        if (action === 'download') download(p.images[i], fileName(p, i, p.images[i]));
        if (action === 'download-all') {
          for (const [j, url] of p.images.entries()) {
            download(url, fileName(p, j, url));
            await new Promise((r) => setTimeout(r, 300));
          }
          toast(`Đang tải ${p.images.length} ảnh`);
        }
        if (action === 'share') await shareImages(p, p.images, msg.value);
      } catch (err) {
        if (err.name !== 'AbortError') toast(err.message || 'Không thực hiện được', 'warn');
      }
    }
  };

  body.onchange = (e) => {
    const box = e.target.closest('[data-opt]');
    if (!box) return;
    opts[box.dataset.opt] = box.checked;
    saveMsgOpts(opts);
    refreshMessage();
  };

  $('#detail').showModal();
  $('#detail').scrollTop = 0;
  body.scrollTop = 0;
}

// ---------- Sự kiện ----------
function bindEvents() {
  const q = $('#q');
  let timer;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { filters.q = q.value; render(); }, 80);
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = filtered()[0];
      if (first) openDetail(first.id);
    }
    if (e.key === 'Escape') { q.value = ''; filters.q = ''; render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.closest('input, textarea, select') && !$('#detail').open) {
      e.preventDefault();
      q.focus();
      q.select();
    }
  });

  $('#brand-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-brand]');
    if (chip) { filters.brand = chip.dataset.brand; update(); }
  });
  $('#f-cat').addEventListener('change', (e) => { filters.cat = e.target.value; render(); });
  $('#f-price').addEventListener('change', (e) => { filters.price = e.target.value; render(); });
  $('#f-ram').addEventListener('change', (e) => { filters.ram = e.target.value; render(); });
  $('#f-sort').addEventListener('change', (e) => { filters.sort = e.target.value; render(); });
  $('#f-all').addEventListener('change', (e) => { filters.all = e.target.checked; update(); });

  $('#results').addEventListener('click', async (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    if (e.target.closest('[data-quick-copy]')) {
      const p = products.find((x) => x.id === row.dataset.id);
      const choice = { ram: choicesOf(p, 'ram')[0], storage: choicesOf(p, 'storage')[0] };
      const ok = await copyText(buildMessage(p, choice, loadMsgOpts()));
      return toast(ok ? `Đã sao chép tin: ${p.name}` : 'Không sao chép được', ok ? 'ok' : 'warn');
    }
    if (e.target.closest('[data-open]')) openDetail(row.dataset.id);
  });
  $('#results').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open]')) {
      e.preventDefault();
      openDetail(e.target.closest('.row').dataset.id);
    }
  });
  $('#empty').addEventListener('click', (e) => {
    if (e.target.closest('[data-show-all]')) { filters.all = true; $('#f-all').checked = true; update(); }
  });

  const dialog = $('#detail');
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => q.focus({ preventScroll: true }));

  $('#logout').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
  });
}

(async function init() {
  $('#logo-icon').innerHTML = icon('laptop', 22);
  $('#search-icon').innerHTML = icon('search', 20);
  $('#nav-admin').innerHTML = `${icon('pen', 17)}<span>Quản lý máy</span>`;
  $('#logout').innerHTML = icon('logout', 18);
  bindEvents();
  try {
    [products, suppliers, settings] = await Promise.all([
      api('/api/admin/products'),
      api('/api/admin/suppliers'),
      api('/api/settings'),
    ]);
  } catch (err) {
    $('#empty').hidden = false;
    $('#empty').textContent = 'Không tải được dữ liệu: ' + err.message;
    return;
  }
  products.forEach((p) => (p._hay = haystack(p)));
  $('#shop-name').textContent = settings.shopName || '';
  update();
})();
