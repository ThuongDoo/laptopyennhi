// Dùng chung cho trang chủ và trang chi tiết máy
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n ? Number(n).toLocaleString('vi-VN') + '₫' : 'Liên hệ');
const shortMoney = (n) => (n >= 1e6 ? (Math.floor(n / 1e5) / 10).toLocaleString('vi-VN') + ' triệu' : money(n));
const discount = (p) => (p.oldPrice > p.price && p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

const CATEGORIES = [
  { id: 'van-phong', name: 'Văn phòng – Học tập', icon: 'briefcase' },
  { id: 'gaming', name: 'Laptop Gaming', icon: 'gamepad' },
  { id: 'do-hoa', name: 'Đồ hoạ – Kỹ thuật', icon: 'palette' },
  { id: 'mong-nhe', name: 'Mỏng nhẹ – Doanh nhân', icon: 'feather' },
  { id: 'macbook', name: 'MacBook', icon: 'apple' },
];
const categoryOf = (p) => p.category || 'van-phong';
const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name || '';

// ---------- Icon (bộ Lucide, vẽ bằng SVG) ----------
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  refresh: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  ram: '<path d="M6 19v-3M10 19v-3M14 19v-3M18 19v-3M8 11V9M16 11V9M12 11V9M2 15h20M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z"/>',
  disk: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01M10 16h.01"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  gamepad: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  feather: '<path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22M17.5 15H9"/>',
  apple: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  headset: '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
};

