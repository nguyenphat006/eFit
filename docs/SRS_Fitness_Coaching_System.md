# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
# HỆ THỐNG COACHING FITNESS

| Hạng mục | Thông tin |
|---|---|
| Tên dự án | Fitness Coaching Platform (tên tạm, chờ đặt chính thức) |
| Phiên bản tài liệu | 1.0 |
| Ngày phát hành | 10/06/2026 |
| Trạng thái | Draft – chờ review |
| Người soạn | (điền tên) |

---

## 1. GIỚI THIỆU

### 1.1 Mục đích

Tài liệu này mô tả đầy đủ các yêu cầu chức năng và phi chức năng của **Hệ thống Coaching Fitness** — một nền tảng số phục vụ hai nhóm người dùng chính: (1) người tập luyện cá nhân (Trainee/Self-coached User) và (2) huấn luyện viên cá nhân (Personal Trainer – PT) quản lý học viên. Tài liệu là cơ sở để đội phát triển, kiểm thử, và các bên liên quan thống nhất phạm vi sản phẩm, đồng thời làm khung cho việc lập kế hoạch các phase phát triển kế tiếp.

### 1.2 Phạm vi sản phẩm

Sản phẩm là một ứng dụng web (giai đoạn đầu) cho phép:

- Người dùng cá nhân quản lý toàn bộ hành trình tập luyện theo **chu kỳ mùa giải** (Season: Cutting / Bulking / Maintain / Recomp), chia nhỏ thành các **Phase** với mục tiêu và thông số riêng.
- Quản lý **giáo án tập luyện** (Training Program), thư viện bài tập, log số liệu chi tiết từng buổi tập (set, reps, weight, RPE, ghi chú).
- Quản lý **kế hoạch dinh dưỡng** theo từng phase (calorie target, macro split, meal log).
- PT quản lý danh sách học viên, **assign** giáo án và dinh dưỡng trực tiếp trên app, theo dõi và phản hồi tiến độ.
- Hệ thống **thống kê – báo cáo** theo ngày, theo phase, theo season.

**Ngoài phạm vi phase 1:** ứng dụng mobile native, marketplace giáo án, livestream coaching, tích hợp wearables. Các nội dung này được liệt kê ở mục 8 và 9 để định hướng phát triển dài hạn.

### 1.3 Định nghĩa, từ viết tắt và thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| User / Trainee | Người dùng tự tập luyện, không có PT hoặc đang tự quản lý song song |
| PT | Personal Trainer — huấn luyện viên cá nhân |
| Student | Học viên — Trainee được một PT quản lý |
| Season | Chu kỳ mùa giải dài hạn (8–24 tuần), gồm các giai đoạn: Cutting, Bulking, Maintain, Recomp |
| Phase | Giai đoạn nhỏ trong Season (2–8 tuần), ví dụ: Hypertrophy, Strength, Peak, Deload |
| Program | Giáo án tập luyện áp dụng cho một Phase, gồm nhiều Workout |
| Workout | Buổi tập trong một tuần, gồm nhiều Exercise |
| Exercise | Bài tập cụ thể (vd: Bench Press, Squat) |
| Set | Một hiệp tập của một bài, có reps, weight, RPE/RIR |
| RPE | Rate of Perceived Exertion — thang đo cường độ chủ quan (1–10) |
| RIR | Reps in Reserve — số reps còn dư trước thất bại |
| 1RM | One-Rep Max — mức tạ tối đa nâng được 1 lần |
| Macro | Macronutrient — Protein, Carb, Fat |
| TDEE | Total Daily Energy Expenditure |
| Daily Log | Bản ghi nhập liệu hàng ngày của Trainee |
| Assignment | Việc PT gán Program / Nutrition Plan cho học viên |
| SRS | Software Requirements Specification |

### 1.4 Tài liệu tham khảo

- Chuẩn IEEE 830-1998 về SRS.
- Các nguyên tắc periodization trong sách *Scientific Principles of Strength Training* (Israetel et al.) — làm nền lý thuyết cho mô hình Season/Phase.

### 1.5 Tổng quan tài liệu

Phần 2 mô tả tổng quan sản phẩm. Phần 3, 4 đi sâu vào yêu cầu chức năng cho từng phân hệ. Phần 5 trình bày yêu cầu phi chức năng. Phần 6 mô tả giao diện. Phần 7 phác họa mô hình dữ liệu khái niệm. Phần 8 trình bày lộ trình phát triển theo các phase. Phần 9 là phụ lục các ý tưởng mở rộng.

---

## 2. MÔ TẢ TỔNG QUAN

### 2.1 Bối cảnh sản phẩm

Hiện nay người tập gym có ba lựa chọn phổ biến: (1) ứng dụng tracking đơn lẻ như Hevy, Strong (chỉ log tạ), (2) ứng dụng dinh dưỡng riêng như MyFitnessPal, và (3) trao đổi với PT qua Zalo/Excel/Google Sheet. Cách làm rời rạc này khiến dữ liệu phân mảnh, khó nhìn thấy tổng thể tiến độ theo chu kỳ mùa giải, và PT phải làm thủ công rất nhiều.

