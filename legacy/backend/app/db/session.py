from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Engine reads DATABASE_URL + DB_ECHO from Settings (env-backed). echo defaults to False
# so query/parameter contents do not leak into logs.
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DB_ECHO, future=True)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session():
    async with async_session() as session:
        yield session
