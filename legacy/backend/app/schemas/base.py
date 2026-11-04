from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class IDModel(BaseModel):
    id: int

class TimeStampedSchema(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    is_active: bool = True
