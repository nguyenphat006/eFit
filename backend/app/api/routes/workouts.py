from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from sqlalchemy.orm import selectinload
from typing import Any, Optional

from app.api.deps import SessionDep, CurrentUser
from app.models.fitness import WorkoutProgram, WorkoutDay, WorkoutExercise
from app.schemas.workout import (
    WorkoutProgramCreate, WorkoutProgramUpdate, WorkoutProgramRead, WorkoutProgramListRead,
    WorkoutDayCreate, WorkoutDayUpdate, WorkoutDayRead,
    WorkoutExerciseCreate, WorkoutExerciseUpdate, WorkoutExerciseRead,
)
from app.schemas.response import BaseResponse, PaginatedResponse

router = APIRouter()


# ─── WorkoutProgram CRUD ─────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[WorkoutProgramListRead])
async def list_programs(
    session: SessionDep,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> Any:
    """List all workout programs of current user."""
    from sqlalchemy import func
    import math

    count_stmt = select(func.count(WorkoutProgram.id)).where(WorkoutProgram.user_id == current_user.id)
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = (
        select(WorkoutProgram)
        .where(WorkoutProgram.user_id == current_user.id)
        .order_by(WorkoutProgram.is_active.desc(), WorkoutProgram.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    programs = (await session.execute(stmt)).scalars().all()

    return PaginatedResponse(
        data=programs, total=total, page=page, size=size,
        total_pages=math.ceil(total / size) if size > 0 else 1
    )


@router.post("", response_model=BaseResponse[WorkoutProgramRead])
async def create_program(
    session: SessionDep,
    current_user: CurrentUser,
    program_in: WorkoutProgramCreate,
) -> Any:
    """Create a new workout program."""
    # Nếu program mới là active, deactivate tất cả program cũ
    if program_in.is_active:
        stmt = select(WorkoutProgram).where(
            WorkoutProgram.user_id == current_user.id,
            WorkoutProgram.is_active == True
        )
        old_active = (await session.execute(stmt)).scalars().all()
        for p in old_active:
            p.is_active = False
            session.add(p)

    program = WorkoutProgram(**program_in.model_dump(), user_id=current_user.id)
    session.add(program)
    await session.commit()

    # Reload with days
    stmt = select(WorkoutProgram).options(
        selectinload(WorkoutProgram.days).selectinload(WorkoutDay.exercises)
    ).where(WorkoutProgram.id == program.id)
    program = (await session.execute(stmt)).scalar_one()

    return BaseResponse(data=program, message="Program created successfully")


@router.get("/{id}", response_model=BaseResponse[WorkoutProgramRead])
async def get_program(id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    """Get a specific program with all days and exercises."""
    stmt = select(WorkoutProgram).options(
        selectinload(WorkoutProgram.days).selectinload(WorkoutDay.exercises)
    ).where(WorkoutProgram.id == id)
    program = (await session.execute(stmt)).scalar_one_or_none()

    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    if program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return BaseResponse(data=program)


@router.put("/{id}", response_model=BaseResponse[WorkoutProgramRead])
async def update_program(
    id: int,
    session: SessionDep,
    current_user: CurrentUser,
    program_in: WorkoutProgramUpdate,
) -> Any:
    """Update a workout program."""
    program = await session.get(WorkoutProgram, id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    if program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Nếu set active=True, deactivate các program khác
    if program_in.is_active:
        stmt = select(WorkoutProgram).where(
            WorkoutProgram.user_id == current_user.id,
            WorkoutProgram.is_active == True,
            WorkoutProgram.id != id,
        )
        old_active = (await session.execute(stmt)).scalars().all()
        for p in old_active:
            p.is_active = False
            session.add(p)

    for field, value in program_in.model_dump(exclude_unset=True).items():
        setattr(program, field, value)

    session.add(program)
    await session.commit()

    stmt = select(WorkoutProgram).options(
        selectinload(WorkoutProgram.days).selectinload(WorkoutDay.exercises)
    ).where(WorkoutProgram.id == id)
    program = (await session.execute(stmt)).scalar_one()

    return BaseResponse(data=program, message="Program updated successfully")


@router.delete("/{id}", response_model=BaseResponse)
async def delete_program(id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    """Delete a workout program (cascades to days and exercises)."""
    program = await session.get(WorkoutProgram, id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    if program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await session.delete(program)
    await session.commit()
    return BaseResponse(message="Program deleted successfully")


# ─── WorkoutDay CRUD ─────────────────────────────────────────────────────────

@router.post("/{program_id}/days", response_model=BaseResponse[WorkoutDayRead])
async def create_day(
    program_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    day_in: WorkoutDayCreate,
) -> Any:
    """Add a workout day to a program."""
    program = await session.get(WorkoutProgram, program_id)
    if not program or program.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Program not found")

    day = WorkoutDay(**day_in.model_dump(exclude={"program_id"}), program_id=program_id)
    session.add(day)
    
    # Cập nhật số buổi tập (frequency) tự động
    from sqlalchemy import func
    count_stmt = select(func.count(WorkoutDay.id)).where(WorkoutDay.program_id == program_id)
    current_days_count = (await session.execute(count_stmt)).scalar() or 0
    program.frequency_per_week = current_days_count + 1
    session.add(program)
    
    await session.commit()

    stmt = select(WorkoutDay).options(selectinload(WorkoutDay.exercises)).where(WorkoutDay.id == day.id)
    day = (await session.execute(stmt)).scalar_one()
    return BaseResponse(data=day, message="Day created successfully")


@router.put("/days/{day_id}", response_model=BaseResponse[WorkoutDayRead])
async def update_day(
    day_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    day_in: WorkoutDayUpdate,
) -> Any:
    """Update a workout day."""
    day = await session.get(WorkoutDay, day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    program = await session.get(WorkoutProgram, day.program_id)
    if not program or program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in day_in.model_dump(exclude_unset=True).items():
        setattr(day, field, value)

    session.add(day)
    await session.commit()

    stmt = select(WorkoutDay).options(selectinload(WorkoutDay.exercises)).where(WorkoutDay.id == day_id)
    day = (await session.execute(stmt)).scalar_one()
    return BaseResponse(data=day, message="Day updated successfully")


@router.delete("/days/{day_id}", response_model=BaseResponse)
async def delete_day(day_id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    """Delete a workout day (cascades to exercises)."""
    day = await session.get(WorkoutDay, day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    program = await session.get(WorkoutProgram, day.program_id)
    if not program or program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await session.delete(day)
    
    # Cập nhật lại số buổi tập (frequency) tự động sau khi xóa
    from sqlalchemy import func
    count_stmt = select(func.count(WorkoutDay.id)).where(WorkoutDay.program_id == program.id)
    current_days_count = (await session.execute(count_stmt)).scalar() or 0
    program.frequency_per_week = current_days_count
    session.add(program)
    
    await session.commit()
    return BaseResponse(message="Day deleted successfully")


# ─── WorkoutExercise CRUD ────────────────────────────────────────────────────

@router.post("/days/{day_id}/exercises", response_model=BaseResponse[WorkoutExerciseRead])
async def create_exercise(
    day_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    exercise_in: WorkoutExerciseCreate,
) -> Any:
    """Add an exercise to a workout day."""
    day = await session.get(WorkoutDay, day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    program = await session.get(WorkoutProgram, day.program_id)
    if not program or program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    exercise = WorkoutExercise(**exercise_in.model_dump(exclude={"workout_day_id"}), workout_day_id=day_id)
    session.add(exercise)
    await session.commit()
    await session.refresh(exercise)
    return BaseResponse(data=exercise, message="Exercise created successfully")


@router.put("/exercises/{exercise_id}", response_model=BaseResponse[WorkoutExerciseRead])
async def update_exercise(
    exercise_id: int,
    session: SessionDep,
    current_user: CurrentUser,
    exercise_in: WorkoutExerciseUpdate,
) -> Any:
    """Update an exercise."""
    exercise = await session.get(WorkoutExercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    day = await session.get(WorkoutDay, exercise.workout_day_id)
    program = await session.get(WorkoutProgram, day.program_id)
    if not program or program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in exercise_in.model_dump(exclude_unset=True).items():
        setattr(exercise, field, value)

    session.add(exercise)
    await session.commit()
    await session.refresh(exercise)
    return BaseResponse(data=exercise, message="Exercise updated successfully")


@router.delete("/exercises/{exercise_id}", response_model=BaseResponse)
async def delete_exercise(exercise_id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    """Delete an exercise."""
    exercise = await session.get(WorkoutExercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    day = await session.get(WorkoutDay, exercise.workout_day_id)
    program = await session.get(WorkoutProgram, day.program_id)
    if not program or program.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await session.delete(exercise)
    await session.commit()
    return BaseResponse(message="Exercise deleted successfully")
