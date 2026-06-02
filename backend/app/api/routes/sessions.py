from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from sqlalchemy.orm import selectinload
from typing import Any
from datetime import date
import math

from app.api.deps import SessionDep, CurrentUser
from app.models.fitness import Session, Phase, WorkoutProgram, WorkoutDay, WorkoutExercise
from app.schemas.session import (
    SessionCreate, SessionUpdate, SessionRead, SessionListRead, SessionStatusUpdate,
    PhaseCreate, PhaseUpdate, PhaseRead,
)
from app.schemas.response import BaseResponse, PaginatedResponse

router = APIRouter()


# ─── Session CRUD ────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[SessionListRead])
async def list_sessions(
    session: SessionDep, current_user: CurrentUser,
    page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100),
) -> Any:
    """List all sessions of current user."""
    from sqlalchemy import func

    count_stmt = select(func.count(Session.id)).where(Session.user_id == current_user.id)
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = (
        select(Session)
        .where(Session.user_id == current_user.id)
        .order_by(Session.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    sessions = (await session.execute(stmt)).scalars().all()

    return PaginatedResponse(
        data=sessions, total=total, page=page, size=size,
        total_pages=math.ceil(total / size) if size > 0 else 1
    )


@router.get("/active", response_model=BaseResponse[SessionRead])
async def get_active_session(session: SessionDep, current_user: CurrentUser) -> Any:
    """Get the currently active session with all phases."""
    stmt = (
        select(Session)
        .options(selectinload(Session.phases))
        .where(Session.user_id == current_user.id, Session.is_active == True)
    )
    active = (await session.execute(stmt)).scalar_one_or_none()
    if not active:
        raise HTTPException(status_code=404, detail="Không có Session nào đang Active")
    return BaseResponse(data=active)


@router.post("", response_model=BaseResponse[SessionRead])
async def create_session(
    session: SessionDep, current_user: CurrentUser, data: SessionCreate,
) -> Any:
    """Create a new session. If is_active=True, deactivate existing active session."""
    if data.is_active:
        stmt = select(Session).where(
            Session.user_id == current_user.id, Session.is_active == True
        )
        old = (await session.execute(stmt)).scalars().all()
        for s in old:
            s.is_active = False
            s.status = "Completed"
            session.add(s)

    new_session = Session(
        user_id=current_user.id,
        name=data.name,
        goal_type=data.goal_type,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
        status="Active" if data.is_active else "Draft",
    )
    session.add(new_session)
    await session.commit()

    stmt = select(Session).options(selectinload(Session.phases)).where(Session.id == new_session.id)
    new_session = (await session.execute(stmt)).scalar_one()
    return BaseResponse(data=new_session, message="Session created successfully")


@router.get("/{id}", response_model=BaseResponse[SessionRead])
async def get_session(id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    stmt = select(Session).options(selectinload(Session.phases)).where(Session.id == id)
    s = (await session.execute(stmt)).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return BaseResponse(data=s)


@router.put("/{id}", response_model=BaseResponse[SessionRead])
async def update_session(
    id: int, session: SessionDep, current_user: CurrentUser, data: SessionUpdate,
) -> Any:
    s = await session.get(Session, id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(s, field, value)

    session.add(s)
    await session.commit()

    stmt = select(Session).options(selectinload(Session.phases)).where(Session.id == id)
    s = (await session.execute(stmt)).scalar_one()
    return BaseResponse(data=s, message="Session updated")


@router.put("/{id}/status", response_model=BaseResponse[SessionRead])
async def update_session_status(
    id: int, session: SessionDep, current_user: CurrentUser, data: SessionStatusUpdate,
) -> Any:
    """Change session status with state machine validation."""
    s = await session.get(Session, id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    allowed = {
        "Draft": ["Active", "Abandoned"],
        "Active": ["Completed", "Abandoned"],
        "Completed": [],
        "Abandoned": [],
    }

    if data.status not in allowed.get(s.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Không thể chuyển từ '{s.status}' sang '{data.status}'"
        )

    # Draft → Active: phải có ≥ 1 Phase
    if s.status == "Draft" and data.status == "Active":
        stmt = select(Phase).where(Phase.session_id == id)
        phases = (await session.execute(stmt)).scalars().all()
        if not phases:
            raise HTTPException(status_code=400, detail="Session phải có ít nhất 1 Phase trước khi Active")

        # Deactivate old active session
        stmt_old = select(Session).where(
            Session.user_id == current_user.id, Session.is_active == True, Session.id != id
        )
        for old in (await session.execute(stmt_old)).scalars().all():
            old.is_active = False
            old.status = "Completed"
            session.add(old)

        s.is_active = True

    if data.status in ("Completed", "Abandoned"):
        s.is_active = False

    s.status = data.status
    session.add(s)
    await session.commit()

    stmt = select(Session).options(selectinload(Session.phases)).where(Session.id == id)
    s = (await session.execute(stmt)).scalar_one()
    return BaseResponse(data=s, message=f"Session status changed to {data.status}")


@router.delete("/{id}", response_model=BaseResponse)
async def delete_session(id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    s = await session.get(Session, id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.status not in ("Draft", "Abandoned"):
        raise HTTPException(status_code=400, detail="Chỉ có thể xóa Session ở trạng thái Draft hoặc Abandoned")

    await session.delete(s)
    await session.commit()
    return BaseResponse(message="Session deleted")


# ─── Phase CRUD ──────────────────────────────────────────────────────────────

@router.get("/phases/{phase_id}", response_model=BaseResponse[PhaseRead])
async def get_phase(
    phase_id: int, session: SessionDep, current_user: CurrentUser
) -> Any:
    phase = await session.get(Phase, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    parent = await session.get(Session, phase.session_id)
    if not parent or parent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return BaseResponse(data=phase)


@router.post("/{session_id}/phases", response_model=BaseResponse[PhaseRead])
async def create_phase(
    session_id: int, session: SessionDep, current_user: CurrentUser, data: PhaseCreate,
) -> Any:
    """Create a phase in a session. Validates date range and overlap. Clones WorkoutProgram if provided."""
    s = await session.get(Session, session_id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate: Phase dates within Session
    if data.start_date < s.start_date or data.end_date > s.end_date:
        raise HTTPException(
            status_code=400,
            detail=f"Phase dates must be within Session ({s.start_date} – {s.end_date})"
        )

    # Validate: No overlap with existing phases
    stmt = select(Phase).where(Phase.session_id == session_id)
    existing_phases = (await session.execute(stmt)).scalars().all()
    for ep in existing_phases:
        if data.start_date <= ep.end_date and data.end_date >= ep.start_date:
            raise HTTPException(
                status_code=400,
                detail=f"Phase dates overlap with '{ep.name}' ({ep.start_date} – {ep.end_date})"
            )

    # Clone WorkoutProgram if provided
    cloned_program_id = None
    if data.workout_program_id:
        cloned_program_id = await _clone_workout_program(
            session, data.workout_program_id, current_user.id
        )

    phase = Phase(
        session_id=session_id,
        name=data.name,
        order=data.order,
        start_date=data.start_date,
        end_date=data.end_date,
        target_calories=data.target_calories,
        target_protein=data.target_protein,
        target_carbs=data.target_carbs,
        target_fat=data.target_fat,
        workout_program_id=cloned_program_id,
        description=data.description,
    )
    session.add(phase)
    await session.commit()
    await session.refresh(phase)
    return BaseResponse(data=phase, message="Phase created")


@router.put("/phases/{phase_id}", response_model=BaseResponse[PhaseRead])
async def update_phase(
    phase_id: int, session: SessionDep, current_user: CurrentUser, data: PhaseUpdate,
) -> Any:
    phase = await session.get(Phase, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    # Check ownership via Session
    s = await session.get(Session, phase.session_id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = data.model_dump(exclude_unset=True)

    # Validate dates if changed
    new_start = update_data.get('start_date', phase.start_date)
    new_end = update_data.get('end_date', phase.end_date)
    if new_start and new_end:
        if new_start < s.start_date or new_end > s.end_date:
            raise HTTPException(status_code=400, detail="Phase dates must be within Session")

        # Check overlap with other phases
        stmt = select(Phase).where(Phase.session_id == phase.session_id, Phase.id != phase_id)
        for ep in (await session.execute(stmt)).scalars().all():
            if new_start <= ep.end_date and new_end >= ep.start_date:
                raise HTTPException(status_code=400, detail=f"Overlap with '{ep.name}'")

    # Clone workout program if changing
    if 'workout_program_id' in update_data and update_data['workout_program_id']:
        update_data['workout_program_id'] = await _clone_workout_program(
            session, update_data['workout_program_id'], current_user.id
        )

    for field, value in update_data.items():
        setattr(phase, field, value)

    session.add(phase)
    await session.commit()
    await session.refresh(phase)
    return BaseResponse(data=phase, message="Phase updated")


@router.delete("/phases/{phase_id}", response_model=BaseResponse)
async def delete_phase(phase_id: int, session: SessionDep, current_user: CurrentUser) -> Any:
    phase = await session.get(Phase, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    s = await session.get(Session, phase.session_id)
    if not s or s.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    await session.delete(phase)
    await session.commit()
    return BaseResponse(message="Phase deleted")


# ─── Helper: Clone WorkoutProgram ────────────────────────────────────────────

async def _clone_workout_program(session: Any, source_id: int, user_id: int) -> int:
    """Deep clone a WorkoutProgram (+ Days + Exercises) for Phase isolation."""
    stmt = (
        select(WorkoutProgram)
        .options(selectinload(WorkoutProgram.days).selectinload(WorkoutDay.exercises))
        .where(WorkoutProgram.id == source_id)
    )
    source = (await session.execute(stmt)).scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail=f"WorkoutProgram #{source_id} not found")

    # Clone program
    clone = WorkoutProgram(
        user_id=user_id,
        name=f"{source.name} (Phase Copy)",
        frequency_per_week=source.frequency_per_week,
        start_date=source.start_date,
        end_date=source.end_date,
        is_active=False,  # Clone is not the active template
        notes=source.notes,
        source_program_id=source.id,
    )
    session.add(clone)
    await session.flush()  # Get clone.id

    # Clone days + exercises
    for day in source.days:
        clone_day = WorkoutDay(
            program_id=clone.id,
            day_label=day.day_label,
            day_of_week=day.day_of_week,
            order=day.order,
        )
        session.add(clone_day)
        await session.flush()

        for ex in day.exercises:
            clone_ex = WorkoutExercise(
                workout_day_id=clone_day.id,
                exercise_name=ex.exercise_name,
                order=ex.order,
                sets=ex.sets,
                reps=ex.reps,
                target_rpe=ex.target_rpe,
                tempo=ex.tempo,
                rest_seconds=ex.rest_seconds,
                notes=ex.notes,
            )
            session.add(clone_ex)

    return clone.id
