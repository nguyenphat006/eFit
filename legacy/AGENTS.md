# AGENTS.md — Hướng dẫn cho agent vào sau

> Đọc file này TRƯỚC KHI sửa bất kỳ thứ gì trong project. Tài liệu này ghi lại các quyết định kiến trúc + thay đổi quan trọng để bạn không phá vỡ pattern hiện có.
>
> Phiên bản: 1.0 · Cập nhật: 11/06/2026

---

## 0. TÓM TẮT 30 GIÂY

- **Backend**: chưa chạy local (máy office không có Python admin). Frontend tự fallback sang **mock data** khi gọi API fail. Khi BE chạy thật, code y nguyên dùng API thật, mock tự bypass.
- **Database**: Neon (Postgres cloud free). Connection string trong `backend/.env`. KHÔNG commit file `.env`.
- **Port**: Frontend `http://localhost:3000`, Backend (khi chạy) `http://localhost:8000`.
- **Font**: Chỉ **Inter** (single typeface, đủ weight 400-900). KHÔNG thêm Outfit / JetBrains Mono lại.
- **Design system**: Đọc `docs/eFit Style Guide.html` + `docs/SRS_Fitness_Coaching_System.md` trước khi đụng UI.
- **Auth**: AuthGuard có mock fallback — khi không có backend + không có token, tự inject demo user (`Hoàng Nam · Demo`). Không phá logic này.

---

## 1. KIẾN TRÚC FALLBACK MOCK — ĐỌC KỸ

Đây là pattern quan trọng nhất. Nếu phá pattern này → BE không chạy thì FE chết.

### Cách hoạt động

```
service method
  ├─ try: axiosClient.get/post/...
  │     ├─ success → return real data
  │     └─ network error (no response) → catch → return mock data
  └─ HTTP 4xx/5xx → throw lên caller (để handle 401, validation, v.v. như bình thường)
```

### Utility chính

**`frontend/src/services/api/withFallback.ts`** — wraps any Promise:

```ts
return withFallback(
  axiosClient.get<any, T>('/api/v1/foo'),
  mockFooData,                  // fallback value
  'fooService.getFoo',          // label cho console.warn (dev only)
);
```

### Service có fallback (đã áp dụng)

| Service method | Mock data source |
|---|---|
| `sessionService.listSessions` | `MOCK_SESSIONS` |
| `sessionService.getSession(id)` | `buildMockSessionDetail(id)` |
| `sessionService.getActiveSession` | `MOCK_SESSIONS.find(is_active)` |
| `sessionService.getPhaseDailyLogs(phaseId)` | `mockPhaseDailyLogs(phaseId)` |
| `dailyLogService.getAll` | `MOCK_DAILY_LOGS` (30 ngày) |
| `workoutService.listPrograms` | `MOCK_WORKOUT_PROGRAMS` |
| `nutritionService.getCategories` | `MOCK_FOOD_CATEGORIES` (8 nhóm) |
| `nutritionService.getFoods` | `mockFoodsPaginated()` filter/paginate |
| `authService.login` | `MOCK_TOKEN` (chỉ khi network error) |
| `authService.getMe` | `MOCK_USER` (chỉ khi network error) |

### Quy tắc khi thêm service mới

1. Thêm mock data vào `frontend/src/services/api/mockData.ts`.
2. Wrap call API bằng `withFallback(...)`.
3. **PHÂN BIỆT** network error vs HTTP error:
   - Network error (axios `error.response === undefined`) → fallback mock.
   - HTTP 401/403/404/500 → throw lên (để UI hiển thị lỗi đúng).
   - Trong `authService` đã có helper `isNetworkError(err)`.
4. Mock data phải match TypeScript type của response thật. Đừng để response shape lệch.

### KHÔNG được làm

- ❌ Bypass mock — bỏ try/catch → BE down là FE crash trắng màn.
- ❌ Trả mock khi HTTP 4xx → che lỗi auth/validation.
- ❌ Tạo API endpoint mới ở frontend mà không có BE endpoint tương ứng. Project tinh thần: **FE chạy được standalone, nhưng contract phải khớp BE**.