Sản phẩm này hợp nhất bốn mảng — **periodization (chu kỳ hóa)**, **training log**, **nutrition tracking**, và **coach–student workflow** — vào một nền tảng duy nhất, lấy mô hình Season → Phase làm trục xương sống.

### 2.2 Chức năng tổng quát

Ở mức cao, hệ thống cung cấp:

1. **Quản lý chu kỳ tập luyện** theo cấu trúc: Season → Phase → Program → Workout → Exercise → Set.
2. **Daily logging** cho cả tập luyện, dinh dưỡng, và chỉ số cơ thể.
3. **Phân hệ PT** với khả năng quản lý nhiều học viên, tạo template tái sử dụng, assign chương trình, và theo dõi tiến độ.
4. **Báo cáo và thống kê** ở các cấp độ thời gian khác nhau.

### 2.3 Đối tượng người dùng

**Nhóm 1 — Trainee tự quản lý (Self-coached User):**
- Đặc điểm: có kiến thức tập luyện cơ bản đến trung cấp, muốn nơi quản lý tổng hợp.
- Mục tiêu: theo dõi mùa giải cá nhân, nhìn được tiến độ dài hạn.
- Tần suất sử dụng: hàng ngày (log workout), hàng tuần (review phase).

**Nhóm 2 — PT (Personal Trainer):**
- Đặc điểm: huấn luyện viên cá nhân, quản lý 5–50 học viên cùng lúc.
- Mục tiêu: giảm thời gian soạn giáo án thủ công, nắm được tiến độ học viên ngay trên app, gửi phản hồi nhanh.
- Tần suất sử dụng: hàng ngày (kiểm tra log học viên, phản hồi).

**Nhóm 3 — Student (Học viên của PT):**
- Bản chất là Trainee, nhưng được PT quản lý. Mọi thao tác giống Trainee, có thêm tab xem giáo án PT giao và phản hồi với PT.

**Nhóm 4 — Admin (vận hành hệ thống):**
- Quản lý người dùng, nội dung thư viện bài tập, thực phẩm, xử lý report.

### 2.4 Môi trường vận hành

- **Phase 1:** Web app responsive (desktop ưu tiên, mobile web đầy đủ chức năng).
- **Trình duyệt hỗ trợ:** Chrome, Edge, Safari, Firefox phiên bản 2 năm gần nhất.
- **Server-side:** triển khai trên cloud (AWS / GCP / Azure tùy chọn), kiến trúc microservice hoặc modular monolith tùy quy mô khởi đầu.
- **Database:** RDBMS (PostgreSQL) cho dữ liệu transactional, tùy chọn thêm document store (MongoDB) hoặc time-series DB cho daily log nếu volume lớn.

### 2.5 Ràng buộc thiết kế và triển khai

- Giao diện ưu tiên tiếng Việt (phase 1), kiến trúc i18n-ready để mở rộng tiếng Anh sau.
- Đơn vị đo lường: hỗ trợ cả Metric (kg, cm) và Imperial (lb, inch); mặc định Metric cho user VN.
- Tuân thủ quy định bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP (Việt Nam) và sẵn sàng cho GDPR khi mở rộng quốc tế.
- Codebase tổ chức theo hướng dễ tách ra mobile app (React Native hoặc Flutter) ở phase sau — nghĩa là backend phải expose API rõ ràng, độc lập với frontend.

### 2.6 Giả định và phụ thuộc

- Người dùng có Internet liên tục khi sử dụng web app. Offline mode chưa nằm trong phase 1 (sẽ cân nhắc khi làm mobile).
- Dữ liệu thư viện bài tập (exercise database) và dinh dưỡng (food database) sẽ được seed sẵn ở giai đoạn đầu, có nguồn tham khảo từ các database công khai (USDA, etc.) hoặc xây nội bộ.
- Thanh toán cho gói premium (nếu có ở phase sau) sẽ dùng cổng thanh toán bên thứ ba (VNPay, Momo, Stripe).

---

## 3. YÊU CẦU CHỨC NĂNG — PHÂN HỆ DÙNG CHUNG

### 3.1 Đăng ký, đăng nhập, xác thực

| ID | Yêu cầu |
|---|---|
| FR-AUTH-01 | Đăng ký bằng email + mật khẩu. Có xác thực email qua link gửi mail. |
| FR-AUTH-02 | Đăng nhập bằng email/mật khẩu. Hỗ trợ "ghi nhớ đăng nhập". |
| FR-AUTH-03 | Đăng nhập bằng OAuth (Google, Facebook, Apple — tối thiểu Google ở phase 1). |
| FR-AUTH-04 | Quên mật khẩu: gửi link reset qua email, hết hạn sau 30 phút. |
| FR-AUTH-05 | Đổi mật khẩu khi đã đăng nhập, yêu cầu xác nhận mật khẩu cũ. |
| FR-AUTH-06 | Khi đăng ký, người dùng chọn role: **Trainee** hoặc **PT**. Role có thể nâng cấp sau (Trainee → PT) qua quy trình verify. |
| FR-AUTH-07 | Session quản lý bằng JWT, refresh token; auto logout sau 30 ngày không hoạt động. |
| FR-AUTH-08 | 2FA tùy chọn (TOTP qua Google Authenticator) — phase 1.5. |

