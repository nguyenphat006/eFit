from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ─── WorkoutExercise Schemas ────────────────────────────────────────────────

class WorkoutExerciseBase(BaseModel):
    exercise_name: str
    order: int = 0
    sets: int = Field(default=3, ge=1)
    reps: str = Field(default="8-10")
    target_rpe: Optional[float] = Field(default=None, ge=5.0, le=10.0)
    tempo: Optional[str] = None
    rest_seconds: Optional[int] = Field(default=120, ge=0)
    notes: Optional[str] = None


class WorkoutExerciseCreate(WorkoutExerciseBase):
    workout_day_id: int


class WorkoutExerciseUpdate(BaseModel):
    exercise_name: Optional[str] = None
    order: Optional[int] = None
    sets: Optional[int] = Field(default=None, ge=1)
    reps: Optional[str] = None
    target_rpe: Optional[float] = Field(default=None, ge=5.0, le=10.0)
    tempo: Optional[str] = None
    rest_seconds: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None


class WorkoutExerciseRead(WorkoutExerciseBase):
    id: int
    workout_day_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ─── WorkoutDay Schemas ─────────────────────────────────────────────────────

class WorkoutDayBase(BaseModel):
    day_label: str
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    order: int = 0


class WorkoutDayCreate(WorkoutDayBase):
    program_id: int


class WorkoutDayUpdate(BaseModel):
    day_label: Optional[str] = None
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    order: Optional[int] = None


class WorkoutDayRead(WorkoutDayBase):
    id: int
    program_id: int
    exercises: List[WorkoutExerciseRead] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ─── WorkoutProgram Schemas ─────────────────────────────────────────────────

class WorkoutProgramBase(BaseModel):
    name: str
    frequency_per_week: int = Field(default=0, ge=0, le=7)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool = True
    notes: Optional[str] = None


class WorkoutProgramCreate(WorkoutProgramBase):
    pass


class WorkoutProgramUpdate(BaseModel):
    name: Optional[str] = None
    frequency_per_week: Optional[int] = Field(default=None, ge=0, le=7)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class WorkoutProgramRead(WorkoutProgramBase):
    id: int
    user_id: int
    days: List[WorkoutDayRead] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class WorkoutProgramListRead(WorkoutProgramBase):
    """Lightweight version without nested days — for list views."""
    id: int
    user_id: int
    day_count: Optional[int] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
