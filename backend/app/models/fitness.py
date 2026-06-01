from datetime import date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from app.models.base import TimeStampedModel
from sqlalchemy import Column, Integer

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
    sleep_hours: Optional[float] = None  # Giờ ngủ (0-24)
    work_hours: Optional[float] = None   # Giờ làm việc (dùng cho DFI)
    fatigue_level: Optional[int] = None  # Mức mệt mỏi chủ quan 1-5 (dùng cho DFI)
    calories_in: Optional[int] = None
    compliance_score: Optional[float] = 0.0 # 0.0 to 100.0% score
    compliance_notes: Optional[str] = None
    
    user: User = Relationship(back_populates="logs")


# ─── Workout Schedule Models ───────────────────────────────────────────────────

class WorkoutProgram(TimeStampedModel, table=True):
    __tablename__ = "workoutprogram"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    name: str = Field(index=True)            # VD: "PPL – Hypertrophy Block"
    frequency_per_week: int = Field(default=3, ge=1, le=7)  # Số buổi/tuần
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = Field(default=True)    # Chỉ 1 program active tại 1 thời điểm
    notes: Optional[str] = None

    days: List["WorkoutDay"] = Relationship(back_populates="program")


class WorkoutDay(TimeStampedModel, table=True):
    __tablename__ = "workoutday"
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="workoutprogram.id", nullable=False)
    day_label: str                           # VD: "Push Day", "Pull Day", "Legs"
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)  # 0=T2, 6=CN; None = linh hoạt
    order: int = Field(default=0)            # Thứ tự hiển thị trong program

    program: WorkoutProgram = Relationship(back_populates="days")
    exercises: List["WorkoutExercise"] = Relationship(back_populates="workout_day")


class WorkoutExercise(TimeStampedModel, table=True):
    __tablename__ = "workoutexercise"
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_day_id: int = Field(foreign_key="workoutday.id", nullable=False)
    exercise_name: str                       # VD: "Bench Press", "Squat"
    order: int = Field(default=0)            # Thứ tự trong buổi tập
    sets: int = Field(default=3, ge=1)
    reps: str = Field(default="8-10")        # VD: "6-8", "10", "AMRAP"
    target_rpe: Optional[float] = Field(default=None, ge=5.0, le=10.0)  # VD: 8.0
    tempo: Optional[str] = None             # VD: "3010" (Eccentric-Pause-Concentric-Top)
    rest_seconds: Optional[int] = Field(default=120, ge=0)  # Nghỉ giữa set (giây)
    notes: Optional[str] = None

    workout_day: WorkoutDay = Relationship(back_populates="exercises")