---

## 2. DESIGN SYSTEM

Source of truth: `docs/eFit Style Guide.html` (1077 dòng, đọc 1 lần là đủ).

### Single font: Inter

- Load qua `next/font` ở `frontend/src/app/layout.tsx`.
- Subset: `latin` + `vietnamese`.
- Weights: 400-900.
- KHÔNG add lại Outfit, JetBrains Mono, hay font nào khác.
- Class `font-display` vẫn tồn tại (alias về Inter) để code cũ không phải sửa thủ công.
- Hierarchy đạt được qua **weight + size + letter-spacing**, không phải qua đổi font.

### Color tokens (BẮT BUỘC)

Tất cả tokens trong `frontend/src/styles/globals.css`. Dùng qua CSS var hoặc Tailwind alias.

**Brand:**
- Primary: `#54B7F0` (eFit blue) — CTA, AI, active state
- Secondary: `#EF9035` (eFit orange) — accent, secondary action

**Semantic:**
- Success: `#10b981` (green) — done, completed
- Warning: `#EF9035` / `#f97316` (orange) — pending, negative delta
- Danger: `#ef4444` (red) — destructive, missed
- Info/Purple: `#a78bfa` — fat macro, neutral metric

**Surfaces:**
- Background: `#f4f6fb` (xám nhạt)
- Card: `#ffffff`
- Border: `#e8f4fc` (soft ocean)
- Text: `#0f172a` / muted `#475569` / dim `#94a3b8`

KHÔNG hardcode `bg-white`, `bg-gray-100`, `text-green-600`... → dùng `bg-card`, `bg-background`, `text-foreground`, `text-success`...

### 3 shared component CHUẨN — dùng cho mọi page

1. **`<HeroHeader>`** (`components/shared/hero-header.tsx`)
   - Dark gradient + bloom blur + dotted grid
   - Props: `eyebrow | pill`, `title`, `titleAccent`, `subtitle`, `action`, `meta`
   - LUÔN dùng ở đầu mỗi page chính

2. **`<KpiTile>`** (`components/shared/kpi-tile.tsx`)
   - Glow blob + icon góc + label nhỏ + value to Outfit + delta + sparkline SVG
   - 6 tones: `blue | orange | green | red | purple | neutral`
   - Group 4 KPI thường nằm sau HeroHeader

3. **`<StatusPill>`** (`components/shared/status-pill.tsx`)
   - Pill uppercase chuẩn với 6 tone đồng bộ
   - Size: `xs | sm`
   - Dùng cho mọi status badge

### Components khác đã có

- `<DataTable>` (`components/shared/data-table.tsx`) — TanStack Table wrapper với pagination
- `<ConfirmDialog>` (`components/shared/confirm-dialog.tsx`) — confirm xoá
- `<ComingSoon>` (`components/shared/coming-soon.tsx`) — placeholder cho page chưa làm
- `<CalendarHeatmap>` (`components/shared/calendar-heatmap.tsx`) — month grid heatmap (dùng ở daily-logs)
- `<DayDetailSheet>` (`components/shared/day-detail-sheet.tsx`) — side panel detail/edit log

### Pattern page chuẩn

```tsx
'use client';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';

export default function FooPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <HeroHeader
        eyebrow="Foo · Module"
        title="Quản lý"
        titleAccent="foo của bạn."
        subtitle="Mô tả ngắn"
        action={<Button>Hành động chính</Button>}
        meta={<><span>X tổng</span><span>Y đang chạy</span></>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="..." value={...} icon={...} tone="..." />
        ...
      </div>
      {/* content */}
    </div>
  );
}
```

---

## 3. METADATA + BREADCRUMB

### Metadata server-side

Mỗi route trong `app/(portal)/dashboard/<feature>/` PHẢI có `layout.tsx` export `metadata`:

