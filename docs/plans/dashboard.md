# Đặc Tả Nghiệp Vụ & Giao Diện: Trang Dashboard Trung Tâm (eFit)

Trang Dashboard (Bảng điều khiển) là màn hình trung tâm của ứng dụng **eFit**, đóng vai trò cấu trúc lại dữ liệu thô từ nhật ký hằng ngày (`DailyLog`) thành các thông tin có tính hành động (**Actionable Data**). Thiết kế tuân thủ tư duy **AI-First**, giúp người dùng biết ngay mình đang đi đúng hay lệch hướng so với mục tiêu của Phase hiện tại.

---

## 1. Cấu Trúc Các Khối Thông Tin Chiến Lược

Giao diện Dashboard được chia thành 4 phân khu chức năng chính theo sơ đồ lưới (Grid) tối ưu cho cả hiển thị di động (Mobile) và máy tính (Desktop):

### 1.1. Khối Tổng Quan Chu Kỳ Hiện Tại (Current Session Status)

* **Mục tiêu:** Định vị vị trí của người dùng trên tổng hành trình dài hạn.
* **Các chỉ số hiển thị:**
  * **Tiến độ Mùa giải (Session Progress):** Hiển thị thanh tiến trình (Progress Bar) trực quan. *Ví dụ: "Ngày 24 / 90 của Mùa Siết Cơ Hè 2026"*.
  * **Giai đoạn hiện tại (Active Phase):** Tên Phase đang kích hoạt (Ví dụ: *"Phase 2: Thắt chặt Calorie"*), đi kèm bộ đếm ngược số ngày còn lại của Phase.
  * **Khoảng cách mục tiêu:** Hiển thị song song Cân nặng hiện tại \(Được lấy từ daily log gần nhất) và Cân nặng mục tiêu của Session để theo dõi độ chênh lệch.

### 1.2. Khối Chỉ Số Kỷ Luật (Compliance Dashboard)

* **Mục tiêu:** Thống kê mức độ nghiêm túc của người tập thông qua các thuật toán so sánh dữ liệu thực tế vs mục tiêu.
* **Các chỉ số hiển thị:**
  * **Điểm Kỷ luật Hôm nay (Today's Compliance Score):** Hiển thị dưới dạng biểu đồ vòng tròn (Donut Chart) từ 0% đến 100%, cấu thành từ:
    * *% Kỷ luật Dinh dưỡng:* Độ lệch % giữa Calorie/Macros thực tế nạp vào so với Snapshot Target của Phase.
    * *% Kỷ luật Tập luyện:* Trạng thái hoàn thành (`is_workout_completed`) giáo án của ngày.
  * **Biểu đồ Xu hướng Kỷ luật Tuần (Weekly Compliance Trend):** Biểu đồ cột (Bar Chart) hiển thị điểm kỷ luật tổng hợp của 7 ngày gần nhất để phát hiện các ngày bị hổng kỷ luật (thường là cuối tuần).

### 1.3. Khối Tương Quan Dinh Dưỡng & Thể Chất (Correlation Analytics)

* **Mục tiêu:** Đồng bộ hóa và tìm ra mối quan hệ nhân quả giữa việc ăn uống và sự biến đổi hình thể.
* **Biểu đồ áp dụng:** Biểu đồ đường trục kép (Dual-Axis Line Chart) tích hợp trên cùng một khung thời gian (Tuần/Tháng):
  * **Trục trái (Đường 1):** Biến động cân nặng thực tế (`weight`) hằng ngày.
  * **Trục phải (Đường 2):** Lượng Calorie nạp vào thực tế (`calories_in`) đè lên đường thẳng mục tiêu snapshot (`target_calories_snapshot`).

### 1.4. Khối Dự Báo & Khuyến Nghị Từ Trợ Lý AI (AI Insights)

* **Mục tiêu:** Ứng dụng mô hình trí tuệ nhân tạo để phân tích chuỗi thời gian (Timeseries data) và đưa ra quyết định thông minh.
* **Các tính năng hiển thị:**
  * **Cảnh báo điểm chững (Plateau Prediction):** AI phát hiện nếu lượng calo nạp vào đúng chuẩn nhưng cân nặng không giảm trong nhiều ngày, đưa ra dự báo chững cân trước 5 ngày.
  * **Khuyến nghị Macros nhanh:** Nhắc nhở thiếu/thừa chất thời gian thực (Ví dụ: *"Hôm nay bạn thiếu 15g Protein, hãy bổ sung 100g ức gà vào bữa tối"*).
  * **Cảnh báo quá tải (Overtraining Warning):** Phân tích chỉ số mệt mỏi (`fatigue_level`) và giờ ngủ (`sleep_hours`) để khuyên người dùng nghỉ ngơi tránh chấn thương.

---

## 2. Đặc Tả Thiết Kế Kỹ Thuật (Technical Specification)

### 2.1. API Endpoints Yêu Cầu

Để render toàn bộ dữ liệu cho trang Dashboard, Frontend sẽ thực hiện gọi các API bất đồng bộ sau từ Backend FastAPI:

* `GET /api/v1/sessions/active`: Lấy thông tin metadata của Session và Phase hiện tại đang chạy.
* `GET /api/v1/dashboard/compliance-stats?period=7days`: Lấy mảng dữ liệu điểm số kỷ luật phục vụ cho biểu đồ cột tuần.
* `GET /api/v1/dashboard/correlation-chart?period=30days`: Trả về mảng dữ liệu chuỗi thời gian bao gồm `log_date`, `weight`, `calories_in`, và `target_calories_snapshot`.
* `GET /api/v1/dashboard/ai-insights`: Gọi xuống AI Service để lấy chuỗi văn bản phân tích và dự báo được sinh tự động.

### 2.2. Công Nghệ Triển Khai Gợi Ý

* **Frontend (Next.js):** Sử dụng thư viện **Recharts** hoặc **Chart.js** để dựng các biểu đồ tương tác. Áp dụng hệ thống Grid của **TailwindCSS** kết hợp với các component Card của **shadcn/ui**.
* **Backend (FastAPI & PostgreSQL):** Sử dụng các hàm Window Functions của PostgreSQL để tính toán toán học các chỉ số lũy kế, độ lệch chuẩn giữa mục tiêu và thực tế trước khi trả về cho Frontend, giúp giảm tải việc xử lý logic ở phía Client.
