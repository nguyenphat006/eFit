from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from app.schemas.base import TimeStampedSchema, IDModel


class ClientBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    current_weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    fitness_goal: Optional[str] = "Maintaining"
    activity_level: Optional[float] = 1.2
    training_frequency: Optional[int] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    """PT tạo học viên mới. coach_id tự gắn từ current_user."""
    pass


class ClientUpdate(BaseModel):
    """Cập nhật thông tin học viên. Chỉ gửi field cần sửa."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    current_weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    fitness_goal: Optional[str] = None
    activity_level: Optional[float] = None
    training_frequency: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ClientReadCore(ClientBase, IDModel):
    coach_id: int
    status: str = "Active"
    user_id: Optional[int] = None  # Liên kết tài khoản


class ClientRead(TimeStampedSchema, ClientReadCore):
    class Config:
        from_attributes = True


class ClientListRead(IDModel):
    """Dạng rút gọn cho danh sách."""
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    current_weight: Optional[float] = None
    fitness_goal: Optional[str] = None
    status: str = "Active"
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class ClientLinkAccount(BaseModel):
    """Liên kết tài khoản eFit cho học viên."""
    user_id: int