```ts
// frontend/src/app/(portal)/dashboard/foo/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tên trang',
  description: 'Mô tả 1 dòng.',
};

export default function FooLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Root layout đã set template `"%s · eFit"` → browser tab tự hiện đúng.

### Breadcrumb dynamic

Topbar (`components/layout/Topbar.tsx`) tự sinh breadcrumb từ pathname.

- Static segments map qua object `SEGMENT_LABELS`. Thêm route mới → thêm entry.
- Numeric segment (vd `/sessions/42`) → hiển thị `#42` mặc định.
- Detail page có entity name động → dùng hook `usePageMeta`:

```tsx
import { usePageMeta } from '@/hooks/usePageMeta';

// Trong client page detail:
usePageMeta({ breadcrumb: session?.name, title: session?.name });
```

Override sẽ tự clear khi component unmount.

---

## 4. AUTHGUARD + MOCK USER

`frontend/src/components/auth/AuthGuard.tsx` có logic 3 nhánh:

1. **Có token + API OK** → fetch real user, login bình thường.
2. **Có token + 401** → logout, redirect `/login` (đúng production).
3. **Không token + API unreachable** → `authService.getMe()` fallback → `MOCK_USER` → set fake token → vào dashboard.

Không phá pattern này. Pattern này phân biệt được:
- **Mất mạng / BE down** → vẫn xem được UI bằng mock.
- **Auth thật sự fail** → đẩy về login (đúng UX).

Mock user trong `authService.ts`:
```
email: demo@efit.local
full_name: Hoàng Nam (Demo)
role: Member
```

---

## 5. SIDEBAR — CẤU TRÚC HIỆN TẠI

`components/layout/Sidebar.tsx` chia 4 nhóm:

```
Tổng quan
  └ Bảng điều khiển     /dashboard

Kế hoạch
  ├ Mùa giải            /dashboard/sessions
  ├ Lịch tập luyện      /dashboard/workouts
  └ Dinh dưỡng          /dashboard/nutrition

Theo dõi
  ├ Nhật ký hằng ngày   /dashboard/daily-logs
  └ CNS & Sức khỏe      /dashboard/cns-health

Hỗ trợ
  ├ Trợ lý AI           /dashboard/ai-coach
  └ Cài đặt             /dashboard/settings
```

**Quy tắc khi thêm route mới:**
1. Tạo `app/(portal)/dashboard/<segment>/page.tsx` + `layout.tsx` (metadata).
2. Thêm entry vào `menuGroups` trong `Sidebar.tsx` ĐÚNG nhóm.
3. Thêm label vào `SEGMENT_LABELS` ở `Topbar.tsx` cho breadcrumb.

KHÔNG được:
- Thêm menu item trỏ route chưa tồn tại (đã dọn `/dashboard/tests` vì 404).
- Tạo page mà không thêm vào sidebar (đã dọn workouts + nutrition vốn thiếu).

---

## 6. SECURITY FIXES ĐÃ LÀM Ở BACKEND

Đọc kỹ trước khi sửa backend code. Đừng vô tình rollback các fix này.

### Critical

1. **`core/config.py`** — `SECRET_KEY` bắt buộc env trong production. Dev tự sinh random per process. KHÔNG hardcode lại.
2. **`db/session.py`** — `DB_ECHO=false` mặc định. KHÔNG đặt `echo=True` cứng → leak SQL + data vào log.
3. **`api/routes/auth.py`** — `LoginForm` bỏ default credentials `admin@efit.com / admin123`. KHÔNG thêm lại default — login rỗng sẽ thành lỗ hổng.
4. **`api/routes/daily_logs.py`** — 4 endpoint trước đây không auth (GET / POST / PUT / DELETE) giờ yêu cầu `CurrentUser` + ownership check. KHÔNG bỏ auth.
5. **`api/routes/nutrition_plans.py`** — Helper `_get_owned_phase()` check ownership qua Session.user_id. KHÔNG bypass.
6. **`schemas/daily_log.py`** — `DailyLogCreate` bỏ field `user_id`. Handler ép `user_id=current_user.id`. KHÔNG cho client tự gán.
7. **`requirements.txt`** — file gốc bị nhiễm UTF-16 ở dòng `openai`. Đã fix. Đừng paste lại từ source khác mà không check encoding.

