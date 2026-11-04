# Hướng dẫn Chạy Backend eFit Local (Không dùng Docker)

Tài liệu này hướng dẫn bạn cách thiết lập và chạy FastAPI Backend trực tiếp trên hệ điều hành Windows sử dụng cơ sở dữ liệu PostgreSQL cục bộ của bạn.

---

## 📌 Cách Tiếp Cận
Chúng ta sẽ **chạy toàn bộ hệ thống cục bộ (local)**:
- Cơ sở dữ liệu: PostgreSQL cục bộ trên máy của bạn (`localhost:5432`).
- Backend: Chạy trực tiếp bằng Python/FastAPI trên máy của bạn.

---

## 🛠️ Các bước thực hiện chi tiết

### Bước 1: Đảm bảo PostgreSQL cục bộ của bạn đang chạy
Đảm bảo phần mềm PostgreSQL trên máy Windows của bạn đã được khởi động ở cổng `5432` và database tên là `eFit` đã được tạo.

---

### Bước 2: Thiết lập môi trường ảo Python (Venv)
Mở một Terminal mới và di chuyển vào thư mục `backend`:
```powershell
cd d:\Coder\Github\ERICSS\eFit\backend
```

Tạo một môi trường Python ảo mới (nếu chưa tạo):
```powershell
python -m venv .venv
```

Kích hoạt môi trường ảo trên **Windows**:
*   Nếu dùng **PowerShell**:
    ```powershell
    .\.venv\Scripts\Activate.ps1
    ```
    *(Nếu gặp lỗi phân quyền Script, bạn có thể chạy lệnh `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` trước rồi kích hoạt lại).*
*   Nếu dùng **Command Prompt (CMD)**:
    ```cmd
    .\.venv\Scripts\activate.bat
    ```

Khi kích hoạt thành công, bạn sẽ thấy chữ `(.venv)` xuất hiện ở đầu dòng Terminal. **Đây là bước cực kỳ quan trọng để tránh lỗi thiếu thư viện!**

---

### Bước 3: Cài đặt các thư viện cần thiết
Đảm bảo bạn đã kích hoạt môi trường ảo `(.venv)` và đang ở thư mục `backend`, chạy lệnh:

```powershell
pip install -r requirements.txt
```

---

### Bước 4: Chạy Migration để tạo cấu trúc bảng Database
Để khởi tạo toàn bộ bảng dữ liệu (`User`, `DailyLog`, `Phase`, `Session`) vào database `eFit` cục bộ của bạn, hãy chạy lệnh sau:

```powershell
alembic upgrade head
```

---

### Bước 5: Khởi chạy FastAPI Backend
Chạy câu lệnh sau để khởi động server Backend với chế độ tự động cập nhật khi thay đổi code (Hot-reload):

```powershell
uvicorn app.main:app --reload
```

Server của bạn sẽ chạy tại địa chỉ: **`http://127.0.0.1:8000`**

Bạn có thể truy cập trang tài liệu API (Swagger UI) tại: **`http://127.0.0.1:8000/docs`**

---

## 💡 Các mẹo hữu ích

*   **Tự động load cấu hình cục bộ:** Chúng tôi đã cấu hình sẵn cho bạn file `.env` nằm trong thư mục `backend` trỏ thẳng tới PostgreSQL của bạn.
*   **Khi muốn chạy Frontend:** Frontend Next.js của bạn vẫn có thể chạy bình thường bằng cách mở terminal tại thư mục `frontend` và gõ `npm run dev` như bạn đang làm. Nó sẽ tự động kết nối đến Backend local tại cổng `8000`!
