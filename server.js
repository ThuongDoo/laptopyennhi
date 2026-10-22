const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");
const VIEWS_DIR = path.join(__dirname, "views");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- Lưu trữ bằng file JSON ----------
function readJSON(name, fallback) {
  const file = path.join(DATA_DIR, name);
  if (!fs.existsSync(file)) {
    writeJSON(name, fallback);
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(name, data) {
  const file = path.join(DATA_DIR, name);
  fs.writeFileSync(file + ".tmp", JSON.stringify(data, null, 2));
  fs.renameSync(file + ".tmp", file);
}

const newId = () => crypto.randomBytes(6).toString("hex");

// ---------- Mật khẩu & phiên đăng nhập ----------
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return salt + ":" + crypto.scryptSync(password, salt, 64).toString("hex");
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

readJSON("auth.json", {
  passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "admin123"),
});

// Phiên đăng nhập lưu ra file để khởi động lại server không bị đăng xuất
const SESSION_AGE = 30 * 24 * 60 * 60 * 1000;
const sessions = new Map(Object.entries(readJSON("sessions.json", {}))); // token -> hết hạn lúc
const saveSessions = () => writeJSON("sessions.json", Object.fromEntries(sessions));

function getCookie(req, name) {
  const match = (req.headers.cookie || "").match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function isLoggedIn(req) {
  const token = getCookie(req, "sid");
  const expires = token && sessions.get(token);
  if (!expires) return false;
  if (expires < Date.now()) {
    sessions.delete(token);
    saveSessions();
    return false;
  }
  return true;
}

// Giới hạn số lần thử mật khẩu theo IP
function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (req) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.set(req.ip, list);
    return list.length > max;
  };
}
const loginLimited = rateLimiter(10, 15 * 60 * 1000);

// ---------- Dữ liệu mặc định ----------
// Thông tin shop dùng để ghép vào tin nhắn gửi khách
const DEFAULT_SETTINGS = {
  shopName: "Laptop Yến Nhi",
  phone: "0900 000 000",
  zalo: "0900000000",
  address: "Số nhà, đường, quận/huyện, tỉnh/thành phố",
  openHours: "8:00 – 21:00, tất cả các ngày trong tuần",
  gifts:
    "Tặng balo hoặc túi chống sốc\nTặng chuột không dây\nCài Windows, Office và phần mềm theo yêu cầu\nVệ sinh máy miễn phí trong thời gian bảo hành",
};

const CATEGORIES = ["van-phong", "gaming", "do-hoa", "mong-nhe", "macbook"];

readJSON("settings.json", DEFAULT_SETTINGS);
readJSON("products.json", []);
readJSON("suppliers.json", []);

// ---------- Upload ảnh ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
      cb(null, Date.now() + "-" + crypto.randomBytes(4).toString("hex") + ext);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF."), ok);
  },
});

function deleteImage(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return;
  fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true }, () => {});
}