### Đã thay đổi config

- `core/config.py` thêm: `ENV`, `DB_ECHO`, `DATABASE_URL`, `CORS_ORIGINS`, `cors_origins_list` property.
- `main.py` đọc CORS từ `settings.cors_origins_list` thay vì hardcode `localhost`.

---

## 7. BACKEND CHƯA CHẠY LOCAL — TÌNH TRẠNG HIỆN TẠI

Máy office không có Python (cài bị chặn admin). Đã setup Neon nhưng chưa migrate / seed.

### Khi về máy nhà có Python:

```powershell
cd eFit-main\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python -m app.scripts.seed
python -m scripts.seed_nutrition
uvicorn app.main:app --reload --port 8000  # port 8000
```

Frontend đã trỏ vào `http://localhost:8000` qua `frontend/.env.local`. Đúng port là chạy được luôn.

### Khi chạy bằng Docker

```powershell
docker compose -f docker-compose.backend.yml up --build
```

(File `docker-compose.backend.yml` đã bind `8000:8000`.)

### Tài khoản seed sẵn

- `admin@efit.com` / `admin123` (Admin)
- `user1@efit.com` / `admin123` (Member)
- `trainer@efit.com` / `admin123` (Member)

---

## 8. FILE QUAN TRỌNG CỦA FRONTEND

```
frontend/src/
├── lib/                       # Đã được TẠO MỚI (trước đó thiếu, build fail)
│   ├── utils.ts               # cn() helper (clsx + tailwind-merge)
│   ├── axiosClient.ts         # axios với auth interceptor + 401 handler
│   └── actions.ts             # setLocaleAction server action
├── hooks/
│   ├── usePageMeta.ts         # Hook + Zustand store cho dynamic breadcrumb
│   ├── useAuthStore.ts        # Zustand auth store (token + user)
│   └── useDailyLogs.ts        # React Query hooks
├── components/shared/         # Pattern components — DÙNG, đừng tự build lại
│   ├── hero-header.tsx
│   ├── kpi-tile.tsx
│   ├── status-pill.tsx
│   ├── data-table.tsx
│   ├── confirm-dialog.tsx
│   ├── coming-soon.tsx
│   ├── calendar-heatmap.tsx
│   └── day-detail-sheet.tsx
├── services/api/
│   ├── withFallback.ts        # ⭐ Mock fallback utility
│   ├── mockData.ts            # ⭐ Tất cả mock data tập trung 1 chỗ
│   ├── authService.ts         # Có MOCK_USER + MOCK_TOKEN
│   ├── sessionService.ts
│   ├── dailyLogService.ts
│   ├── workoutService.ts
│   └── nutritionService.ts
├── app/(portal)/dashboard/
│   ├── page.tsx               # Dashboard home (today-centric)
│   ├── sessions/              # CRUD mùa giải + detail page có breadcrumb dynamic
│   ├── daily-logs/            # Calendar heatmap + side panel
│   ├── workouts/              # Card grid
│   ├── nutrition/             # Food library DataTable
│   ├── cns-health/            # ComingSoon
│   ├── ai-coach/              # ComingSoon
│   └── settings/              # Profile form
├── modules/dashboard/
│   └── dashboard-index.tsx    # Dashboard view — đọc kỹ trước khi sửa
└── styles/globals.css         # Color tokens — đừng đụng nếu chưa hiểu design system
```

---

## 9. KNOWN ISSUES (PRE-EXISTING — chưa fix)

Các file dưới đây có TS errors khi `tsc --noEmit` nhưng vẫn build OK với Next dev. KHÔNG phải do mình tạo ra — đã có sẵn trong codebase. Fix khi nào tiện:

