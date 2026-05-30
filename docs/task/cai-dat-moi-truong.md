# Khởi tạo Cấu trúc Dự án và Cài đặt Môi trường cho Hệ thống eFit
## (AI-First Fitness Periodization System)

### 1. ĐÁNH GIÁ & ĐỀ XUẤT CẢI TIẾN CÔNG NGHỆ (2026 Trend)
Dựa trên yêu cầu đặc biệt của bạn về việc quản lý **đa ngôn ngữ (i18n) phía Frontend sử dụng Cookie (không đổi URL/Route)** và cơ chế **Dockerized toàn diện chạy một-chạm**, chúng ta thiết kế hệ thống với kiến trúc như sau:

#### A. Tự động hóa Swagger Docs (FastAPI Native)
*   **FastAPI** tự động sinh tài liệu API (Swagger UI tại `/docs` và ReDoc tại `/redoc`) dựa hoàn toàn vào **Python Type Hints** và các schemas của **Pydantic/SQLModel**.
*   Chúng ta không cần viết bất kỳ cấu hình tài liệu thủ công nào. Chỉ cần khai báo kiểu dữ liệu đầu vào/đầu ra qua class SQLModel/Pydantic, FastAPI sẽ tự động phân tích và tạo Swagger tuyệt đẹp với đầy đủ kiểu dữ liệu, Validation Rules (như độ dài tối thiểu, định dạng email), mã lỗi HTTP, và cho phép test trực tiếp trên trình duyệt.
*   Cần cấu hình thêm Metadata (Title, Description, Version, Tags) tại hàm khởi tạo `FastAPI()` để tài liệu nhìn trực quan và chuyên nghiệp.

#### B. Đa Ngôn Ngữ Không Tiền Tố Route (No-Prefix i18n với Cookie)
*   **Frontend (Next.js 15 + Cookie-based `next-intl`)**:
    *   **Không chia thư mục `[locale]`**: Toàn bộ định tuyến giữ nguyên cấu trúc chuẩn (ví dụ: `/`, `/login`, `/dashboard`). URL sẽ sạch sẽ tuyệt đối và không chứa `/vi` hay `/en`.
    *   **Kiểm tra & Lưu trữ qua Cookie**: Ngôn ngữ được chọn sẽ lưu vào cookie tên là `NEXT_LOCALE`.
    *   **Middleware Nhận diện**: Khi người dùng truy cập trang lần đầu, một middleware gọn nhẹ sẽ kiểm tra xem cookie `NEXT_LOCALE` đã tồn tại chưa. Nếu chưa, nó sẽ đọc ngôn ngữ trình duyệt qua header `Accept-Language` (mặc định là `vi` hoặc `en`), tự động ghi nhận vào Cookie và tiếp tục xử lý.
    *   **Dynamic Loading (Server Components)**: Trong file `src/i18n/request.ts` (chạy hoàn toàn trên server), Next-intl sẽ đọc cookie `NEXT_LOCALE` trực tiếp từ Request để load đúng file dịch JSON tương ứng.
    *   **Instant Switch (Server Actions)**: Khi đổi ngôn ngữ, Client gọi một Server Action để cập nhật cookie `NEXT_LOCALE` trên server, sau đó chạy `router.refresh()`. Trang web sẽ chuyển đổi ngôn ngữ ngay lập tức mà không phải tải lại toàn bộ trình duyệt (F5).
*   **Backend i18n (FastAPI Middleware)**:
    *   Sử dụng Middleware đọc header `Accept-Language` gửi từ Frontend (ví dụ: `vi`, `en`).
    *   Tạo thư mục lưu trữ ngôn ngữ `backend/app/locales/` chứa các file JSON cấu hình như `vi.json`, `en.json`.
    *   Khi có lỗi validation hoặc các thông điệp phản hồi từ hệ thống, backend sẽ tự động tra cứu từ điển ngôn ngữ tương ứng để trả về thông báo bằng tiếng Việt hoặc tiếng Anh.

