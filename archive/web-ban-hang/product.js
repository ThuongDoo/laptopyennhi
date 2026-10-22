(async function init() {
  const id = decodeURIComponent(location.pathname.split('/').pop());
  const products = await loadCommon();
  const p = products.find((x) => x.id === id);
  if (!p) return renderNotFound();
  render(p, products);
})();

function renderNotFound() {
  $('#pdp').innerHTML = `
    <div class="notfound">
      ${icon('laptop', 64)}
      <h1>Không tìm thấy máy này</h1>
      <p class="muted">Có thể máy đã được gỡ khỏi web. Bạn xem các máy khác hoặc nhắn Zalo để shop tư vấn nhé.</p>
      <a class="btn btn-primary btn-lg" href="/#san-pham">Xem các máy đang có</a>
    </div>`;
}

// Mô tả: "## " → tiêu đề nhỏ, "- " → gạch đầu dòng, còn lại là đoạn văn
function formatDescription(text) {
  let html = '';
  let list = [];
  const flush = () => {
    if (list.length) html += `<ul class="desc-list">${list.map((li) => `<li>${icon('check', 16)}<span>${li}</span></li>`).join('')}</ul>`;
    list = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ')) { list.push(esc(line.slice(2))); continue; }
    flush();
    if (line.startsWith('## ')) html += `<h3>${esc(line.slice(3))}</h3>`;
    else if (line) html += `<p>${esc(line)}</p>`;
  }
  flush();
  return html;
}

