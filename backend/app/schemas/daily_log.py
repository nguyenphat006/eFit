from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import TimeStampedSchema, IDModel


class DailyLogBase(BaseModel):
    log_date: date
    weight: Optional[float] = Field(None, description="Weight in kg", ge=0)
    sleep_hours: Optional[float] = Field(None, description="Hours of sleep", ge=0, le=24)
    work_hours: Optional[float] = Field(None, description="Hours of work/study", ge=0, le=24)
    fatigue_level: Optional[int] = Field(None, description="Subjective fatigue 1-5", ge=1, le=5)
    calories_in: Optional[float] = Field(None, description="Total calories consumed", ge=0)
    protein_in: Optional[float] = Field(None, ge=0)
    carbs_in: Optional[float] = Field(None, ge=0)
    fat_in: Optional[float] = Field(None, ge=0)
    is_workout_completed: bool = False
    
    # Cardio & Steps
    steps: Optional[int] = Field(None, ge=0)
    cardio_duration_minutes: Optional[int] = Field(None, ge=0)
    cardio_type: Optional[str] = None
    
    # Diet Tracking (Meal-based)
    diet_meals_completed: Optional[int] = Field(None, ge=0)
    diet_target_meals: Optional[int] = Field(4, ge=1)
    diet_protein_estimated: Optional[bool] = None
    diet_cheat_status: Optional[str] = "NONE"
    diet_notes: Optional[str] = None
    
    body_images: Optional[List[str]] = None
    chest_measure: Optional[float] = Field(None, ge=0)
    waist_measure: Optional[float] = Field(None, ge=0)
    hips_measure: Optional[float] = Field(None, ge=0)
    compliance_score: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    compliance_notes: Optional[str] = None


class DailyLogCreate(DailyLogBase):
    user_id: int = Field(..., description="ID of the user who owns this log")


class DailyLogUpdate(BaseModel):
    log_date: Optional[date] = None
    weight: Optional[float] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    work_hours: Optional[float] = Field(None, ge=0, le=24)
    fatigue_level: Optional[int] = Field(None, ge=1, le=5)
    calories_in: Optional[float] = Field(None, ge=0)
    protein_in: Optional[float] = Field(None, ge=0)
    carbs_in: Optional[float] = Field(None, ge=0)
    fat_in: Optional[float] = Field(None, ge=0)
    is_workout_completed: Optional[bool] = None
    
    steps: Optional[int] = Field(None, ge=0)
    cardio_duration_minutes: Optional[int] = Field(None, ge=0)
    cardio_type: Optional[str] = None
    
    diet_meals_completed: Optional[int] = Field(None, ge=0)
    diet_target_meals: Optional[int] = Field(None, ge=1)
    diet_protein_estimated: Optional[bool] = None
    diet_cheat_status: Optional[str] = None
    diet_notes: Optional[str] = None
    
    body_images: Optional[List[str]] = None
    chest_measure: Optional[float] = Field(None, ge=0)
    waist_measure: Optional[float] = Field(None, ge=0)
    hips_measure: Optional[float] = Field(None, ge=0)
    compliance_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    compliance_notes: Optional[str] = None


class DailyLogInlineUpsert(BaseModel):
    """For inline editing from Phase UI — UPSERT by (user, log_date)."""
    log_date: date
    weight: Optional[float] = Field(None, ge=0)
    calories_in: Optional[float] = Field(None, ge=0)
    protein_in: Optional[float] = Field(None, ge=0)
    carbs_in: Optional[float] = Field(None, ge=0)
    fat_in: Optional[float] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    work_hours: Optional[float] = Field(None, ge=0, le=24)
    fatigue_level: Optional[int] = Field(None, ge=1, le=5)
    is_workout_completed: Optional[bool] = None
    
    steps: Optional[int] = Field(None, ge=0)
    cardio_duration_minutes: Optional[int] = Field(None, ge=0)
    cardio_type: Optional[str] = None
    
    diet_meals_completed: Optional[int] = Field(None, ge=0)
    diet_target_meals: Optional[int] = Field(None, ge=1)
    diet_protein_estimated: Optional[bool] = None
    diet_cheat_status: Optional[str] = None
    diet_notes: Optional[str] = None
    
    body_images: Optional[List[str]] = None
    chest_measure: Optional[float] = Field(None, ge=0)
    waist_measure: Optional[float] = Field(None, ge=0)
    hips_measure: Optional[float] = Field(None, ge=0)


class DailyLogResponseCore(DailyLogBase, IDModel):
    user_id: int
    phase_id: Optional[int] = None
    target_calories_snapshot: Optional[float] = None
    target_protein_snapshot: Optional[float] = None
    target_carbs_snapshot: Optional[float] = None
    target_fat_snapshot: Optional[float] = None


class DailyLogResponse(TimeStampedSchema, DailyLogResponseCore):
    model_config = ConfigDict(from_attributes=True)
