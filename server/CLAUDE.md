# Server — Django 5.2 LTS + DRF + PostgreSQL

Quy chuẩn chi tiết: `../.claude/rules/backend-django.md` và `../.claude/rules/security-rbac.md` (tự nạp khi làm việc với `server/**`).
Thiết kế CSDL: `database.dbml` — đọc trước khi đụng model.

## Lệnh (chạy trong `server/`, dùng venv `server/venv`)
```bash
# Windows PowerShell: .\venv\Scripts\Activate.ps1   |   Git Bash: source venv/Scripts/activate
python manage.py runserver                 # http://localhost:8000
python manage.py makemigrations
python manage.py migrate
python manage.py check                     # phải 0 issues
python manage.py bootstrap --demo          # migrate + seed_core + seed_nutrition (máy mới)
python manage.py seed_core                 # module registry + quyền + vai trò + admin (idempotent)
python manage.py seed_core --reset-role-permissions  # đưa quyền vai trò mặc định về ROLE_PERMISSION_MAP
python manage.py seed_nutrition            # nhóm thực phẩm + thực phẩm mẫu (idempotent)
python manage.py import_exercises --file <exercises.json>  # thư viện bài tập (hoặc env EXERCISES_DATASET)
celery -A config worker --loglevel=info    # tác vụ xuất/nhập nền (cần Redis)
```
Docker (từ thư mục gốc): `docker compose up -d db redis` rồi chạy Django local, hoặc `docker compose up` cả stack.
Env: `.env` (mẫu `.env.example`); có `DATABASE_URL` → dùng Neon/Postgres đó.

## Bản đồ nhanh
- `config/` — settings, urls (`/api/v1/`, Swagger `/api/schema/swagger-ui/`), celery.
- `apps/core/` — `AuditModel`, `SoftDeleteManager`, `BaseERPViewSet`, `StandardResultsSetPagination`, `success_response`/`error_response`, `ModulePermissionChecker`, `excel_service`, Attachment, DataTransferJob.
- `apps/authentication/` — CustomUser, Role, Permission, ModuleRegistry, JWT, seed commands.
- `apps/audit/` — API đọc lịch sử `django-pghistory`.
- `apps/dashboard/` — API trang Tổng quan (KPI theo quyền).
- `apps/clients/` — học viên (Clients) + hồ sơ thể chất người dùng (FitnessProfiles, `/fitness-profile/me/`).
- `apps/exercises/` — thư viện bài tập; lệnh `import_exercises`.
- `apps/nutrition/` — nhóm thực phẩm + thực phẩm; lệnh `seed_nutrition`.
- `apps/workouts/` — giáo án tập (program → days → exercises, ghi cả cây 1 transaction), clone / mẫu.
- `apps/seasons/` — mùa giải → giai đoạn → thực đơn (NutritionPlans/Meals/MealItems); quy tắc 1 mùa ACTIVE / (owner, client).
- `apps/daily_logs/` — nhật ký hằng ngày (upsert theo ngày, snapshot mục tiêu từ phase, điểm kỷ luật / DFI).
- `apps/ai_coach/` — trợ lý AI (Gemini, `GEMINI_API_KEY`; thiếu khóa thì gợi ý macro / thực đơn chạy offline).
- `apps/core/ownership.py` — `OwnedQuerysetMixin`: non-admin chỉ thấy bản ghi mình sở hữu.