#### C. Quy trình Chạy Một Bước với Docker Compose (Full-stack)
*   Thay vì chạy từng ứng dụng thủ công ở local, chúng ta sẽ Docker hóa toàn bộ hệ thống gồm 3 thành phần (Services) chính:
    1.  `db`: Container PostgreSQL 15.
    2.  `backend`: Container FastAPI Python 3.12 (Hot-reload cho Local Development bằng cách Mount Volume).
    3.  `frontend`: Container Next.js 15 Node 20 (Hot-reload cho Local Development bằng cách Mount Volume).
*   **Tự động Migration**: Khi container `backend` khởi chạy, nó sẽ tự động đợi PostgreSQL khởi động thành công (`wait-for-it` script hoặc Healthcheck), sau đó thực thi lệnh `alembic upgrade head` để cập nhật cấu trúc database trước khi khởi động ứng dụng FastAPI. Bạn hoàn toàn không cần chạy lệnh migration thủ công bên ngoài máy chủ!

---

### 2. CẤU TRÚC THƯ MỤC TỔNG THỂ (DOCKERIZED & COOKIE i18n)
```text
eFit/
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── api/              # Chứa các router API
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/# auth.py, sessions.py, phases.py, logs.py, ai.py
│   │   │   │   └── api.py    # Gộp tất cả routers v1
│   │   ├── core/             # Cấu hình bảo mật, config.py (Pydantic-settings), i18n.py
│   │   ├── locales/          # File dịch ngôn ngữ Backend
│   │   │   ├── vi.json       # Tiếng Việt
│   │   │   └── en.json       # Tiếng Anh
│   │   ├── models/           # SQLModel Database Models (User, Session, Phase, DailyLog)
│   │   ├── schemas/          # Pydantic Schemas bổ sung
│   │   ├── services/         # Logic nghiệp vụ (Compliance Score, AI Service)
│   │   ├── crud/             # Lớp tương tác DB trực tiếp (CRUD)
│   │   ├── db/               # Khởi tạo session DB
│   │   └── main.py           # File chạy chính, cấu hình CORS, Middleware, Lifespan
│   ├── migrations/           # File migrations do Alembic tự động sinh ra
│   ├── .env.example
│   ├── alembic.ini           # Cấu hình migration database
│   ├── pyproject.toml        # Cấu hình uv, ruff, dependencies
│   ├── Dockerfile            # Dockerfile tối ưu cho Python FastAPI (hỗ trợ Live-reload)
│   ├── start.sh              # Script chạy tự động (chờ DB -> Auto Migrations -> Run App)
│   └── README.md
│
├── frontend/                 # Next.js Frontend
│   ├── messages/             # Thư mục ngôn ngữ Frontend
│   │   ├── vi.json           # Tiếng Việt
│   │   └── en.json           # Tiếng Anh
│   ├── src/
│   │   ├── app/              # Next.js App Router (Chuẩn hóa - KHÔNG chia thư mục [locale])
│   │   │   ├── layout.tsx    # Root layout
│   │   │   ├── page.tsx      # Landing page
│   │   │   ├── login/        # Login page
│   │   │   └── dashboard/    # Dashboard quản lý tập luyện
│   │   ├── components/       # UI Components (Button, Card, Sidebar, LanguageSwitcher)
│   │   │   └── ui/           # Các component tối giản của shadcn/ui
│   │   ├── hooks/            # Custom hooks gọi API (React Query)
│   │   ├── lib/              # Cấu hình tiện ích (api-client.ts, utils.ts, actions.ts)
│   │   ├── types/            # TypeScript interfaces
│   │   ├── store/            # Quản lý State toàn cục bằng Zustand
│   │   ├── styles/           # CSS toàn cục
│   │   ├── i18n/             # Cấu hình i18n Next-intl qua Cookie
│   │   │   └── request.ts    # Tải các bản dịch dựa theo Cookie 'NEXT_LOCALE'
│   │   └── middleware.ts     # Middleware kiểm tra và thiết lập Cookie ngôn ngữ ban đầu
│   ├── public/               # Asset tĩnh
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.ts    # Cấu hình Theme màu Charcoal, Cyber Cyan, Neon Orange
│   ├── Dockerfile            # Dockerfile tối ưu cho Next.js (hỗ trợ Live-reload)
│   └── README.md
│
├── docker-compose.yml        # Setup Toàn Bộ Hệ Thống (DB + Backend + Frontend + Auto Migrations)
└── .gitignore                # Git ignore chung
```

