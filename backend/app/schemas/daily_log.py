from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import TimeStampedSchema, IDModel

class DailyLogBase(BaseModel):
    log_date: date
    weight: Optional[float] = Field(None, description="Weight in kg", ge=0)
    sleep_hours: Optional[float] = Field(None, description="Hours of sleep", ge=0, le=24)
    calories_in: Optional[int] = Field(None, description="Total calories consumed", ge=0)
    compliance_score: Optional[float] = Field(0.0, description="Compliance score (0.0 to 100.0)", ge=0.0, le=100.0)
    compliance_notes: Optional[str] = Field(None, description="Notes on compliance")

class DailyLogCreate(DailyLogBase):
    user_id: int = Field(..., description="ID of the user who owns this log")

class DailyLogUpdate(BaseModel):
    log_date: Optional[date] = None
    weight: Optional[float] = Field(None, ge=0)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    calories_in: Optional[int] = Field(None, ge=0)
    compliance_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    compliance_notes: Optional[str] = None

class DailyLogResponseCore(DailyLogBase, IDModel):
    user_id: int

class DailyLogResponse(TimeStampedSchema, DailyLogResponseCore):
    model_config = ConfigDict(from_attributes=True)
