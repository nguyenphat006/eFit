# Tài liệu Đặc tả Hệ thống Thiết kế Thương hiệu eFit
## (eFit Brand Design System & UI/UX Specification)

Hệ thống thiết kế của **eFit** được xây dựng dựa trên nhận diện thương hiệu của Logo chính thức, kết hợp **Màu xanh đại dương hoàng gia (Ocean Blue)** và **Màu vàng thể thao năng động (Sporty Gold Yellow)**.

Ứng dụng được thiết kế ưu tiên **Chế độ sáng (Light Mode)** làm mặc định để mang lại cảm giác sạch sẽ, khỏe khoắn và năng lượng của phòng tập, đồng thời thiết lập sẵn hệ thống biến HSL tương thích hoàn toàn với **shadcnUI** để người dùng có thể dễ dàng kích hoạt **Chế độ tối (Dark Mode)** ở các giai đoạn sau.

Tài liệu này đồng bộ trực tiếp với [globals.css](file:///d:/Coder/Github/ERICSS/eFit/frontend/src/styles/globals.css) và [tailwind.config.ts](file:///d:/Coder/Github/ERICSS/eFit/frontend/tailwind.config.ts).

---

## 1. Hệ thống Màu sắc Thích ứng (Adaptive Brand Color Palette)

Bảng màu được ánh xạ thông qua các CSS Variables (biến HSL) động, tự động thích ứng khi chuyển đổi giao diện:

| Token HSL Variable | Giá trị Light Mode (Mặc định) | Giá trị Dark Mode (Chuyển đổi) | Ứng dụng thực tế | Ý nghĩa thương hiệu |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `#f5f8fc` (Sky White) | `#050b18` (Space Navy) | Nền chính của toàn hệ thống | Trong trẻo ở bản Sáng, sâu thẳm ở bản Tối |
| `--foreground` | `#0d1933` (Navy Đậm) | `#fafcff` (Ice White) | Chữ chính, tiêu đề chính | Đảm bảo tỷ lệ tương phản tiếp cận (WCAG) |
| `--card` | `#ffffff` (Trắng tinh) | `#0a1226` (Navy Sậm) | Nền các khối chức năng, biểu đồ | Làm nổi bật các phần tử quan trọng |
| `--primary` | `#1e4cbd` (Ocean Blue) | `#3b82f6` (Neon Blue) | Màu chủ đạo (Nút bấm, AI highlights) | Thể hiện công nghệ AI và đại dương |
| `--secondary` | `#eab308` (Sporty Yellow) | `#facc15` (Bright Gold) | Màu nhấn (Chỉ số, Active states, Warnings) | Kích thích năng lượng thể thao, hành động |
| `--border` | `#e2e8f0` (Xám nhạt) | `#1e293b` (Navy tối) | Đường viền ngăn cách | Gọn gàng, tinh tế và mỏng nhẹ |

### Dải màu Gradient đại diện thương hiệu (Brand Gradient):
Sử dụng dải màu gradient kết hợp chạy mượt mà đại diện cho sự kết nối giữa **Thể lực (Vàng năng lượng)** và **Trí tuệ / Công nghệ AI (Xanh đại dương)**:
*   `bg-gradient-to-r from-primary via-[#3b82f6] to-secondary`

---

## 2. Hệ thống Chữ & Phân cấp (Typography & Hierarchy)

eFit sử dụng hai phông chữ Google Fonts cao cấp nhằm tối ưu hóa trải nghiệm đọc:

### A. Phông chữ Tiêu đề (Display Font): **Outfit**
*   **Kiểu dáng**: Geometric Sans-serif, hiện đại, góc cạnh thể thao và mạnh mẽ.
*   **Ứng dụng**: Dùng cho toàn bộ thẻ tiêu đề `<h1>, <h2>, <h3>, <h4>, <h5>, <h6>`, các chỉ số số liệu lớn, và logo.
*   **Cấu hình**: `font-display` trong Tailwind.

### B. Phông chữ Nội dung (Body/UI Font): **Inter**
*   **Kiểu dáng**: Neo-grotesque Sans-serif, tối ưu tuyệt đối cho giao diện ứng dụng phức tạp.
*   **Ứng dụng**: Dùng cho chữ nội dung, nhãn nút bấm, bảng dữ liệu lịch tập, nhật ký dinh dưỡng và các đoạn hội thoại chat AI.
*   **Cấu hình**: `font-sans` trong Tailwind.

---

## 3. Hiệu ứng Cao cấp Thích ứng (Light/Dark Adaptive Effects)

Để giao diện "sống động" và tăng tính tương tác ở cả hai chế độ sáng/tối,globals.css tích hợp sẵn:

### A. Thẻ Kính mờ thích ứng (`.glass-card`)
*   *Chế độ Sáng*: Nền trắng mờ trong suốt 70% với bóng đổ dịu nhẹ của xanh đại dương.
*   *Chế độ Tối*: Nền xanh tối mờ trong suốt 50% với viền mỏng và bóng đổ sâu thẳm.

### B. Hiệu ứng Di chuột phát sáng (`.glow-ocean` & `.glow-yellow`)
Khi người dùng di chuột vào thẻ lịch tập hoặc thực đơn, phần tử sẽ tự động dịch chuyển lên 2px và phát sáng quầng sáng xanh đại dương hoặc vàng thể thao dịu mắt, tạo phản hồi UX cao cấp:
```html
<!-- Thẻ tập luyện phát sáng xanh biển hoàng gia -->
<div class="glass-card glow-ocean p-6 rounded-xl"> ... </div>

<!-- Thẻ dinh dưỡng phát sáng vàng năng lượng -->
<div class="glass-card glow-yellow p-6 rounded-xl"> ... </div>
```
