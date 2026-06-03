from datetime import date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, JSON
from app.models.base import TimeStampedModel
from sqlalchemy import Column, Integer, UniqueConstraint


class User(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    full_name: str
    hashed_password: str
    fitness_goal: Optional[str] = "Maintenance"
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, description="Nam / Nữ / Khác")
    current_weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = Field(default=None, description="Tỷ lệ mỡ cơ thể (%)")
    activity_level: Optional[float] = Field(default=1.2, description="Hệ số vận động, từ 1.2 đến 1.9")
    training_frequency: Optional[int] = None
    role_id: Optional[int] = Field(default=None, foreign_key="role.id")
    
    role: Optional["Role"] = Relationship(back_populates="users")
    sessions: List["Session"] = Relationship(back_populates="user")
    logs: List["DailyLog"] = Relationship(back_populates="user")


# ─── Session & Phase (Quản lý Chu kỳ / Mùa giải) ──────────────────────────────

class Session(TimeStampedModel, table=True):
    """Mùa giải tổng thể. VD: 'Mùa siết cơ Hè 2026'."""
    __tablename__ = "session"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, index=True)
    name: str                                                    # "Mùa siết cơ Hè 2026"
    goal_type: str = Field(default="Maintaining")                # Bulking / Cutting / Maintaining / Recomp
    start_date: date
    end_date: date
    is_active: bool = Field(default=False)                       # Chỉ 1 Session active per user
    status: str = Field(default="Draft")                         # Draft / Active / Completed / Abandoned

    user: User = Relationship(back_populates="sessions")
    phases: List["Phase"] = Relationship(back_populates="session", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class Phase(TimeStampedModel, table=True):
    """Giai đoạn nhỏ trong 1 Session. VD: 'Phase 1 – Thích nghi (4 tuần)'."""
    __tablename__ = "phase"
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id", nullable=False, index=True)
    name: str                                                    # "Giai đoạn Thích nghi"
    description: Optional[str] = None                            # Mô tả chi tiết Phase
    order: int = Field(default=0)                                # Thứ tự trong Session
    start_date: date
    end_date: date

    # ── Mục tiêu Dinh dưỡng ──
    target_calories: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fat: Optional[float] = None

    # ── Giáo án tập (Snapshot) ──
    workout_program_id: Optional[int] = Field(default=None, foreign_key="workoutprogram.id")
    workout_program_snapshot: Optional[dict] = Field(default=None, sa_column=Column(JSON))



    session: Session = Relationship(back_populates="phases")
    workout_program: Optional["WorkoutProgram"] = Relationship()
    daily_logs: List["DailyLog"] = Relationship(back_populates="phase")


# ─── Daily Log (Nhật ký hằng ngày) ──────────────────────────────────────────────

class DailyLog(TimeStampedModel, table=True):
    """Nhật ký chỉ số của 1 ngày. UPSERT: UI render ngày, khi user inline edit thì tạo/cập nhật."""
    __tablename__ = "dailylog"
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_dailylog_user_date"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, index=True)
    phase_id: Optional[int] = Field(default=None, foreign_key="phase.id", index=True)
    log_date: date = Field(index=True)

    # ── Snapshot mục tiêu (chụp từ Phase tại thời điểm tạo log) ──
    target_calories_snapshot: Optional[float] = None
    target_protein_snapshot: Optional[float] = None
    target_carbs_snapshot: Optional[float] = None
    target_fat_snapshot: Optional[float] = None

    # ── Dữ liệu thực tế (user nhập inline) ──
    weight: Optional[float] = None
    calories_in: Optional[float] = None
    protein_in: Optional[float] = None
    carbs_in: Optional[float] = None
    fat_in: Optional[float] = None
    sleep_hours: Optional[float] = None                          # Giờ ngủ (0-24)
    work_hours: Optional[float] = None                           # Giờ làm việc (dùng cho DFI)
    fatigue_level: Optional[int] = None                          # Mức mệt mỏi chủ quan 1-5
    is_workout_completed: bool = Field(default=False)

    # ── Ảnh body check-in (JSON array of URLs) ──
    body_images: Optional[List[str]] = Field(default=None, sa_type=JSON)

    # ── Điểm kỷ luật ──
    compliance_score: Optional[float] = Field(default=0.0)       # 0.0 - 100.0%
    compliance_notes: Optional[str] = None

    user: User = Relationship(back_populates="logs")
    phase: Optional[Phase] = Relationship(back_populates="daily_logs")


# ─── Workout Schedule Models ───────────────────────────────────────────────────

class WorkoutProgram(TimeStampedModel, table=True):
    __tablename__ = "workoutprogram"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False)
    name: str = Field(index=True)                                # VD: "PPL – Hypertrophy Block"
    frequency_per_week: int = Field(default=0, ge=0, le=7)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = Field(default=True)
    notes: Optional[str] = None
    # Nếu clone từ bản gốc, lưu lại id gốc để truy vết
    source_program_id: Optional[int] = Field(default=None)

    days: List["WorkoutDay"] = Relationship(back_populates="program", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class WorkoutDay(TimeStampedModel, table=True):
    __tablename__ = "workoutday"
    id: Optional[int] = Field(default=None, primary_key=True)
    program_id: int = Field(foreign_key="workoutprogram.id", nullable=False)
    day_label: str                                               # VD: "Push Day", "Pull Day"
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    order: int = Field(default=0)

    program: WorkoutProgram = Relationship(back_populates="days")
    exercises: List["WorkoutExercise"] = Relationship(back_populates="workout_day", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class WorkoutExercise(TimeStampedModel, table=True):
    __tablename__ = "workoutexercise"
    id: Optional[int] = Field(default=None, primary_key=True)
    workout_day_id: int = Field(foreign_key="workoutday.id", nullable=False)
    exercise_name: str
    order: int = Field(default=0)
    sets: int = Field(default=3, ge=1)
    reps: str = Field(default="8-10")
    target_rpe: Optional[float] = Field(default=None, ge=5.0, le=10.0)
    tempo: Optional[str] = None
    rest_seconds: Optional[int] = Field(default=120, ge=0)
    notes: Optional[str] = None

    workout_day: WorkoutDay = Relationship(back_populates="exercises")
