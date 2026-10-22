# Laptop Yến Nhi – Tra cứu cấu hình & giá

Công cụ nội bộ để tra nhanh cấu hình, giá và ảnh máy khi tư vấn khách, rồi sao chép tin nhắn / ảnh gửi qua Zalo, Messenger. Toàn bộ trang cần đăng nhập.

Dữ liệu lưu trong thư mục `data/` (file JSON), ảnh lưu trong `public/uploads/` – không cần cài database.

## Chạy

Yêu cầu: đã cài [Node.js](https://nodejs.org) (bản 18 trở lên).

```bash
npm install     # chỉ cần chạy lần đầu
npm start
```

- Tra cứu: http://localhost:4000
- Quản lý máy: http://localhost:4000/admin
- Mật khẩu mặc định: **admin123** → đổi trong **Quản lý máy → Cài đặt**.

### Dùng trên điện thoại

Điện thoại và máy tính chạy server phải cùng mạng Wi-Fi. Trên điện thoại mở `http://<IP máy tính>:4000` (xem IP bằng lệnh `ipconfig`, dòng *IPv4 Address*).
Khi mở bằng địa chỉ IP (http), trình duyệt không cho **sao chép ảnh** — dùng nút **Tải ảnh** thay thế. Sao chép tin nhắn vẫn dùng được.

## Trang Tra cứu

- Gõ tên máy, CPU, card, RAM... (không dấu cũng được): `3561`, `i7 16gb`, `quadro`, `lets note`. Bấm **/** để nhảy vào ô tìm, **Enter** để mở máy đầu tiên.
- Lọc theo hãng, nhu cầu, mức giá, RAM (tính cả mức nâng cấp được).
- Bấm vào máy để xem: ảnh (sao chép / tải / tải tất cả), chọn RAM – ổ cứng để ra giá, bảng giá mọi cấu hình, link bài đăng, thông tin nhà cung cấp.
- **Tin nhắn gửi khách** được soạn sẵn theo cấu hình đang chọn, có thể sửa trước khi bấm **Sao chép tin nhắn**. Tuỳ chọn kèm mô tả / ưu đãi / SĐT – địa chỉ shop.
- Nút **Sao chép tin** ở mỗi dòng: sao chép nhanh tin nhắn cấu hình gốc.

## Trang Quản lý máy

| Mục | Việc làm được |
|---|---|
| 💻 Máy | Thêm / sửa / xoá máy, ảnh, tuỳ chọn nâng cấp RAM – ổ cứng, link bài đăng, trạng thái Còn hàng / Hết hàng / Ngừng bán |
| 🏭 Nhà cung cấp | Danh sách nơi lấy máy, tra máy theo nhà cung cấp, theo dõi bảo hành nhà cung cấp |
| ⚙️ Cài đặt | Tên shop, SĐT, Zalo, địa chỉ, giờ mở cửa, ưu đãi (dùng trong tin nhắn gửi khách); đổi mật khẩu |

Mô tả máy: dòng bắt đầu bằng `## ` là tiêu đề nhỏ, dòng bắt đầu bằng `- ` là gạch đầu dòng.

## Sao lưu

Copy 2 thư mục `data/` và `public/uploads/` là giữ được toàn bộ máy, ảnh và nhà cung cấp.

## Web bán hàng cũ

Các file của giao diện bán hàng trước đây được cất trong `archive/web-ban-hang/` (không còn được dùng).
"# laptopyennhi" 
