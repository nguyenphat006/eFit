from datetime import date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from app.models.base import TimeStampedModel

class User(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    full_name: str
    hashed_password: str
    fitness_goal: Optional[str] = "Maintenance"
    date_of_birth: Optional[date] = None
    current_weight: Optional[float] = None
    height: Optional[float] = None
    training_frequency: Optional[int] = None
    role_id: Optional[int] = Field(default=None, foreign_key="role.id")
    
    role: Optional["Role"] = Relationship(back_populates="users")
    phases: List["Phase"] = Relationship(back_populates="user")
    logs: List["DailyLog"] = Relationship(back_populates="user")

class Phase(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    name: str  # Hypertrophy, Strength, Deload, Peak
    start_date: date
    end_date: date
    compliance_score: Optional[float] = 0.0
    
    user: User = Relationship(back_populates="phases")
    sessions: List["Session"] = Relationship(back_populates="phase")

class Session(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phase_id: int = Field(foreign_key="phase.id", nullable=False)
    name: str  # Push Day, Pull Day, Leg Day
    workout_date: date
    is_completed: bool = Field(default=False)
    compliance_rating: Optional[int] = Field(default=None) # 1 to 5 rating
    
    phase: Phase = Relationship(back_populates="sessions")

class DailyLog(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    log_date: date
    weight: Optional[float] = None
    sleep_hours: Optional[float] = None
    calories_in: Optional[int] = None
    compliance_score: Optional[float] = 0.0 # 0.0 to 100.0% score
    compliance_notes: Optional[str] = None
    
    user: User = Relationship(back_populates="logs")
