from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class BaseResponse(BaseModel, Generic[T]):
    status: str = "success"
    message: str = "Operation successful"
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    status: str = "success"
    message: str = "Operation successful"
    data: list[T] = []
    total: int = 0
    page: int = 1
    size: int = 50
    total_pages: int = 1
