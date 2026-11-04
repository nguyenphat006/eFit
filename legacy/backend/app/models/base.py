from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func

class TimeStampedModel(SQLModel):
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": func.now()}
    )
    created_by: Optional[int] = Field(default=None, description="ID of the user who created this record")
    updated_by: Optional[int] = Field(default=None, description="ID of the user who last updated this record")
    is_active: bool = Field(default=True, description="Soft delete flag", sa_column_kwargs={"server_default": "true"})
