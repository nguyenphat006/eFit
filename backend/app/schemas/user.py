from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from app.schemas.base import TimeStampedSchema, IDModel

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    fitness_goal: Optional[str] = "Maintenance"
    date_of_birth: Optional[date] = None
    current_weight: Optional[float] = None
    height: Optional[float] = None
    gender: Optional[str] = None
    body_fat_percentage: Optional[float] = None
    activity_level: Optional[float] = 1.2
    training_frequency: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    fitness_goal: Optional[str] = None
    date_of_birth: Optional[date] = None
    current_weight: Optional[float] = None
    height: Optional[float] = None
    gender: Optional[str] = None
    body_fat_percentage: Optional[float] = None
    activity_level: Optional[float] = None
    training_frequency: Optional[int] = None
    role_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenPayload(BaseModel):
    sub: Optional[str] = None

# Permission
class PermissionReadCore(IDModel):
    name: str
    description: Optional[str] = None

class PermissionRead(TimeStampedSchema, PermissionReadCore):
    class Config:
        from_attributes = True

# Role
class RoleReadBaseCore(IDModel):
    name: str
    description: Optional[str] = None

class RoleReadBase(TimeStampedSchema, RoleReadBaseCore):
    class Config:
        from_attributes = True

class RoleReadCore(RoleReadBaseCore):
    permissions: List[PermissionRead] = []

class RoleRead(TimeStampedSchema, RoleReadCore):
    class Config:
        from_attributes = True

# User
class UserReadCore(UserBase, IDModel):
    role_id: Optional[int] = None

class UserRead(TimeStampedSchema, UserReadCore):
    class Config:
        from_attributes = True

class UserReadWithRoleCore(UserReadCore):
    role: Optional[RoleReadBase] = None

class UserReadWithRole(TimeStampedSchema, UserReadWithRoleCore):
    class Config:
        from_attributes = True

class UserReadWithRoleAndPermissionsCore(UserReadCore):
    role: Optional[RoleRead] = None

class UserReadWithRoleAndPermissions(TimeStampedSchema, UserReadWithRoleAndPermissionsCore):
    class Config:
        from_attributes = True