### 3.2 Quản lý hồ sơ cá nhân

| ID | Yêu cầu |
|---|---|
| FR-PROF-01 | Người dùng nhập/sửa thông tin cá nhân cơ bản: họ tên, ngày sinh, giới tính, chiều cao, cân nặng hiện tại, avatar. |
| FR-PROF-02 | Người dùng nhập thông số tập luyện ban đầu: cân nặng, body fat % (nếu biết), mức độ kinh nghiệm (Beginner / Intermediate / Advanced), mục tiêu chung. |
| FR-PROF-03 | Hệ thống tính TDEE ước lượng dựa trên Mifflin-St Jeor + activity level người dùng chọn. |
| FR-PROF-04 | PT có thêm trường: chứng chỉ (upload file), kinh nghiệm, mô tả ngắn, link mạng xã hội, danh sách dịch vụ. |
| FR-PROF-05 | Người dùng cài đặt đơn vị đo (Metric/Imperial), múi giờ, ngôn ngữ. |

### 3.3 Thông báo (Notification)

| ID | Yêu cầu |
|---|---|
| FR-NOTI-01 | Notification in-app (chuông góc trên). |
| FR-NOTI-02 | Email notification cho các sự kiện quan trọng: PT assign giáo án, có feedback từ PT, kết thúc phase, milestone đạt được. |
| FR-NOTI-03 | Người dùng tùy chỉnh được loại notification nào nhận, kênh nào. |
| FR-NOTI-04 | Push notification trên mobile — phase 2. |

### 3.4 Tìm kiếm

| ID | Yêu cầu |
|---|---|
| FR-SEARCH-01 | Tìm kiếm trong thư viện bài tập theo tên, nhóm cơ, dụng cụ. |
| FR-SEARCH-02 | Tìm kiếm trong thư viện thực phẩm. |
| FR-SEARCH-03 | PT tìm kiếm học viên theo tên, email, trạng thái. |

---

## 4. YÊU CẦU CHỨC NĂNG — PHÂN HỆ TRAINEE / STUDENT

### 4.1 Quản lý chu kỳ mùa giải (Season)

| ID | Yêu cầu |
|---|---|
| FR-SEAS-01 | Tạo Season mới, chọn loại: **Cutting**, **Bulking**, **Maintain**, **Recomp**, **Other (custom)**. |
| FR-SEAS-02 | Mỗi Season có: tên, loại, ngày bắt đầu dự kiến, ngày kết thúc dự kiến, mục tiêu (text), cân nặng mục tiêu, body fat % mục tiêu (tùy chọn). |
| FR-SEAS-03 | Một thời điểm chỉ có **một Season active**. Khi tạo Season mới mà đang có Season active, hệ thống yêu cầu xác nhận kết thúc Season hiện tại. |
| FR-SEAS-04 | Lịch sử Season được lưu vĩnh viễn để so sánh. |
| FR-SEAS-05 | Có thể clone Season cũ làm template cho Season mới. |
| FR-SEAS-06 | Đóng/kết thúc Season thủ công, hệ thống chốt số liệu và tạo báo cáo tổng kết. |
| FR-SEAS-07 | Hệ thống cảnh báo khi cân nặng/body fat đi lệch xa khỏi mục tiêu của Season (vd: đang Cutting mà tăng cân 3 tuần liên tiếp). |

### 4.2 Quản lý Phase trong Season

| ID | Yêu cầu |
|---|---|
| FR-PHASE-01 | Một Season chia thành nhiều Phase nối tiếp nhau. |
| FR-PHASE-02 | Mỗi Phase có: tên, loại (Hypertrophy / Strength / Power / Peak / Deload / Active Recovery / Custom), thời lượng (tuần), mục tiêu cụ thể, calorie target, macro target (g protein / carb / fat hoặc %), volume target (sets/tuần/nhóm cơ — tùy chọn). |
| FR-PHASE-03 | Drag-and-drop thứ tự Phase trên timeline. Hệ thống tự tính lại ngày bắt đầu/kết thúc của Season. |
| FR-PHASE-04 | Có template Phase phổ biến để chọn nhanh (ví dụ: "Hypertrophy 4 tuần", "Deload 1 tuần"). |
| FR-PHASE-05 | Mỗi Phase gắn với **một Training Program** và **một Nutrition Plan**. |
| FR-PHASE-06 | Khi đến ngày bắt đầu Phase mới, hệ thống tự động chuyển sang Phase đó và notify người dùng. |
| FR-PHASE-07 | Cho phép "kéo dài" hoặc "rút ngắn" Phase đang chạy (vd: muốn deload thêm 1 tuần). |

### 4.3 Quản lý giáo án tập luyện (Training Program)

