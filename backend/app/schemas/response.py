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

    @property
    def total_pages(self) -> int:
        return (self.total + self.size - 1) // self.size if self.size > 0 else 1