---

### 3. THIẾT LẬP DOCKER ĐỂ KHỞI CHẠY 1 LẦN DUY NHẤT

#### A. Cấu hình Docker ở Root (`docker-compose.yml`)
Tạo file `docker-compose.yml` ở thư mục gốc của dự án để liên kết và khởi động cả 3 dịch vụ cùng một lúc:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: efit_postgres
    restart: always
    environment:
      POSTGRES_USER: efit_user
      POSTGRES_PASSWORD: efit_password
      POSTGRES_DB: efit_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U efit_user -d efit_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: efit_backend
    restart: always
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /app/.venv # Tránh ghi đè môi trường ảo của Container lên Local
    environment:
      - DATABASE_URL=postgresql+asyncpg://efit_user:efit_password@db:5432/efit_db
      - ENV=development
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: efit_frontend
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules # Tránh ghi đè thư mục node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

#### B. Cấu hình Docker cho Backend (`backend/Dockerfile` & `backend/start.sh`)

1.  **Tạo file `backend/Dockerfile`**:
```dockerfile
FROM python:3.12-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết và curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt 'uv' (Package manager cực nhanh) toàn cục
RUN pip install --no-cache-dir uv

# Copy các file cấu hình dependencies
COPY pyproject.toml requirements.txt* ./

# Tạo môi trường ảo và cài đặt dependencies sử dụng uv
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Cài đặt dependencies (Nếu có file requirements.txt)
RUN if [ -f requirements.txt ]; then uv pip install -r requirements.txt; fi
# Cài đặt trực tiếp các gói cốt lõi
RUN uv pip install fastapi uvicorn sqlmodel asyncpg alembic pydantic-settings httpx ruff

# Copy mã nguồn dự án vào container
COPY . .

# Phân quyền thực thi cho file chạy start.sh
RUN chmod +x start.sh

# Cổng chạy ứng dụng
EXPOSE 8000

# Khởi chạy script start.sh
CMD ["./start.sh"]
```

2.  **Tạo file khởi động `backend/start.sh`**:
Script này đảm bảo tự động chạy database migrations qua Alembic khi khởi động container trước khi chạy app:
```bash
#!/bin/bash
set -e

# Tự động thực thi DB Migration bằng Alembic lên phiên bản mới nhất
echo "Applying database migrations via Alembic..."
alembic upgrade head || echo "Migration skipped or failed. Please check your alembic configuration."

# Khởi động ứng dụng FastAPI ở chế độ reload (Hot-reload) để phát triển local
echo "Starting FastAPI Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

#### C. Cấu hình Docker cho Frontend (`frontend/Dockerfile`)
Tạo file `frontend/Dockerfile` tại thư mục `/frontend` hỗ trợ phát triển local với cơ chế live-reload:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết (nếu có)
RUN apk add --no-cache libc6-compat

# Sao chép package.json và lock files
COPY package*.json ./

# Cài đặt tất cả dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Mở cổng 3000 của Next.js
EXPOSE 3000

# Khởi chạy Next.js ở chế độ phát triển (hỗ trợ Hot-reload qua volume mount)
CMD ["npm", "run", "dev"]
```

---

### 4. CẤU HÌNH TỰ ĐỘNG HÓA SWAGGER DOCS & i18n CHO BACKEND

#### A. Cấu hình Swagger Docs tự động (`backend/app/main.py`)
FastAPI tự động phát hiện tất cả các API route và xuất ra Swagger UI. Bạn không cần làm gì thủ công ngoài việc cung cấp chú thích kiểu và mô tả. Dưới đây là code `main.py` hoàn chỉnh:

```python
from fastapi import FastAPI, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
from app.core.i18n import get_translator, Translator

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up eFit Backend services...")
    yield
    print("Shutting down eFit Backend services...")

# Cấu hình chi tiết Swagger Docs ngay tại đây
app = FastAPI(
    title="eFit API Documentation",
    description="""
    ## eFit System - AI-First Fitness Periodization System
    Hệ thống AI tự động tối ưu hóa và lập kế hoạch chu kỳ tập luyện (Fitness Periodization).
    
    ### Tính năng chính:
    * **Auth**: Quản lý tài khoản, phân quyền.
    * **Sessions/Phases**: Quản lý chu kỳ tập luyện khoa học.
    * **Daily Logs**: Ghi chép chỉ số sức khỏe hàng ngày (Cân nặng, Compliance Score).
    * **AI Planner**: Trợ lý AI phân tích và tự động điều chỉnh giáo án.
    """,
    version="1.0.0",
    docs_url="/docs",      # Đường dẫn trang Swagger UI
    redoc_url="/redoc",    # Đường dẫn trang ReDoc thay thế
    lifespan=lifespan
)

# CORS
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint Demo sử dụng i18n
@app.get("/api/v1/welcome", tags=["General"])
async def welcome(
    accept_language: Optional[str] = Header("vi"), # Lấy Accept-Language từ Header
):
    # Khởi tạo bộ dịch dựa theo ngôn ngữ gửi lên
    _ = get_translator(accept_language)
    
    return {
        "message": _("welcome_message"),
        "status": "success"
    }

@app.get("/api/v1/error-demo", tags=["General"])
async def error_demo(accept_language: Optional[str] = Header("vi")):
    _ = get_translator(accept_language)
    return {
        "error": _("error_invalid_credentials"),
        "status": "failed"
    }
```

#### B. Khởi tạo bộ dịch đa ngôn ngữ cho Backend (`backend/app/core/i18n.py`)
Tạo file `backend/app/core/i18n.py` để xử lý chức năng dịch tự động:

```python
import json
import os
from typing import Dict

class Translator:
    def __init__(self, locale: str = "vi"):
        self.locale = "vi" if locale.startswith("vi") else "en"
        self.translations: Dict[str, str] = {}
        self.load_translations()

    def load_translations(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        locale_path = os.path.join(base_dir, "locales", f"{self.locale}.json")
        
        try:
            with open(locale_path, "r", encoding="utf-8") as f:
                self.translations = json.load(f)
        except Exception:
            self.translations = {}

    def translate(self, key: str) -> str:
        return self.translations.get(key, key)

def get_translator(accept_language: str = "vi") -> callable:
    locale = "vi"
    if accept_language:
        first_lang = accept_language.split(",")[0].split("-")[0].lower()
        if first_lang in ["en", "vi"]:
            locale = first_lang
            
    translator = Translator(locale)
    return translator.translate
```

---

### 5. CẤU HÌNH i18n CHO FRONTEND (Next.js 15 + Cookie-based `next-intl`)

Để đảm bảo không chia route dạng `/vi` hay `/en`, chúng ta sử dụng cơ chế đọc và cập nhật trực tiếp qua Cookie `NEXT_LOCALE`.

#### A. Thiết lập Middleware để Nhận diện & Khởi tạo Cookie (`frontend/src/middleware.ts`)
Tạo file `frontend/src/middleware.ts` tại thư mục `src/` để đảm bảo trình duyệt luôn có cookie `NEXT_LOCALE` trước khi người dùng vào bất cứ trang nào:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Kiểm tra xem cookie NEXT_LOCALE đã tồn tại chưa
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  
  if (!localeCookie) {
    // Nếu chưa có cookie, lấy ngôn ngữ ưu tiên của trình duyệt từ Accept-Language header
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferredLocale = acceptLanguage.startsWith('en') ? 'en' : 'vi';
    
    // Ghi nhận cookie ngôn ngữ cho lần truy cập tiếp theo
    response.cookies.set('NEXT_LOCALE', preferredLocale, {
      path: '/',
      maxAge: 31536000, // Tồn tại trong 1 năm (tính bằng giây)
    });
  }
  
  return response;
}