| ID | Yêu cầu |
|---|---|
| FR-PROG-01 | Tạo Program mới, gắn với một Phase. |
| FR-PROG-02 | Cấu trúc Program: chọn split (PPL, Upper/Lower, Full Body, Bro Split, Custom), số ngày tập/tuần. |
| FR-PROG-03 | Với mỗi ngày trong tuần, tạo Workout — danh sách bài tập có sắp xếp thứ tự. |
| FR-PROG-04 | Với mỗi Exercise trong Workout: cấu hình số sets, reps target (vd "8-10"), weight target (kg hoặc % 1RM), RPE/RIR target, tempo, rest time, ghi chú. |
| FR-PROG-05 | Hỗ trợ **Superset, Drop set, Rest-pause** — group bài tập. |
| FR-PROG-06 | Drag-and-drop sắp xếp lại bài tập, sao chép bài tập sang ngày khác. |
| FR-PROG-07 | Lưu Program làm **template cá nhân** để tái sử dụng. |
| FR-PROG-08 | Auto-progression: hệ thống đề xuất tăng tải tuần tiếp theo dựa trên log tuần trước (vd: +2.5kg nếu hoàn thành RPE ≤ 8). |
| FR-PROG-09 | Xem Program ở dạng **lịch tuần** (calendar view) hoặc **danh sách** (list view). |

### 4.4 Thư viện bài tập (Exercise Library)

| ID | Yêu cầu |
|---|---|
| FR-EXLIB-01 | Hệ thống có sẵn database bài tập (~500 bài) gồm: tên (VN + EN), nhóm cơ chính/phụ, dụng cụ, mô tả kỹ thuật, video/ảnh minh họa, mức độ. |
| FR-EXLIB-02 | Người dùng tạo bài tập tùy chỉnh (custom exercise) cho riêng tài khoản mình. |
| FR-EXLIB-03 | PT tạo bài tập tùy chỉnh dùng chung cho mọi học viên của mình. |
| FR-EXLIB-04 | Lọc bài tập theo nhóm cơ, dụng cụ, độ khó, có/không có video. |
| FR-EXLIB-05 | Đánh dấu yêu thích để truy cập nhanh. |

### 4.5 Daily Workout Log

| ID | Yêu cầu |
|---|---|
| FR-LOG-01 | Khi đến ngày tập (theo Program đang active), Trainee mở Workout của ngày → giao diện log từng set. |
| FR-LOG-02 | Mỗi set ghi: weight thực tế, reps thực tế, RPE/RIR, ghi chú nhanh (vd: "đau vai trái nhẹ"). |
| FR-LOG-03 | Hiển thị mức tạ và reps của **lần tập gần nhất** với cùng bài tập làm tham chiếu. |
| FR-LOG-04 | Tính tự động: tổng volume buổi tập (Σ sets × reps × weight), tổng thời gian buổi tập (start–end). |
| FR-LOG-05 | Bộ đếm rest time giữa các set, cấu hình mặc định và tùy chỉnh từng bài. |
| FR-LOG-06 | Đánh dấu hoàn thành / bỏ qua / thay thế bài tập (vd: gym đông, thay Bench bằng DB Press) — có ghi rõ lý do thay. |
| FR-LOG-07 | Tính 1RM estimate (Epley formula) khi RPE đạt ≥ 9 ở một set chính. |
| FR-LOG-08 | Lịch sử log mỗi bài tập: biểu đồ tiến triển weight/volume theo thời gian. |
| FR-LOG-09 | Quick log: copy y nguyên buổi tập tuần trước, chỉ chỉnh weight. |
| FR-LOG-10 | Cho phép log buổi tập trong quá khứ (backfill) trong vòng 7 ngày. |

### 4.6 Quản lý dinh dưỡng (Nutrition)

| ID | Yêu cầu |
|---|---|
| FR-NUTR-01 | Mỗi Phase có **Nutrition Plan** với: calorie target, macro target (g protein / carb / fat), water target. |
| FR-NUTR-02 | Có thể chia macro theo bữa (vd: bữa sáng 30%, trưa 35%, tối 25%, snack 10%). |
| FR-NUTR-03 | Thư viện thực phẩm: tên (VN + EN), calo và macro/100g, đơn vị thường dùng (chén, muỗng…). |
| FR-NUTR-04 | Người dùng tạo thực phẩm tùy chỉnh và **công thức** (combo nhiều thực phẩm). |
| FR-NUTR-05 | Meal log: ghi từng bữa với danh sách thực phẩm + khối lượng. |
| FR-NUTR-06 | Hệ thống tổng hợp ngày: tổng calo nạp, % so với target, biểu đồ phân bổ macro. |
| FR-NUTR-07 | Cảnh báo nếu vượt/thiếu target ≥ 15% trong 3 ngày liên tiếp. |
| FR-NUTR-08 | Quick copy meal: lặp lại bữa của ngày hôm qua. |
| FR-NUTR-09 | Water log riêng, có nút "+250ml" nhanh. |

### 4.7 Body Metrics Tracking

| ID | Yêu cầu |
|---|---|
| FR-BODY-01 | Log định kỳ (đề xuất hàng tuần): cân nặng, body fat % (nếu có), các số đo (ngực, eo, hông, tay, đùi). |
| FR-BODY-02 | Upload progress photo (front, side, back), tùy chọn riêng tư mặc định. |
| FR-BODY-03 | Biểu đồ theo thời gian cho từng chỉ số. |
| FR-BODY-04 | So sánh ảnh trước/sau dạng side-by-side. |
| FR-BODY-05 | Tính moving average cân nặng (7 ngày) để giảm nhiễu daily fluctuation. |