function icon(name, size = 20) {
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

const PLACEHOLDER = `<div class="no-image">${icon('laptop', 56)}<span>Ảnh đang cập nhật</span></div>`;

// ---------- Liên kết liên hệ ----------
let settings = {};
const telHref = () => 'tel:' + (settings.phone || '').replace(/[^\d+]/g, '');
const zaloHref = () => 'https://zalo.me/' + (settings.zalo || settings.phone || '').replace(/\D/g, '');

// ---------- Header ----------
function renderHeader() {
  const params = new URLSearchParams(location.search);
  const currentCat = location.pathname === '/' ? params.get('cat') : null;
  $('#site-header').innerHTML = `
    <div class="topbar">
      <div class="container topbar-inner">
        <span>${icon('shield', 15)} Bảo hành tận tâm</span>
        <span>${icon('refresh', 15)} Đổi trả 7 ngày nếu lỗi</span>
        <span class="hide-sm">${icon('clipboard', 15)} Test máy thoải mái trước khi mua</span>
        <a href="${telHref()}" class="topbar-hotline">Hotline: <b>${esc(settings.phone)}</b></a>
      </div>
    </div>
    <header class="header">
      <div class="container header-main">
        <a href="/" class="logo">
          <span class="logo-mark">${icon('laptop', 22)}</span>
          <span class="logo-text">${esc(settings.shopName || 'Laptop Yến Nhi')}<small>Laptop cũ chất lượng</small></span>
        </a>
        <form class="search" action="/" method="get" role="search">
          <input name="q" value="${esc(params.get('q') || '')}" placeholder="Bạn cần tìm laptop gì? (vd: ThinkPad, i5, 16GB...)" aria-label="Tìm kiếm">
          <button aria-label="Tìm">${icon('search', 20)}</button>
        </form>
        <a href="${telHref()}" class="header-action">
          ${icon('phone', 22)}<span><small>Gọi mua hàng</small><b>${esc(settings.phone)}</b></span>
        </a>
        <a href="${zaloHref()}" target="_blank" rel="noopener" class="header-action hide-md">
          ${icon('chat', 22)}<span><small>Tư vấn miễn phí</small><b>Chat Zalo</b></span>
        </a>
      </div>
      <nav class="catnav">
        <div class="container catnav-inner">
          <a href="/#san-pham" class="${location.pathname === '/' && !currentCat ? 'active' : ''}">${icon('menu', 17)} Tất cả laptop</a>
          ${CATEGORIES.map((c) => `<a href="/?cat=${c.id}#san-pham" class="${currentCat === c.id ? 'active' : ''}">${icon(c.icon, 17)} ${c.name}</a>`).join('')}
        </div>
      </nav>
    </header>`;
}

// ---------- Footer ----------
function renderFooter() {
  $('#site-footer').innerHTML = `
    <section class="steps">
      <div class="container">
        <h2>Mua laptop tại ${esc(settings.shopName)} chỉ 3 bước</h2>
        <ol class="steps-list">
          <li><span>1</span><div><b>Chọn máy ưng ý</b><p>Xem cấu hình, giá và ảnh thật của từng máy ngay trên web.</p></div></li>
          <li><span>2</span><div><b>Gọi hoặc nhắn Zalo</b><p>Shop tư vấn kỹ và giữ máy cho bạn.</p></div></li>
          <li><span>3</span><div><b>Đến shop test máy</b><p>Kiểm tra thoải mái, ưng ý mới thanh toán.</p></div></li>
        </ol>
      </div>
    </section>
    <footer class="footer">
      <div class="container footer-grid">
        <div>
          <a href="/" class="logo logo-light">
            <span class="logo-mark">${icon('laptop', 22)}</span>
            <span class="logo-text">${esc(settings.shopName)}<small>Laptop cũ chất lượng</small></span>
          </a>
          <p class="footer-about">${esc(settings.slogan)}</p>
          <div class="socials">
            <a href="${zaloHref()}" target="_blank" rel="noopener" aria-label="Zalo" class="social-zalo">Zalo</a>
            ${settings.facebook ? `<a href="${esc(settings.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook', 18)}</a>` : ''}
            <a href="${telHref()}" aria-label="Gọi điện">${icon('phone', 18)}</a>
          </div>
        </div>
        <div>
          <h3>Danh mục</h3>
          <ul>${CATEGORIES.map((c) => `<li><a href="/?cat=${c.id}#san-pham">${c.name}</a></li>`).join('')}</ul>
        </div>
        <div>
          <h3>Chính sách</h3>
          <ul class="policy-list">
            <li>${icon('shield', 16)} Bảo hành theo từng máy, ghi rõ trên web</li>
            <li>${icon('refresh', 16)} Đổi trả trong 7 ngày nếu lỗi phần cứng</li>
            <li>${icon('clipboard', 16)} Kiểm tra máy trước khi thanh toán</li>
            <li>${icon('wrench', 16)} Hỗ trợ cài đặt phần mềm miễn phí</li>
          </ul>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <ul class="contact-list">
            <li>${icon('pin', 16)} <span>${esc(settings.address)}</span></li>
            <li>${icon('clock', 16)} <span>${esc(settings.openHours)}</span></li>
            <li>${icon('phone', 16)} <a href="${telHref()}">${esc(settings.phone)}</a></li>
            <li>${icon('chat', 16)} <a href="${zaloHref()}" target="_blank" rel="noopener">Zalo: ${esc(settings.zalo)}</a></li>
          </ul>
        </div>
      </div>
      ${settings.mapUrl && settings.mapUrl.startsWith('https://') ? `
      <div class="container footer-map"><iframe src="${esc(settings.mapUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bản đồ đường đến shop"></iframe></div>` : ''}
      <div class="footer-bottom">
        <div class="container">© ${new Date().getFullYear()} ${esc(settings.shopName)}. Mua bán laptop cũ uy tín.</div>
      </div>
    </footer>
    <div class="float-actions">
      <a class="float-btn float-zalo" href="${zaloHref()}" target="_blank" rel="noopener" aria-label="Chat Zalo">Zalo</a>
      <a class="float-btn float-call" href="${telHref()}" aria-label="Gọi điện">${icon('phone', 22)}</a>
    </div>`;
}

// ---------- Thẻ sản phẩm ----------
function cardHTML(p) {
  const sold = p.status === 'sold';
  const off = discount(p);
  const specs = [['cpu', p.cpu], ['ram', p.ram], ['disk', p.storage], ['monitor', p.screen]].filter(([, v]) => v);
  const upgrades = [p.options?.ram?.length && 'RAM', p.options?.storage?.length && 'ổ cứng'].filter(Boolean);
  return `
    <a class="pcard ${sold ? 'is-sold' : ''}" href="/san-pham/${esc(p.id)}">
      <div class="pcard-img">
        ${p.images[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" loading="lazy">` : PLACEHOLDER}
        <div class="pcard-tags">
          ${off && !sold ? `<span class="tag tag-sale">Giảm ${off}%</span>` : ''}
          ${p.featured && !sold ? '<span class="tag tag-hot">Nổi bật</span>' : ''}
        </div>
        ${sold ? '<span class="sold-stamp">Đã bán</span>' : ''}
      </div>
      <div class="pcard-body">
        <h3 class="pcard-name">${esc(p.name)}</h3>
        <ul class="pcard-specs">${specs.map(([ic, v]) => `<li>${icon(ic, 14)}<span>${esc(v)}</span></li>`).join('')}</ul>
        ${upgrades.length && !sold ? `<p class="pcard-opt">${icon('layers', 14)} Có tuỳ chọn nâng cấp ${upgrades.join(', ')}</p>` : ''}
        <div class="pcard-price">
          ${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : '<s class="empty-s"></s>'}
          <strong>${sold ? 'Đã bán' : money(p.price)}</strong>
        </div>
        <div class="pcard-foot">
          ${p.condition ? `<span class="cond">${esc(p.condition)}</span>` : ''}
          ${p.warranty ? `<span class="warranty">${icon('shield', 14)} BH ${esc(p.warranty)}</span>` : ''}
        </div>
      </div>
    </a>`;
}

// ---------- Khởi động chung ----------
async function loadCommon() {
  const [s, products] = await Promise.all([
    fetch('/api/settings').then((r) => r.json()),
    fetch('/api/products').then((r) => r.json()),
  ]);
  settings = s;
  renderHeader();
  renderFooter();
  return products;
}