export const config = {
  // Chỉ chạy middleware cho các route trang web, loại trừ API, static files, assets
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

#### B. Cấu hình dynamic request dịch từ Cookie (`frontend/src/i18n/request.ts`)
Khi render Server Components, Next-intl sẽ gọi cấu hình này để tải file dịch. Chúng ta đọc Cookie trực tiếp từ Request:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Đọc cookie NEXT_LOCALE trực tiếp trên Server Side
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';

  return {
    locale,
    // Tải tệp ngôn ngữ tương ứng
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

#### C. Thiết lập Root Layout để tải đa ngôn ngữ (`frontend/src/app/layout.tsx`)
Nhờ có `request.ts` đọc cookie, toàn bộ trang web được bọc bởi `NextIntlClientProvider` ở thư mục gốc mà không cần bọc thư mục `[locale]`:
```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import "@/styles/globals.css"; // File css toàn cục

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // getLocale() và getMessages() tự động lấy thông tin trả về từ request.ts
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className="bg-efit-charcoal text-white font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### D. Tạo Server Action để đổi ngôn ngữ và Reload trang (`frontend/src/lib/actions.ts`)
Viết một Server Action gọn nhẹ để cập nhật cookie `NEXT_LOCALE` phía Server:
```typescript
'use server';

import { cookies } from 'next/headers';

export async function setLocaleAction(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000, // 1 năm
  });
}
```

#### E. Tạo Component đổi ngôn ngữ mượt mà (`frontend/src/components/LanguageSwitcher.tsx`)
Khi người dùng click chọn ngôn ngữ, chúng ta gọi Server Action để lưu Cookie và làm mới trang để áp dụng ngôn ngữ mới ngay lập tức trên URL cũ:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocaleAction } from '@/lib/actions';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    
    startTransition(async () => {
      // 1. Cập nhật cookie NEXT_LOCALE trên Server
      await setLocaleAction(newLocale);
      // 2. Refresh lại các Server Components mà không cần reload trang vật lý (F5)
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 bg-efit-charcoal-200 p-1 rounded-lg border border-efit-charcoal-100">
      <button
        onClick={() => handleLanguageChange('vi')}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
          currentLocale === 'vi' 
            ? 'bg-efit-cyan text-efit-charcoal shadow-md' 
            : 'text-efit-gray-text hover:text-white'
        }`}
      >
        Tiếng Việt
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        disabled={isPending}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
          currentLocale === 'en' 
            ? 'bg-efit-cyan text-efit-charcoal shadow-md' 
            : 'text-efit-gray-text hover:text-white'
        }`}
      >
        English
      </button>
    </div>
  );
}
```

#### F. Sử dụng dịch trong Component bất kỳ (`frontend/src/app/page.tsx`)
```tsx
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function HomePage() {
  const t = useTranslations('Index');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-efit-charcoal relative">
      {/* Nút chuyển đổi ngôn ngữ ở góc trên bên phải */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <div className="text-center space-y-4 max-w-xl">
        <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-efit-cyan to-efit-orange">
          eFit
        </h1>
        <p className="text-xl text-efit-gray-text">
          {t('subtitle')}
        </p>
      </div>
    </main>
  );
}
```

---

### 6. HƯỚNG DẪN KHỞI CHẠY TOÀN BỘ HỆ THỐNG (BẰNG 1 LỆNH)

#### Bước 1: Khởi động Docker Compose
Mở terminal tại thư mục gốc của dự án `eFit` và chạy lệnh sau:
```bash
docker-compose up --build
```
*Hệ thống tự động dựng môi trường, chờ Database sẵn sàng, tự động chạy database migrations qua Alembic, và khởi chạy Frontend Next.js 15 (port 3000) & Backend FastAPI (port 8000) cùng cơ chế live reload qua volume.*

#### Bước 2: Truy cập và Kiểm tra
*   **Trang chủ Frontend (Sạch sẽ - Không đổi URL)**: `http://localhost:3000/`. Đổi ngôn ngữ qua component LanguageSwitcher sẽ tự ghi nhận vào Cookie `NEXT_LOCALE` và tự cập nhật giao diện lập tức.
*   **API Auto Swagger Docs**: `http://localhost:8000/docs` xem đặc tả API tự động.