- `components/ui/calendar.tsx` — prop `classNames.table` không tồn tại trong react-day-picker v10
- `components/ui/sidebar.tsx` — prop `showOnHover` không hợp lệ
- `app/(portal)/dashboard/sessions/[id]/components/NutritionAssistantDialog.tsx` — dùng field `gender`/`body_fat_percentage`/`activity_level` không có trong `User` type
- `app/(portal)/dashboard/sessions/[id]/components/PhaseFormSheet.tsx` — `PhaseCreate` thiếu field `description`, calendar dùng prop `initialFocus` đã deprecated
- `app/(portal)/dashboard/sessions/components/SessionFormSheet.tsx` — calendar prop `initialFocus`
- `app/(portal)/dashboard/workouts/components/ProgramFormSheet.tsx` — `WorkoutProgramCreate` thiếu `frequency_per_week`
- `app/(portal)/dashboard/settings/page.tsx` — types lệch `null` vs `undefined`

---

## 10. NHỮNG ANTI-PATTERN ĐÃ DỌN — KHÔNG ĐƯỢC LẶP LẠI

| Anti-pattern | Đã sửa | Đừng |
|---|---|---|
| `frontend/src/lib/` thiếu hoàn toàn | Tạo 3 file utils/axiosClient/actions | Xóa thư mục này → build fail toàn FE |
| `SECRET_KEY` hardcode | Force env-based | Hardcode lại trong code |
| `LoginForm` default credentials | Bỏ defaults | Thêm lại defaults dù để debug |
| `daily_logs` endpoints không auth | Add `CurrentUser` + ownership | Bỏ auth check |
| Nhiều font (Outfit + Inter + JetBrains) | Chỉ Inter | Thêm font khác — dùng weight |
| Hardcode color `bg-white`/`text-green-600` | Dùng `bg-card`/`text-success` | Hardcode màu Tailwind |
| `axiosClient` import path thiếu | Tạo `lib/axiosClient.ts` | Dùng `axios` raw rải rác |
| Menu item trỏ route 404 (`tests`) | Xóa khỏi sidebar | Thêm route chưa tồn tại |
| Pre-existing TS error (`is_workout_completed` thiếu) | Bổ sung field vào types | Cast `as any` để né error |

---

## 11. KHI USER YÊU CẦU FEATURE MỚI

Quy trình:

1. **Đọc SRS** (`docs/SRS_Fitness_Coaching_System.md`) để hiểu ý đồ tổng quan.
2. **Đọc Style Guide** (`docs/eFit Style Guide.html`) section liên quan.
3. **Tìm pattern tương đương** trong các page đã refactor (sessions, daily-logs, workouts, nutrition, settings).
4. **Dùng shared components** thay vì tự build (HeroHeader, KpiTile, StatusPill, DataTable, ComingSoon).
5. **Service mới** PHẢI có `withFallback` + mock data.
6. **Page mới** PHẢI có `layout.tsx` với metadata, thêm vào sidebar đúng group, thêm label vào Topbar breadcrumb.
7. **Type-check** trước khi báo xong: `npx tsc --noEmit` (lọc các pre-existing error ở section 9).

---

## 12. KHI USER YÊU CẦU FIX BUG

1. Reproduce trên `http://localhost:3000` trước khi sửa.
2. Nếu là TS error: check pre-existing list ở section 9 — có thể không phải bug mới.
3. Nếu liên quan auth/data: check pattern fallback ở section 1 trước.
4. Verify lại bằng `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3000/<route>` để chắc page compile.

---

## 13. CONTACT POINTS

- Style Guide nguồn: `docs/eFit Style Guide.html`
- SRS: `docs/SRS_Fitness_Coaching_System.md`
- Mock data trung tâm: `frontend/src/services/api/mockData.ts`
- Color tokens: `frontend/src/styles/globals.css`

---

*Nếu thay đổi gì lớn ảnh hưởng nhiều file, update file này trước, code sau.*
