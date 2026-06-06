from pathlib import Path
from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from typing import Optional
from app.core.config import settings
from app.core.i18n import get_translator
from app.api.routes import daily_logs
import time
import logging
import traceback
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Header, Request as FastAPIRequest

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("eFit")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # App startup logic
    print("Starting up eFit Backend services...")
    yield
    # App shutdown logic
    print("Shutting down eFit Backend services...")

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
    docs_url="/docs",      # Swagger UI URL
    redoc_url="/redoc",    # ReDoc URL
    lifespan=lifespan
)

# Configure CORS
origins = [
    "http://localhost:3000",      # Next.js Local Port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],          # Allow all HTTP methods
    allow_headers=["*"],          # Allow all HTTP headers
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"🚀 Incoming Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"✅ Completed: {request.method} {request.url.path} - Status: {response.status_code} in {process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"❌ Error on {request.method} {request.url.path} in {process_time:.3f}s: {str(e)}", exc_info=True)
        raise e

@app.exception_handler(Exception)
async def global_exception_handler(request: FastAPIRequest, exc: Exception):
    logger.error(f"💥 Unhandled Exception on {request.method} {request.url.path}: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

# API Endpoint with Auto i18n
@app.get("/api/v1/welcome", tags=["General"])
async def welcome(
    accept_language: Optional[str] = Header("vi"),
):
    # Retrieve the translation dictionary based on Accept-Language
    _ = get_translator(accept_language)
    
    return {
        "message": _("welcome_message"),
        "status": "success"
    }

@app.get("/api/v1/health", tags=["General"])
async def health_check(
    accept_language: Optional[str] = Header("vi"),
):
    _ = get_translator(accept_language)
    return {
        "status": "online",
        "message": _("health_online"),
        "database": "connected (mocked)",
        "ai_service": "ready"
    }

@app.get("/api/v1/error-demo", tags=["General"])
async def error_demo(
    accept_language: Optional[str] = Header("vi"),
):
    _ = get_translator(accept_language)
    return {
        "error": _("error_invalid_credentials"),
        "status": "failed"
    }

# Register Routers
from app.api.routes import auth, roles, users, permissions, foods, categories, uploads, workouts, sessions, nutrition_plans
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(roles.router, prefix="/api/v1/roles", tags=["Roles"])
app.include_router(permissions.router, prefix="/api/v1/permissions", tags=["Permissions"])
app.include_router(daily_logs.router, prefix="/api/v1/daily-logs", tags=["Daily Logs"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Nutrition Categories"])
app.include_router(foods.router, prefix="/api/v1/foods", tags=["Nutrition Foods"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["File Uploads"])
app.include_router(workouts.router, prefix="/api/v1/workout-programs", tags=["Workout Schedule"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["Sessions & Phases"])
app.include_router(nutrition_plans.router, prefix="/api/v1", tags=["Nutrition Plan"])

# Mount static files for uploaded content
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
