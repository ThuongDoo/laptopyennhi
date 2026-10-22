let products = [];

const PRICE_RANGES = [
  { id: '0-5', label: 'Dưới 5 triệu', min: 0, max: 5e6 },
  { id: '5-8', label: '5 – 8 triệu', min: 5e6, max: 8e6 },
  { id: '8-12', label: '8 – 12 triệu', min: 8e6, max: 12e6 },
  { id: '12-20', label: '12 – 20 triệu', min: 12e6, max: 20e6 },
  { id: '20+', label: 'Trên 20 triệu', min: 20e6, max: Infinity },
];

// Trạng thái bộ lọc, đồng bộ với URL để gửi link cho khách được
const state = { q: '', cat: '', brands: [], price: '', rams: [], inStock: false, sort: 'featured' };

function readURL() {
  const p = new URLSearchParams(location.search);
  state.q = p.get('q') || '';
  state.cat = p.get('cat') || '';
  state.brands = (p.get('hang') || '').split(',').filter(Boolean);
  state.price = p.get('gia') || '';
  state.rams = (p.get('ram') || '').split(',').filter(Boolean);
  state.inStock = p.get('conhang') === '1';
  state.sort = p.get('sx') || 'featured';
}

function writeURL() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.cat) p.set('cat', state.cat);
  if (state.brands.length) p.set('hang', state.brands.join(','));
  if (state.price) p.set('gia', state.price);
  if (state.rams.length) p.set('ram', state.rams.join(','));
  if (state.inStock) p.set('conhang', '1');
  if (state.sort !== 'featured') p.set('sx', state.sort);
  const qs = p.toString();
  history.replaceState(null, '', '/' + (qs ? '?' + qs : '') + location.hash);
  $$('.catnav a').forEach((a) => {
    const cat = new URL(a.href).searchParams.get('cat') || '';
    a.classList.toggle('active', cat === state.cat);
  });
}

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
const ramKey = (text) => ((text || '').match(/\d+\s*GB/i)?.[0] || '').replace(/\s/g, '').toUpperCase();
// RAM gốc + các mức RAM nâng cấp được
const ramKeys = (p) => [p.ram, ...(p.options?.ram || []).map((o) => o.label)].map(ramKey).filter(Boolean);

