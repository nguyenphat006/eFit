from app.models.fitness import User
from app.models.base import TimeStampedModel
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class RolePermissionLink(SQLModel, table=True):
    role_id: Optional[int] = Field(default=None, foreign_key="role.id", primary_key=True)
    permission_id: Optional[int] = Field(default=None, foreign_key="permission.id", primary_key=True)

class Permission(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, nullable=False) # e.g. 'manage_users', 'view_logs'
    description: Optional[str] = None
    
    roles: List["Role"] = Relationship(back_populates="permissions", link_model=RolePermissionLink)

class Role(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, nullable=False) # e.g. 'Admin', 'Trainer', 'Member'
    description: Optional[str] = None
    
    permissions: List["Permission"] = Relationship(back_populates="roles", link_model=RolePermissionLink)
    users: List["User"] = Relationship(back_populates="role")
