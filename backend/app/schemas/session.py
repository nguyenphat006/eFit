from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ─── Session Schemas ─────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    name: str = Field(min_length=1)
    goal_type: str = Field(default="Maintaining")  # Bulking / Cutting / Maintaining / Recomp
    start_date: date
    end_date: date
    is_active: bool = False
    workout_template_id: Optional[int] = None
    client_id: Optional[int] = None                 # Gán cho học viên (nếu có)


    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date phải sau start_date')
        return v


class SessionUpdate(BaseModel):
    name: Optional[str] = None
    goal_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SessionStatusUpdate(BaseModel):
    status: str  # Draft / Active / Completed / Abandoned


class PhaseRead(BaseModel):
    id: int
    session_id: int
    name: str
    description: Optional[str] = None
    order: int
    start_date: date
    end_date: date
    target_calories: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fat: Optional[float] = None
    workout_program_id: Optional[int] = None
    workout_program_snapshot: Optional[dict] = None

    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SessionRead(BaseModel):
    id: int
    user_id: int
    client_id: Optional[int] = None
    name: str
    goal_type: str
    start_date: date
    end_date: date
    is_active: bool
    status: str
    assigned_by_coach_id: Optional[int] = None
    phases: List[PhaseRead] = []

    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SessionListRead(BaseModel):
    """Lightweight — no nested phases."""
    id: int
    user_id: int
    client_id: Optional[int] = None
    name: str
    goal_type: str
    start_date: date
    end_date: date
    is_active: bool
    status: str
    assigned_by_coach_id: Optional[int] = None
    phase_count: Optional[int] = None

    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ─── Phase Schemas ───────────────────────────────────────────────────────────

class PhaseCreate(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    order: int = 0
    start_date: date
    end_date: date
    target_calories: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fat: Optional[float] = None
    workout_program_id: Optional[int] = None  # ID giáo án gốc để clone

    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date phải sau start_date')
        return v



class PhaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_calories: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fat: Optional[float] = None
    workout_program_id: Optional[int] = None


class SuggestNutritionRequest(BaseModel):
    goal: str
    phase_description: str
    gender: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    current_weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    activity_level: Optional[float] = None