### 4.8 Thống kê và Báo cáo (Trainee)

| ID | Yêu cầu |
|---|---|
| FR-REP-01 | Dashboard hôm nay: workout của hôm nay, nutrition target còn lại, water còn lại, streak. |
| FR-REP-02 | Báo cáo theo ngày: tổng kết workout (volume, thời gian), nutrition (calo, macro), body metric nếu có. |
| FR-REP-03 | Báo cáo theo tuần: tổng volume theo nhóm cơ, frequency, trung bình calo/ngày, tuân thủ macro %. |
| FR-REP-04 | Báo cáo theo Phase: PR mới, biến động cân nặng, % buổi tập hoàn thành, % ngày đạt macro. |
| FR-REP-05 | Báo cáo theo Season: tổng kết toàn chu kỳ — biến động cân nặng/body fat, top 5 PR cải thiện nhiều nhất, biểu đồ volume theo nhóm cơ qua các phase. |
| FR-REP-06 | Export báo cáo dạng PDF / chia sẻ link. |
| FR-REP-07 | So sánh **Season này vs Season trước** ở mọi chỉ số chính. |

---

## 5. YÊU CẦU CHỨC NĂNG — PHÂN HỆ PT

PT có toàn bộ chức năng của Trainee (cho bản thân mình) + các chức năng quản lý học viên dưới đây.

### 5.1 Quản lý học viên

| ID | Yêu cầu |
|---|---|
| FR-PT-01 | PT gửi lời mời học viên qua email hoặc bằng mã mời (invite code). Học viên xác nhận → ghép vào danh sách. |
| FR-PT-02 | Danh sách học viên dạng grid/list, hiển thị: tên, ảnh, Season hiện tại, Phase hiện tại, last active, trạng thái (Active / Paused / Ended). |
| FR-PT-03 | Tìm kiếm, lọc học viên theo trạng thái, mục tiêu, ngày bắt đầu. |
| FR-PT-04 | Xem trang chi tiết một học viên: toàn bộ Season, Phase, Program đang chạy, log gần nhất, các báo cáo. |
| FR-PT-05 | Gắn tag cho học viên (vd: "thi đấu Q3", "phục hồi chấn thương"). |
| FR-PT-06 | Ngừng / khôi phục mối quan hệ coach – student. Dữ liệu lịch sử vẫn được giữ. |
| FR-PT-07 | Ghi chú riêng của PT về học viên (không hiển thị cho học viên). |

### 5.2 Quản lý template

| ID | Yêu cầu |
|---|---|
| FR-PT-08 | PT tạo và lưu **template Program** (giáo án), **template Nutrition Plan**, **template Phase**, **template Season** dùng riêng cho mình. |
| FR-PT-09 | Template tổ chức theo folder/category. |
| FR-PT-10 | Clone template để chỉnh nhanh cho từng học viên. |

### 5.3 Assign giáo án và dinh dưỡng

| ID | Yêu cầu |
|---|---|
| FR-PT-11 | Từ trang học viên, PT chọn "Assign Season/Phase/Program/Nutrition" — chọn template hoặc tạo mới từ đầu. |
| FR-PT-12 | Tùy chỉnh template ngay khi assign (vd: giảm volume xuống cho học viên có chấn thương). |
| FR-PT-13 | PT có thể schedule Phase tự kích hoạt theo ngày. |
| FR-PT-14 | Học viên nhận notification khi có assignment mới. |
| FR-PT-15 | Học viên có quyền **đề xuất chỉnh sửa** (suggest edit) Program/Nutrition do PT giao — PT duyệt hoặc từ chối. |
| FR-PT-16 | Lịch sử các phiên bản Program/Nutrition được lưu (version history). |

### 5.4 Theo dõi tiến độ học viên

| ID | Yêu cầu |
|---|---|
| FR-PT-17 | Dashboard PT: tổng số học viên, danh sách học viên cần chú ý (chưa log 3 ngày, lệch macro nhiều ngày, vượt target Season). |
| FR-PT-18 | Real-time view log của học viên: hôm nay học viên tập gì, log đến đâu. |
| FR-PT-19 | Bộ lọc nhanh: "Học viên chưa hoàn thành workout tuần này", "Cân nặng đi sai hướng", "Có ảnh tiến độ mới". |
| FR-PT-20 | So sánh tiến độ giữa các học viên cùng phase/mục tiêu (anonymized nếu cần). |

### 5.5 Feedback và Communication

| ID | Yêu cầu |
|---|---|
| FR-PT-21 | PT comment trên: từng buổi tập, từng meal log, từng ảnh tiến độ. |
| FR-PT-22 | Học viên reply comment. Tạo luồng trao đổi rõ ràng theo từng đối tượng cụ thể (không phải chat tự do). |
| FR-PT-23 | "Quick reaction" — nút like / well done / needs attention cho PT chấm nhanh. |
| FR-PT-24 | Inbox tổng hợp tất cả tương tác giữa PT và học viên. |
| FR-PT-25 | (Phase 1.5) Chat 1–1 riêng giữa PT và học viên với upload media. |