function render(p, products) {
  const sold = p.status === 'sold';
  const off = discount(p);
  const cat = categoryOf(p);
  const gifts = (settings.gifts || '').split('\n').map((s) => s.trim()).filter(Boolean);

  // Tuỳ chọn nâng cấp RAM / ổ cứng: cấu hình gốc là lựa chọn đầu tiên (+0đ)
  const groups = [['ram', 'RAM'], ['storage', 'Ổ cứng']]
    .map(([type, title]) => ({
      type, title,
      list: [{ label: p[type] || 'Mặc định', extra: 0, base: true }, ...(p.options?.[type] || [])],
    }))
    .filter((g) => g.list.length > 1 && !sold);
  const choice = Object.fromEntries(groups.map((g) => [g.type, g.list[0]]));
  const extra = () => Object.values(choice).reduce((sum, o) => sum + o.extra, 0);
  const chosen = (type) => choice[type]?.label || p[type];
  const withChoices = (type) => {
    const opts = p.options?.[type] || [];
    return opts.length ? `${p[type] || 'Mặc định'} (có thể nâng cấp: ${opts.map((o) => o.label).join(', ')})` : p[type];
  };

  const keySpecs = [['cpu', 'CPU', p.cpu, ''], ['ram', 'RAM', p.ram, 'ram'], ['disk', 'Ổ cứng', p.storage, 'storage'], ['monitor', 'Màn hình', p.screen, '']].filter(([, , v]) => v);
  const specRows = [
    ['Hãng sản xuất', p.brand], ['Nhu cầu', categoryName(cat)], ['Bộ vi xử lý (CPU)', p.cpu], ['RAM', withChoices('ram')],
    ['Ổ cứng', withChoices('storage')], ['Màn hình', p.screen], ['Card đồ hoạ', p.gpu], ['Tình trạng', p.condition], ['Bảo hành', p.warranty],
  ].filter(([, v]) => v);

  const priceBox = () => {
    if (sold) return '<strong>Đã bán</strong><p>Máy này đã có chủ. Shop có thể tìm giúp bạn máy tương tự!</p>';
    const price = p.price + extra();
    const old = off ? p.oldPrice + extra() : 0;
    return `<div class="price-row"><strong>${money(price)}</strong>${old ? `<s>${money(old)}</s><span class="tag tag-sale">-${Math.round((1 - price / old) * 100)}%</span>` : ''}</div>
      ${old ? `<p>Tiết kiệm <b>${money(old - price)}</b></p>` : ''}
      ${extra() ? `<p class="price-note">Đã gồm nâng cấp: ${groups.filter((g) => !choice[g.type].base).map((g) => `${g.title} ${esc(choice[g.type].label)}`).join(', ')}</p>` : ''}`;
  };
  const related = products
    .filter((x) => x.id !== p.id && x.status === 'available')
    .sort((a, b) => (categoryOf(b) === cat) - (categoryOf(a) === cat) || Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, 5);

  $('#pdp').innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">${icon('home', 15)} Trang chủ</a>${icon('right', 14)}
      <a href="/?cat=${cat}#san-pham">${esc(categoryName(cat))}</a>${icon('right', 14)}
      <span>${esc(p.name)}</span>
    </nav>

    <section class="pdp-top">
      <div class="pdp-gallery">
        <div class="gallery-main ${sold ? 'is-sold' : ''}">
          ${p.images[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" id="main-img">` : PLACEHOLDER}
          ${off && !sold ? `<span class="tag tag-sale">Giảm ${off}%</span>` : ''}
          ${sold ? '<span class="sold-stamp">Đã bán</span>' : ''}
        </div>
        ${p.images.length > 1 ? `<div class="gallery-thumbs">${p.images.map((src, i) =>
          `<button class="${i === 0 ? 'active' : ''}" data-src="${esc(src)}" aria-label="Ảnh ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}
      </div>

      <div class="pdp-info">
        <h1>${esc(p.name)}</h1>
        <div class="pdp-meta">
          ${p.condition ? `<span class="cond">${esc(p.condition)}</span>` : ''}
          ${p.warranty ? `<span>${icon('shield', 15)} Bảo hành ${esc(p.warranty)}</span>` : ''}
          <span class="muted">Mã máy: ${esc(p.id.slice(0, 6).toUpperCase())}</span>
        </div>

        <div class="price-box" id="price-box">${priceBox()}</div>

        ${groups.length ? `<div class="options" id="options">${groups.map((g) => `
          <div class="opt-group">
            <span class="opt-title">Chọn ${g.title}</span>
            <div class="opt-list">${g.list.map((o, i) => `
              <button type="button" class="opt ${i === 0 ? 'active' : ''}" data-type="${g.type}" data-i="${i}" aria-pressed="${i === 0}">
                <b>${esc(o.label)}</b><small>${o.base ? 'Cấu hình gốc' : '+' + money(o.extra)}</small>
              </button>`).join('')}
            </div>
          </div>`).join('')}
        </div>` : ''}

        ${keySpecs.length ? `<div class="key-specs">${keySpecs.map(([ic, k, v, type]) => `
          <div>${icon(ic, 20)}<small>${k}</small><b ${type ? `data-spec="${type}"` : ''}>${esc(v)}</b></div>`).join('')}</div>` : ''}

        ${gifts.length && !sold ? `<div class="gift-box">
          <h3>${icon('gift', 18)} Ưu đãi khi mua tại shop</h3>
          <ul>${gifts.map((g) => `<li>${icon('check', 16)} ${esc(g)}</li>`).join('')}</ul>
        </div>` : ''}

        <div class="buy-actions">
          <button class="btn btn-red btn-xl btn-block" data-order>
            <b>${sold ? 'Nhờ shop tìm máy tương tự' : 'Đặt giữ máy'}</b>
            <small>Để lại SĐT, shop gọi lại ngay</small>
          </button>
          <div class="buy-row">
            <a class="btn btn-primary btn-lg" href="${telHref()}">${icon('phone', 18)} Gọi ${esc(settings.phone)}</a>
            <a class="btn btn-zalo btn-lg" href="${zaloHref()}" target="_blank" rel="noopener">${icon('chat', 18)} Chat Zalo</a>
          </div>
        </div>
      </div>
    </section>

    <section class="pdp-bottom">
      <div class="pdp-content">
        <div class="panel">
          <h2>Thông số kỹ thuật</h2>
          <table class="spec-table">${specRows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</table>
        </div>
        ${p.description ? `<div class="panel"><h2>Mô tả chi tiết</h2><div class="desc">${formatDescription(p.description)}</div></div>` : ''}
      </div>
      <aside class="pdp-aside">
        <div class="panel">
          <h2>Chính sách mua hàng</h2>
          <ul class="policy">
            <li>${icon('clipboard', 22)}<div><b>Test máy thoải mái</b><p>Kiểm tra kỹ tại shop rồi mới thanh toán</p></div></li>
            <li>${icon('shield', 22)}<div><b>Bảo hành ${esc(p.warranty || 'tận tâm')}</b><p>Lỗi phần cứng sửa hoặc đổi miễn phí</p></div></li>
            <li>${icon('refresh', 22)}<div><b>Đổi trả trong 7 ngày</b><p>Nếu máy phát sinh lỗi phần cứng</p></div></li>
            <li>${icon('wrench', 22)}<div><b>Hỗ trợ phần mềm</b><p>Cài đặt, vệ sinh máy miễn phí</p></div></li>
          </ul>
        </div>
        <div class="panel">
          <h2>Xem máy tại shop</h2>
          <ul class="store-info">
            <li>${icon('pin', 18)} <span>${esc(settings.address)}</span></li>
            <li>${icon('clock', 18)} <span>${esc(settings.openHours)}</span></li>
            <li>${icon('phone', 18)} <a href="${telHref()}">${esc(settings.phone)}</a></li>
          </ul>
        </div>
      </aside>
    </section>

    ${related.length ? `<section class="block">
      <div class="block-head"><h2>Có thể bạn quan tâm</h2><a href="/?cat=${cat}#san-pham">Xem thêm</a></div>
      <div class="row-scroll">${related.map(cardHTML).join('')}</div>
    </section>` : ''}

    <div class="buybar">
      <div><small>${esc(p.name)}</small><b id="buybar-price">${sold ? 'Đã bán' : money(p.price)}</b></div>
      <button class="btn btn-red" data-order>${sold ? 'Tìm máy tương tự' : 'Đặt giữ máy'}</button>
    </div>`;

  // Ảnh
  $$('.gallery-thumbs button').forEach((btn) =>
    btn.addEventListener('click', () => {
      $('#main-img').src = btn.dataset.src;
      $$('.gallery-thumbs button').forEach((b) => b.classList.toggle('active', b === btn));
    })
  );

  // Form đặt giữ máy
  const dialog = $('#order-dialog');
  const form = $('#order-form');
  $('#order-title').textContent = sold ? 'Nhờ shop tìm máy tương tự' : 'Đặt giữ máy';
  const renderOrderProduct = () => {
    const config = [chosen('ram') && `RAM ${chosen('ram')}`, chosen('storage')].filter(Boolean).join(' · ');
    $('#order-product').innerHTML = `
      ${p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : `<span class="no-thumb">${icon('laptop', 28)}</span>`}
      <div><b>${esc(p.name)}</b>${config && !sold ? `<small>${esc(config)}</small>` : ''}<span>${sold ? 'Đã bán' : money(p.price + extra())}</span></div>`;
  };

  // Chọn cấu hình → cập nhật giá, thông số và form đặt giữ máy
  $('#options')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.opt');
    if (!btn) return;
    const group = groups.find((g) => g.type === btn.dataset.type);
    choice[group.type] = group.list[+btn.dataset.i];
    $$(`.opt[data-type="${group.type}"]`).forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    $(`[data-spec="${group.type}"]`) && ($(`[data-spec="${group.type}"]`).textContent = chosen(group.type));
    $('#price-box').innerHTML = priceBox();
    $('#buybar-price').textContent = money(p.price + extra());
  });

  $$('[data-order]').forEach((b) => b.addEventListener('click', () => { renderOrderProduct(); dialog.showModal(); }));
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('.form-msg', form);
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: p.id, ram: chosen('ram'), storage: chosen('storage'), ...Object.fromEntries(new FormData(form)) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      form.reset();
      msg.className = 'form-msg ok';
      msg.textContent = 'Đã gửi thành công! Shop sẽ gọi lại cho bạn sớm nhất.';
    } catch (err) {
      msg.className = 'form-msg err';
      msg.textContent = err.message || 'Gửi không thành công, bạn vui lòng gọi trực tiếp nhé.';
    } finally {
      btn.disabled = false;
    }
  });
}