// ---------- Xử lý dữ liệu sản phẩm ----------
const str = (v, max = 200) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const money = (v) => {
  const n = parseInt(String(v ?? "").replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

// Tuỳ chọn nâng cấp: { ram: [{ label, extra }], storage: [...] } — giá cộng thêm so với cấu hình gốc
const OPTION_TYPES = ["ram", "storage"];

function optionsFromBody(raw) {
  let data = {};
  try {
    data = typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
  } catch {
    /* bỏ qua */
  }
  const options = {};
  for (const type of OPTION_TYPES) {
    const list = Array.isArray(data[type]) ? data[type] : [];
    options[type] = list
      .map((o) => ({ label: str(o?.label, 50), extra: money(o?.extra) }))
      .filter((o) => o.label)
      .slice(0, 10);
  }
  return options;
}

// Link bài đăng quảng cáo (Facebook, Zalo, Chợ Tốt...), mỗi dòng 1 link
function linksFromBody(raw) {
  return String(raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .map((s) => s.slice(0, 500))
    .slice(0, 20);
}

function productFromBody(b) {
  return {
    options: optionsFromBody(b.options),
    name: str(b.name),
    brand: str(b.brand, 50),
    category: CATEGORIES.includes(b.category) ? b.category : "van-phong",
    price: money(b.price),
    cpu: str(b.cpu),
    ram: str(b.ram, 50),
    storage: str(b.storage, 50),
    screen: str(b.screen, 100),
    gpu: str(b.gpu),
    condition: str(b.condition, 100),
    warranty: str(b.warranty, 100),
    description: str(b.description, 5000),
    postLinks: linksFromBody(b.postLinks),
    status: ["available", "sold", "hidden"].includes(b.status)
      ? b.status
      : "available",
    supplierId: readJSON("suppliers.json", []).some((s) => s.id === b.supplierId)
      ? b.supplierId
      : "",
    serial: str(b.serial, 100),
    importDate: /^\d{4}-\d{2}-\d{2}$/.test(b.importDate) ? b.importDate : "",
    supplierWarranty: Math.min(money(b.supplierWarranty), 120),
  };
}

// ---------- App ----------
const app = express();
app.set("trust proxy", "loopback");
app.use(express.json({ limit: "100kb" }));

// --- Đăng nhập ---
app.post("/api/login", (req, res) => {
  if (loginLimited(req))
    return res
      .status(429)
      .json({ error: "Thử sai quá nhiều lần, vui lòng đợi 15 phút." });
  const { passwordHash } = readJSON("auth.json", {});
  if (!checkPassword(String(req.body.password || ""), passwordHash)) {
    return res.status(401).json({ error: "Sai mật khẩu." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_AGE);
  saveSessions();
  res.setHeader(
    "Set-Cookie",
    `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE / 1000}`,
  );
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  sessions.delete(getCookie(req, "sid"));
  saveSessions();
  res.setHeader("Set-Cookie", "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

// Mọi trang, ảnh và API đều cần đăng nhập — chưa đăng nhập thì hiện trang đăng nhập
app.use((req, res, next) => {
  if (req.path === "/favicon.svg" || isLoggedIn(req)) return next();
  if (req.path.startsWith("/api/"))
    return res.status(401).json({ error: "Vui lòng đăng nhập lại." });
  res.status(401).sendFile(path.join(VIEWS_DIR, "login.html"));
});

app.use(express.static(PUBLIC_DIR));
app.get("/admin", (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, "admin.html")),
);

app.get("/api/settings", (req, res) =>
  res.json({ ...DEFAULT_SETTINGS, ...readJSON("settings.json", DEFAULT_SETTINGS) }),
);

// --- API quản lý ---
const admin = express.Router();

admin.get("/products", (req, res) => res.json(readJSON("products.json", [])));

admin.post("/products", upload.array("images", 10), (req, res) => {
  const data = productFromBody(req.body);
  if (!data.name) {
    (req.files || []).forEach((f) => deleteImage("/uploads/" + f.filename));
    return res.status(400).json({ error: "Vui lòng nhập tên máy." });
  }
  const product = {
    id: newId(),
    ...data,
    images: (req.files || []).map((f) => "/uploads/" + f.filename),
    createdAt: Date.now(),
  };
  const products = readJSON("products.json", []);
  products.unshift(product);
  writeJSON("products.json", products);
  res.json(product);
});

admin.put("/products/:id", upload.array("images", 10), (req, res) => {
  const products = readJSON("products.json", []);
  const product = products.find((p) => p.id === req.params.id);
  const newImages = (req.files || []).map((f) => "/uploads/" + f.filename);
  if (!product) {
    newImages.forEach(deleteImage);
    return res.status(404).json({ error: "Không tìm thấy máy." });
  }
  const data = productFromBody(req.body);
  if (!data.name) {
    newImages.forEach(deleteImage);
    return res.status(400).json({ error: "Vui lòng nhập tên máy." });
  }
  let keep = [];
  try {
    keep = JSON.parse(req.body.keepImages || "[]");
  } catch {
    /* bỏ qua */
  }
  keep = keep.filter((url) => product.images.includes(url));
  product.images.filter((url) => !keep.includes(url)).forEach(deleteImage);

  Object.assign(product, data, { images: [...keep, ...newImages] });
  writeJSON("products.json", products);
  res.json(product);
});

admin.patch("/products/:id/status", (req, res) => {
  const products = readJSON("products.json", []);
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Không tìm thấy máy." });
  if (!["available", "sold", "hidden"].includes(req.body.status))
    return res.status(400).json({ error: "Trạng thái không hợp lệ." });
  product.status = req.body.status;
  writeJSON("products.json", products);
  res.json(product);
});

admin.delete("/products/:id", (req, res) => {
  const products = readJSON("products.json", []);
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Không tìm thấy máy." });
  product.images.forEach(deleteImage);
  writeJSON(
    "products.json",
    products.filter((p) => p.id !== req.params.id),
  );
  res.json({ ok: true });
});

// --- Nhà cung cấp ---
function supplierFromBody(b) {
  return {
    name: str(b.name, 150),
    phone: str(b.phone, 30),
    address: str(b.address, 300),
    note: str(b.note, 1000),
  };
}

admin.get("/suppliers", (req, res) => res.json(readJSON("suppliers.json", [])));

admin.post("/suppliers", (req, res) => {
  const data = supplierFromBody(req.body);
  if (!data.name) return res.status(400).json({ error: "Vui lòng nhập tên nhà cung cấp." });
  const suppliers = readJSON("suppliers.json", []);
  if (suppliers.some((s) => s.name.toLowerCase() === data.name.toLowerCase())) {
    return res.status(400).json({ error: "Đã có nhà cung cấp tên này." });
  }
  const supplier = { id: newId(), ...data, createdAt: Date.now() };
  suppliers.push(supplier);
  writeJSON("suppliers.json", suppliers);
  res.json(supplier);
});

admin.put("/suppliers/:id", (req, res) => {
  const suppliers = readJSON("suppliers.json", []);
  const supplier = suppliers.find((s) => s.id === req.params.id);
  if (!supplier) return res.status(404).json({ error: "Không tìm thấy nhà cung cấp." });
  const data = supplierFromBody(req.body);
  if (!data.name) return res.status(400).json({ error: "Vui lòng nhập tên nhà cung cấp." });
  Object.assign(supplier, data);
  writeJSON("suppliers.json", suppliers);
  res.json(supplier);
});

admin.delete("/suppliers/:id", (req, res) => {
  const used = readJSON("products.json", []).filter((p) => p.supplierId === req.params.id).length;
  if (used) {
    return res.status(400).json({
      error: `Không xoá được: còn ${used} máy nhập từ nhà cung cấp này. Hãy đổi nhà cung cấp cho các máy đó trước.`,
    });
  }
  const suppliers = readJSON("suppliers.json", []);
  writeJSON("suppliers.json", suppliers.filter((s) => s.id !== req.params.id));
  res.json({ ok: true });
});

admin.put("/settings", (req, res) => {
  const current = { ...DEFAULT_SETTINGS, ...readJSON("settings.json", DEFAULT_SETTINGS) };
  const next = { ...current };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key in req.body) next[key] = str(req.body[key], 1000);
  }
  writeJSON("settings.json", next);
  res.json(next);
});

admin.post("/password", (req, res) => {
  const { passwordHash } = readJSON("auth.json", {});
  if (!checkPassword(String(req.body.current || ""), passwordHash)) {
    return res.status(400).json({ error: "Mật khẩu hiện tại không đúng." });
  }
  const next = String(req.body.next || "");
  if (next.length < 6)
    return res.status(400).json({ error: "Mật khẩu mới cần ít nhất 6 ký tự." });
  writeJSON("auth.json", { passwordHash: hashPassword(next) });
  res.json({ ok: true });
});

app.use("/api/admin", admin);

// Lỗi upload / lỗi chung
app.use((err, req, res, next) => {
  (req.files || []).forEach((f) => deleteImage("/uploads/" + f.filename));
  const message =
    err.code === "LIMIT_FILE_SIZE"
      ? "Ảnh quá lớn (tối đa 8MB/ảnh)."
      : err.message || "Có lỗi xảy ra.";
  res.status(400).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Tra cứu Laptop Yến Nhi: http://localhost:${PORT}`);
  console.log(`Quản lý máy: http://localhost:${PORT}/admin`);
});