### 5.6 Báo cáo PT

| ID | Yêu cầu |
|---|---|
| FR-PT-26 | Báo cáo tổng quan tất cả học viên: % tuân thủ tập luyện, % tuân thủ dinh dưỡng, % học viên đạt mục tiêu phase. |
| FR-PT-27 | Báo cáo cho từng học viên (giống Trainee report nhưng PT có thể export gửi học viên). |
| FR-PT-28 | Báo cáo "Season Review" cho học viên: tổng kết và đề xuất Season tiếp theo. |

---

## 6. YÊU CẦU PHI CHỨC NĂNG

### 6.1 Hiệu năng

- Trang dashboard load ≤ 2 giây với mạng 4G thông thường.
- API response time p95 ≤ 500ms cho các thao tác CRUD thông thường.
- Hỗ trợ đồng thời tối thiểu 1.000 user đăng nhập cùng lúc ở phase 1, kiến trúc scale lên 50.000+ ở phase 3.
- Log workout (FR-LOG-02) phải mượt, không lag khi nhập liên tục trên thiết bị di động.

### 6.2 Bảo mật

- Mật khẩu lưu dạng hash bcrypt/argon2.
- HTTPS bắt buộc toàn bộ traffic.
- Phân quyền theo role: Trainee chỉ thấy dữ liệu của mình; PT chỉ thấy dữ liệu của học viên mình; Admin có quyền riêng.
- Audit log cho các thao tác nhạy cảm (đổi mật khẩu, xóa tài khoản, PT xem hồ sơ học viên).
- Dữ liệu sức khỏe (cân nặng, body fat, ảnh tiến độ) được mã hóa at-rest.
- Người dùng có quyền export toàn bộ dữ liệu (data portability) và xóa tài khoản kèm dữ liệu liên quan (GDPR-style right to be forgotten).

### 6.3 Tính khả dụng và UX

- Uptime mục tiêu ≥ 99.5% (tương đương ~3.6h downtime/tháng).
- Giao diện responsive: hoạt động đầy đủ trên màn hình từ 360px (mobile) đến 2560px.
- Empty states và onboarding flow cho user mới — không bao giờ đẩy user vào màn hình trống không hướng dẫn.
- Form luôn có save draft tự động cho các thao tác dài (vd: tạo Program).

### 6.4 Khả năng mở rộng (Scalability & Extensibility)

- Kiến trúc backend tách rõ thành các module: Auth, User, Training, Nutrition, Coaching, Reporting, Notification. Mỗi module có thể tách thành service riêng khi scale.
- API thiết kế theo REST hoặc GraphQL, version hóa (v1, v2…) để không phá vỡ client cũ khi nâng cấp.
- Cấu trúc dữ liệu hỗ trợ multi-tenant từ đầu (sẵn sàng cho mô hình bán cho phòng gym).

### 6.5 Tính tương thích

- Hoạt động trên Chrome, Safari, Firefox, Edge — 2 phiên bản gần nhất.
- iOS Safari 15+, Android Chrome 100+.
- Hỗ trợ keyboard navigation và screen reader ở mức cơ bản (WCAG 2.1 AA).

### 6.6 Sao lưu và khôi phục

- Backup database tự động hàng ngày, lưu tối thiểu 30 ngày.
- Disaster recovery: RTO ≤ 4h, RPO ≤ 24h ở phase 1; siết chặt ở các phase sau.

### 6.7 Tuân thủ quy định

- Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (VN).
- Sẵn sàng tuân thủ GDPR khi mở rộng quốc tế.
- Không lưu trữ thông tin thẻ tín dụng trực tiếp; chỉ dùng cổng thanh toán đạt PCI-DSS.

---

## 7. YÊU CẦU GIAO DIỆN

### 7.1 Giao diện người dùng (UI)

- Design language tham khảo các app fitness hiện đại (Hevy, Macrofactor) nhưng định hình bản sắc riêng — tone tối ưu cho phòng gym (dark mode mặc định là một lựa chọn).
- Layout chính: sidebar trái (navigation) + main content + (tùy ngữ cảnh) right panel.
- Bảng dữ liệu phải hỗ trợ sort, filter, paging hoặc infinite scroll cho dataset > 50 dòng.

### 7.2 Giao diện phần cứng

Không có yêu cầu phần cứng đặc biệt ở phase 1. Phase sau cân nhắc tích hợp wearables (xem 9.2).

### 7.3 Giao diện phần mềm (bên thứ ba)

- **Email service:** SendGrid / AWS SES.
- **Object storage:** S3 hoặc tương đương cho ảnh tiến độ và video.
- **OAuth:** Google, Facebook, Apple.
- **Analytics:** PostHog / Mixpanel.
- **Error tracking:** Sentry.
- **Payment (phase 2+):** VNPay / Momo / Stripe.

### 7.4 Giao diện truyền thông

- API HTTPS REST/GraphQL.
- WebSocket cho realtime notification và (sau) chat.

---

