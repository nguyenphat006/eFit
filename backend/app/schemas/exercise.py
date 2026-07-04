from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ExerciseBase(BaseModel):
    name: str
    category: Optional[str] = None
    body_part: Optional[str] = None
    equipment: Optional[str] = None
    target: Optional[str] = None
    muscle_group: Optional[str] = None
    secondary_muscles: Optional[List[str]] = None
    instructions: Optional[dict] = None
    media_id: Optional[str] = None
    is_active: bool = True
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    body_part: Optional[str] = None
    equipment: Optional[str] = None
    target: Optional[str] = None
    muscle_group: Optional[str] = None
    secondary_muscles: Optional[List[str]] = None
    instructions: Optional[dict] = None
    media_id: Optional[str] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class ExerciseRead(ExerciseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