function filtered() {
  const q = normalize(state.q.trim());
  const range = PRICE_RANGES.find((r) => r.id === state.price);
  const list = products.filter((p) => {
    const text = normalize([p.name, p.brand, p.cpu, p.ram, p.storage, p.gpu, p.screen].join(' '));
    return (!q || q.split(/\s+/).every((w) => text.includes(w)))
      && (!state.cat || categoryOf(p) === state.cat)
      && (!state.brands.length || state.brands.includes(p.brand))
      && (!range || (p.price >= range.min && p.price < range.max))
      && (!state.rams.length || ramKeys(p).some((r) => state.rams.includes(r)))
      && (!state.inStock || p.status === 'available');
  });
  list.sort((a, b) => {
    if ((a.status === 'sold') !== (b.status === 'sold')) return a.status === 'sold' ? 1 : -1;
    if (state.sort === 'asc') return a.price - b.price;
    if (state.sort === 'desc') return b.price - a.price;
    if (state.sort === 'featured' && a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
  return list;
}

// ---------- Banner trượt ----------
function laptopArt(i, product) {
  if (product?.images[0]) return `<img src="${esc(product.images[0])}" alt="">`;
  return `
    <svg viewBox="0 0 320 210" aria-hidden="true">
      <defs><linearGradient id="scr${i}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ffffff" stop-opacity=".35"/>
      </linearGradient></defs>
      <rect x="52" y="12" width="216" height="142" rx="10" fill="#0f172a"/>
      <rect x="62" y="22" width="196" height="122" rx="4" fill="url(#scr${i})"/>
      <rect x="80" y="44" width="90" height="10" rx="5" fill="#0f172a" opacity=".25"/>
      <rect x="80" y="62" width="60" height="8" rx="4" fill="#0f172a" opacity=".15"/>
      <rect x="80" y="104" width="54" height="18" rx="9" fill="#0f172a" opacity=".3"/>
      <path d="M18 160h284l-14 26a8 8 0 0 1-7 4H39a8 8 0 0 1-7-4z" fill="#e2e8f0"/>
      <rect x="132" y="160" width="56" height="7" rx="3.5" fill="#94a3b8"/>
    </svg>`;
}

function minPrice(list) {
  const prices = list.filter((p) => p.status === 'available' && p.price).map((p) => p.price);
  return prices.length ? Math.min(...prices) : 0;
}

function renderHero() {
  const inCat = (id) => products.filter((p) => categoryOf(p) === id);

  $('#hero-cats').innerHTML = CATEGORIES.map((c) => `
    <a href="/?cat=${c.id}#san-pham" data-cat="${c.id}">
      ${icon(c.icon, 18)}<span>${c.name}</span>${icon('right', 16)}
    </a>`).join('') + `<a href="#san-pham" data-cat="">${icon('laptop', 18)}<span>Xem tất cả máy</span>${icon('right', 16)}</a>`;

  const slides = [
    {
      kicker: settings.shopName, title: 'Laptop cũ chất lượng, giá vừa túi tiền',
      text: 'Máy nào cũng được kiểm tra kỹ, vệ sinh sạch sẽ trước khi đến tay bạn.',
      href: '#san-pham', cta: 'Xem máy đang có', product: products.find((p) => p.featured && p.images[0]),
    },
    ...CATEGORIES.map((c) => {
      const list = inCat(c.id);
      const from = minPrice(list);
      return from && {
        kicker: c.name, title: `${c.name} chỉ từ ${shortMoney(from)}`,
        text: `${list.filter((p) => p.status === 'available').length} máy sẵn hàng, có bảo hành, test máy thoải mái.`,
        href: `/?cat=${c.id}#san-pham`, cta: 'Xem ngay', product: list.find((p) => p.images[0]),
      };
    }).filter(Boolean).slice(0, 3),
  ];

  $('#slides').innerHTML = slides.map((s, i) => `
    <a class="slide slide-${i % 4}" href="${s.href}">
      <div class="slide-text">
        <span class="slide-kicker">${esc(s.kicker)}</span>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        <span class="slide-cta">${esc(s.cta)} ${icon('right', 18)}</span>
      </div>
      <div class="slide-art">${laptopArt(i, s.product)}</div>
    </a>`).join('');
  $('#dots').innerHTML = slides.map((_, i) => `<button aria-label="Banner ${i + 1}" data-i="${i}"></button>`).join('');
  $('.slider-btn.prev').innerHTML = icon('left', 22);
  $('.slider-btn.next').innerHTML = icon('right', 22);
  startSlider(slides.length);

  const sale = products.filter((p) => p.status === 'available' && discount(p));
  const maxOff = Math.max(0, ...sale.map(discount));
  $('#hero-side').innerHTML = `
    <a class="side-banner side-sale" href="${sale.length ? '/#san-pham' : '/?sx=new#san-pham'}">
      <span>${sale.length ? 'Đang giảm giá' : 'Hàng mới về'}</span>
      <b>${sale.length ? `Giảm đến ${maxOff}%` : 'Máy mới cập nhật'}</b>
      <small>${sale.length ? `${sale.length} máy đang có giá tốt` : 'Xem những máy vừa về shop'}</small>
      ${icon('gift', 40)}
    </a>
    <a class="side-banner side-zalo" href="${zaloHref()}" target="_blank" rel="noopener">
      <span>Chưa biết chọn máy nào?</span>
      <b>Tư vấn miễn phí</b>
      <small>Nhắn Zalo cho shop ngay</small>
      ${icon('headset', 40)}
    </a>`;
}

function startSlider(count) {
  const track = $('#slides');
  let index = 0;
  let timer;
  const go = (i) => {
    index = (i + count) % count;
    track.style.transform = `translateX(-${index * 100}%)`;
    $$('#dots button').forEach((d, j) => d.classList.toggle('active', j === index));
  };
  const auto = () => {
    clearInterval(timer);
    if (count > 1) timer = setInterval(() => go(index + 1), 5000);
  };
  $('.slider-btn.prev').onclick = () => { go(index - 1); auto(); };
  $('.slider-btn.next').onclick = () => { go(index + 1); auto(); };
  $('#dots').onclick = (e) => { if (e.target.dataset.i) { go(+e.target.dataset.i); auto(); } };
  $('#slider').onmouseenter = () => clearInterval(timer);
  $('#slider').onmouseleave = auto;
  $('#slider').classList.toggle('single', count < 2);
  go(0);
  auto();
}

// ---------- Các khối trang chủ ----------
function renderPerks() {
  $('#perks').innerHTML = [
    ['clipboard', 'Kiểm tra kỹ từng máy', 'Test đầy đủ trước khi bán'],
    ['shield', 'Bảo hành rõ ràng', 'Thời hạn ghi trên từng máy'],
    ['refresh', 'Đổi trả 7 ngày', 'Nếu máy lỗi phần cứng'],
    ['wrench', 'Hỗ trợ kỹ thuật', 'Cài đặt phần mềm miễn phí'],
  ].map(([ic, t, d]) => `<div class="perk"><span class="perk-icon">${icon(ic, 26)}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('');
}

function renderFeatured() {
  const list = products.filter((p) => p.featured && p.status === 'available');
  $('#featured-block').hidden = !list.length;
  $('#featured').innerHTML = list.map(cardHTML).join('');
}

function renderBrands() {
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  $('#brands').innerHTML = brands.map((b) => `
    <button data-brand="${esc(b)}"><b>${esc(b)}</b><small>${products.filter((p) => p.brand === b && p.status === 'available').length} máy</small></button>`).join('');
  $('#brands').onclick = (e) => {
    const btn = e.target.closest('[data-brand]');
    if (!btn) return;
    state.brands = [btn.dataset.brand];
    update();
    scrollToListing();
  };
}

// ---------- Bộ lọc ----------
function renderFilters() {
  const count = (fn) => products.filter(fn).length;
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  const rams = [...new Set(products.flatMap(ramKeys))].sort((a, b) => parseInt(a) - parseInt(b));

  $('#filters').innerHTML = `
    <div class="filters-head">
      <b>${icon('filter', 18)} Bộ lọc</b>
      <button class="link-btn" data-reset>Xoá tất cả</button>
      <button class="filters-close" aria-label="Đóng">${icon('x', 22)}</button>
    </div>
    <div class="fgroup">
      <h4>Nhu cầu sử dụng</h4>
      <label class="fradio"><input type="radio" name="cat" value="" ${!state.cat ? 'checked' : ''}> Tất cả <small>${products.length}</small></label>
      ${CATEGORIES.map((c) => `<label class="fradio"><input type="radio" name="cat" value="${c.id}" ${state.cat === c.id ? 'checked' : ''}> ${c.name} <small>${count((p) => categoryOf(p) === c.id)}</small></label>`).join('')}
    </div>
    <div class="fgroup">
      <h4>Thương hiệu</h4>
      <div class="fchips">${brands.map((b) => `<label class="fchip"><input type="checkbox" name="brand" value="${esc(b)}" ${state.brands.includes(b) ? 'checked' : ''}><span>${esc(b)}</span></label>`).join('')}</div>
    </div>
    <div class="fgroup">
      <h4>Mức giá</h4>
      <label class="fradio"><input type="radio" name="price" value="" ${!state.price ? 'checked' : ''}> Tất cả</label>
      ${PRICE_RANGES.map((r) => `<label class="fradio"><input type="radio" name="price" value="${r.id}" ${state.price === r.id ? 'checked' : ''}> ${r.label}</label>`).join('')}
    </div>
    ${rams.length ? `<div class="fgroup">
      <h4>RAM</h4>
      <div class="fchips">${rams.map((r) => `<label class="fchip"><input type="checkbox" name="ram" value="${r}" ${state.rams.includes(r) ? 'checked' : ''}><span>${r}</span></label>`).join('')}</div>
    </div>` : ''}
    <div class="fgroup">
      <label class="fswitch"><input type="checkbox" name="instock" ${state.inStock ? 'checked' : ''}> <span>Chỉ hiện máy còn hàng</span></label>
    </div>
    <button class="btn btn-primary btn-block filters-apply">Xem ${filtered().length} kết quả</button>`;
}

function readFilters() {
  const f = $('#filters');
  state.cat = $('input[name=cat]:checked', f)?.value || '';
  state.price = $('input[name=price]:checked', f)?.value || '';
  state.brands = $$('input[name=brand]:checked', f).map((i) => i.value);
  state.rams = $$('input[name=ram]:checked', f).map((i) => i.value);
  state.inStock = $('input[name=instock]', f).checked;
}

function resetFilters() {
  Object.assign(state, { q: '', cat: '', brands: [], price: '', rams: [], inStock: false });
  const input = $('.search input');
  if (input) input.value = '';
  update();
}

function renderActiveFilters() {
  const chips = [];
  if (state.q) chips.push(['q', `“${state.q}”`]);
  if (state.cat) chips.push(['cat', categoryName(state.cat)]);
  state.brands.forEach((b) => chips.push(['brand:' + b, b]));
  if (state.price) chips.push(['price', PRICE_RANGES.find((r) => r.id === state.price)?.label]);
  state.rams.forEach((r) => chips.push(['ram:' + r, 'RAM ' + r]));
  if (state.inStock) chips.push(['instock', 'Còn hàng']);
  $('#active-filters').innerHTML = chips.length
    ? chips.map(([k, l]) => `<button data-remove="${esc(k)}">${esc(l)} ${icon('x', 14)}</button>`).join('') + '<button class="link-btn" data-reset>Xoá tất cả</button>'
    : '';
}

function update() {
  const list = filtered();
  $('#grid').innerHTML = list.map(cardHTML).join('');
  $('#empty').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} sản phẩm`;
  $('#listing-title').textContent = state.q ? `Kết quả cho “${state.q}”` : categoryName(state.cat) || 'Tất cả laptop';
  $$('.sortbar [data-sort]').forEach((b) => b.classList.toggle('active', b.dataset.sort === state.sort));
  const n = state.brands.length + state.rams.length + (state.cat ? 1 : 0) + (state.price ? 1 : 0) + (state.inStock ? 1 : 0);
  $('#filter-toggle').innerHTML = `${icon('filter', 16)} Bộ lọc${n ? ` <span class="badge-count">${n}</span>` : ''}`;
  renderFilters();
  renderActiveFilters();
  writeURL();
}

const scrollToListing = () => $('#san-pham').scrollIntoView({ behavior: 'smooth' });
const openFilters = (open) => document.body.classList.toggle('filters-open', open);

function bindEvents() {
  $('#filters').addEventListener('change', () => { readFilters(); update(); });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) resetFilters();
    if (e.target.closest('.filters-close, .filters-apply') || e.target.id === 'filter-overlay') openFilters(false);
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const [key, val] = rm.dataset.remove.split(/:(.*)/);
      if (key === 'q') { state.q = ''; $('.search input').value = ''; }
      if (key === 'cat') state.cat = '';
      if (key === 'price') state.price = '';
      if (key === 'instock') state.inStock = false;
      if (key === 'brand') state.brands = state.brands.filter((b) => b !== val);
      if (key === 'ram') state.rams = state.rams.filter((r) => r !== val);
      update();
    }
  });
  $('#filter-toggle').addEventListener('click', () => openFilters(true));
  $('#empty-reset').addEventListener('click', resetFilters);
  $('.sortbar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sort]');
    if (btn) { state.sort = btn.dataset.sort; update(); }
  });

  // Tìm kiếm & chọn danh mục ngay trên trang, không cần tải lại
  $('.search').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = $('.search input').value.trim();
    update();
    scrollToListing();
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.catnav a, .hero-cats a, .footer a[href^="/?cat"], .side-sale');
    if (!a) return;
    e.preventDefault();
    const url = new URL(a.href, location.href);
    state.cat = url.searchParams.get('cat') || '';
    if (url.searchParams.get('sx')) state.sort = url.searchParams.get('sx');
    update();
    scrollToListing();
  });
}

(async function init() {
  readURL();
  products = await loadCommon();
  renderHero();
  renderPerks();
  renderFeatured();
  renderBrands();
  bindEvents();
  update();
  if (location.hash === '#san-pham') setTimeout(scrollToListing, 50);
})();