## 8. MÔ HÌNH DỮ LIỆU LOGIC (Mức khái niệm)

Các entity chính và quan hệ chính, không đi sâu vào schema vật lý:

```
User ─┬─ owns ──── Season ──── Phase ──── Program ──── Workout ──── ExerciseInWorkout ──── SetTarget
      │                          │
      │                          └── NutritionPlan ──── MealTarget
      │
      ├─ logs ────── WorkoutLog ──── ExerciseLog ──── SetLog
      ├─ logs ────── MealLog ──── FoodEntry
      ├─ logs ────── BodyMetricLog
      └─ has ───── UserSettings, Notifications

PTProfile ──── extends ──── User (when role = PT)
PTProfile ──── manages ──── CoachingRelationship ──── User (Student)
PTProfile ──── owns ──── Template (Program/Nutrition/Phase/Season)
CoachingRelationship ──── has ──── Assignment ──── (Program | NutritionPlan | Phase | Season)
CoachingRelationship ──── has ──── FeedbackThread ──── Comment

Exercise (master) ──── referenced by ──── ExerciseInWorkout, ExerciseLog
Food (master) ──── referenced by ──── FoodEntry
CustomExercise, CustomFood ──── owned by User or PTProfile
```

**Lưu ý thiết kế:**
- Tách rõ "Program target" (Program/Workout/SetTarget) khỏi "Log thực tế" (WorkoutLog/SetLog) để so sánh kế hoạch vs thực tế được rõ ràng và versioning đơn giản.
- `CoachingRelationship` là entity trung gian để chứa lifecycle (start, end, paused) và mọi assignment/feedback liên quan — tránh nhồi nhét vào User.
- `Assignment` polymorphic: có thể trỏ tới Program, NutritionPlan, Phase, hoặc Season tùy mức độ PT muốn giao.

---

## 9. LỘ TRÌNH PHÁT TRIỂN

### 9.1 Phase 1 — MVP Web App (mục tiêu 3–4 tháng)

**Mục tiêu:** ra mắt web app dùng được cho Trainee cá nhân và PT quản lý <20 học viên.

Phạm vi:
- Auth + profile cơ bản.
- Season → Phase → Program → Workout → Exercise log.
- Nutrition plan + meal log.
- Body metrics log + ảnh tiến độ.
- Phân hệ PT: quản lý học viên, assign Program/Nutrition từ template, comment feedback.
- Báo cáo cấp Day / Week / Phase / Season (cơ bản).
- Notification email + in-app.

**Không có ở phase 1:** OAuth nâng cao (chỉ Google), 2FA, chat realtime, mobile app, payment, marketplace.

### 9.2 Phase 2 — Mobile cho Học viên (mục tiêu sau 2–3 tháng tiếp theo)

**Mục tiêu:** mobile app (iOS + Android) dành chủ yếu cho học viên log workout, log meal, xem giáo án PT giao. PT vẫn dùng web là chính.

Phạm vi mới:
- Mobile app native (React Native hoặc Flutter).
- Push notification.
- Offline mode cho workout log (sync khi có mạng).
- Quick-log experience tối ưu cho mobile (gym dùng tay ướt mồ hôi, thao tác phải gọn).
- Camera tích hợp cho progress photo.

### 9.3 Phase 3 — Mobile đầy đủ + Chat realtime

- PT app mobile đầy đủ.
- Chat 1–1 PT ↔ học viên.
- Video upload cho check form bài tập, PT review video.
- Voice note feedback.

### 9.4 Phase 4 — Tính năng nâng cao

- AI-assisted programming: gợi ý Phase/Program dựa trên mục tiêu và lịch sử.
- AI form check: phân tích video tập (mức cơ bản, dùng pose estimation).
- Auto-adjust target: hệ thống tự đề xuất tăng/giảm calo dựa trên trend cân nặng vs target (theo logic Macrofactor).
- Wearable integration: Apple Health, Google Fit, Garmin, Whoop — đồng bộ HR, calories burned, sleep, steps.

### 9.5 Phase 5 — Marketplace và Community

- Marketplace giáo án: PT đăng giáo án bán cho Trainee.
- Profile public của PT, đánh giá, đặt lịch.
- Community feed: chia sẻ PR, ảnh tiến độ, hỏi đáp.
- Group challenges và leaderboard.

---

## 10. PHỤ LỤC: Ý TƯỞNG MỞ RỘNG (KHO Ý TƯỞNG DÀI HẠN)

Đây là kho ý tưởng để cân nhắc, không cam kết đưa vào lộ trình. Sắp xếp theo nhóm chủ đề.

### 10.1 Tập luyện
- **Auto-deload detection:** hệ thống tự phát hiện dấu hiệu overtraining (volume tăng đột biến, RPE leo cao liên tục, log "mệt") và đề xuất deload.
- **Periodization engine nâng cao:** hỗ trợ DUP (Daily Undulating Periodization), block periodization, conjugate method.
- **Mock meet / Peaking calculator:** tính ngày peak cho người tập powerlifting/strongman thi đấu.
- **Exercise substitution AI:** gợi ý bài thay thế khi gym không có dụng cụ, vẫn giữ stimulus tương đương.

### 10.2 Dinh dưỡng
- **Barcode scanner** cho thực phẩm đóng gói.
- **Food image recognition** ước lượng calo từ ảnh (mức tương đối).
- **Meal planner**: hệ thống đề xuất menu tuần dựa trên target macro, gu ăn uống, thực phẩm hay dùng.
- **Grocery list** tự sinh từ meal plan.
- **Restaurant mode:** ước lượng calo món ăn nhà hàng phổ biến.

### 10.3 Cộng đồng và xã hội
- Feed dạng Strava cho fitness — chia sẻ buổi tập, PR, ảnh.
- Workout buddy matching theo địa điểm và mục tiêu.
- Workout chung realtime (cùng đếm rest, cùng celebrate PR).
- Hashtag và challenge theo mùa (vd: "100kg Bench Challenge").

### 10.4 Coaching và Business cho PT
- **Payment & subscription:** học viên trả phí PT qua app, app giữ % phí dịch vụ.
- **Booking system:** đặt buổi PT 1–1 (online hoặc offline) với lịch tự động.
- **Group coaching:** PT tạo nhóm 5–20 học viên cùng chương trình, theo dõi tập thể.
- **White-label** cho phòng gym: gym mua hệ thống về chạy thương hiệu riêng.
- **PT certification verification:** liên kết với các tổ chức cấp chứng chỉ (NASM, ACE, ISSA…).

### 10.5 Sức khỏe toàn diện
- **Sleep tracking** tích hợp.
- **Stress & HRV** theo dõi recovery.
- **Menstrual cycle tracking** đồng bộ với cường độ tập (cho user nữ).
- **Pain & injury log** với gợi ý điều chỉnh chương trình.
- **Mindfulness module:** thiền ngắn, breathing trước/sau tập.

### 10.6 Cá nhân hóa và AI
- **AI coach chatbot:** trả lời câu hỏi 24/7 dựa trên dữ liệu user, escalate cho PT khi cần.
- **Predictive analytics:** dự đoán cân nặng / 1RM sau N tuần dựa trên trajectory hiện tại.
- **Adaptive programming:** Program tự điều chỉnh weight target dựa trên performance.

### 10.7 Gamification
- Streak, badge, achievement.
- Level system theo tổng volume hoặc tổng số buổi tập.
- Seasonal events.

### 10.8 Hệ sinh thái thiết bị
- Tích hợp với cân thông minh (Withings, Renpho).
- Tích hợp với máy đo InBody / DEXA scan.
- Smart scale auto-sync.
- Garmin/Whoop/Oura cho recovery score.

### 10.9 Quốc tế hóa và mở rộng
- Multi-language (EN, JP, KR, TH).
- Multi-currency cho payment.
- Khu vực hóa food database (US, EU, JP, VN).

### 10.10 Doanh nghiệp (B2B)
- Mô hình bán cho phòng gym chuỗi (FitnessPlus, California Fitness…).
- Dashboard cho chủ phòng gym xem toàn bộ PT và học viên trong hệ thống.
- Tích hợp với hệ thống check-in cửa, hệ thống POS bán supplement.
- Corporate wellness: bán cho công ty cho nhân viên.

---

## 11. TIÊU CHÍ CHẤP NHẬN (Acceptance Criteria) — phase 1

Phase 1 được coi là sẵn sàng release khi:

1. Một Trainee mới có thể đăng ký, tạo Season Cutting 12 tuần với 3 Phase, log đủ 1 tuần workout + nutrition không lỗi.
2. Một PT có thể mời 5 học viên, tạo 1 template Program + 1 template Nutrition, assign cho cả 5 và xem được log realtime của họ.
3. Báo cáo cấp Phase tổng kết đúng các chỉ số đã đặc tả (volume, PR, biến động cân, % tuân thủ).
4. Toàn bộ FR đánh dấu phase 1 đã được kiểm thử và pass.
5. Đáp ứng các yêu cầu phi chức năng ở mục 6 (đo bằng load test + security audit cơ bản).

---

## 12. CÂU HỎI MỞ / CẦN LÀM RÕ

Các điểm chủ dự án (bạn) cần quyết định trước khi vào phase 1:

1. **Mô hình kinh doanh ban đầu:** freemium (free cho Trainee, paid cho PT)? subscription? hay free hoàn toàn cho phase 1 để gom user?
2. **Phạm vi PT phase 1:** có cho PT mời học viên không trả phí qua app không? hay PT tự thu phí ngoài app?
3. **Dữ liệu thư viện bài tập và thực phẩm:** tự xây hay mua/license?
4. **Tone giao diện:** thiên về "athletic/serious" hay "friendly/lifestyle"?
5. **Mức độ ràng buộc giữa Trainee và PT:** một Trainee có thể có nhiều PT cùng lúc không (ví dụ PT chính + PT dinh dưỡng riêng)?
6. **Cấu trúc team phát triển và ngân sách:** ảnh hưởng tới việc nên dùng monolith hay microservice ngay từ đầu.

---

*Kết thúc tài liệu SRS v1.0. Tài liệu này sẽ được cập nhật theo iteration của quá trình phát triển.*
