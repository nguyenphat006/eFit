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
    PhaseCreate, PhaseUpdate, PhaseRead, SuggestNutritionRequest
)
from app.schemas.response import BaseResponse, PaginatedResponse
from app.services.ai import AIService

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
    # Validate client ownership if client_id is provided
    client_id = data.client_id
    if client_id:
        from app.models.fitness import Client
        client = await session.get(Client, client_id)
        if not client or client.coach_id != current_user.id:
            raise HTTPException(status_code=404, detail="Học viên không tồn tại hoặc không thuộc quyền quản lý của bạn")

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
        client_id=client_id,
        name=data.name,
        goal_type=data.goal_type,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
        status="Active" if data.is_active else "Draft",
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)

    # Auto-create Phase 1
    phase = Phase(
        session_id=new_session.id,
        name="Phase 1",
        order=1,
        start_date=data.start_date,
        end_date=data.end_date,
    )

    if data.workout_template_id:
        stmt = select(WorkoutProgram).options(
            selectinload(WorkoutProgram.days).selectinload(WorkoutDay.exercises)
        ).where(WorkoutProgram.id == data.workout_template_id)
        template = (await session.execute(stmt)).scalar_one_or_none()
        
        if template:
            cloned_program = WorkoutProgram(
                user_id=current_user.id,
                name=f"{template.name}",
                frequency_per_week=template.frequency_per_week,
                notes=template.notes,
                is_template=False,
                source_program_id=template.id,
            )
            session.add(cloned_program)
            await session.commit()
            await session.refresh(cloned_program)
            
            for d in template.days:
                cloned_day = WorkoutDay(
                    program_id=cloned_program.id,
                    day_label=d.day_label,
                    day_of_week=d.day_of_week,
                    order=d.order,
                )
                session.add(cloned_day)
                await session.commit()
                await session.refresh(cloned_day)
                
                for ex in d.exercises:
                    cloned_ex = WorkoutExercise(
                        workout_day_id=cloned_day.id,
                        exercise_name=ex.exercise_name,
                        order=ex.order,
                        sets=ex.sets,
                        reps=ex.reps,
                        target_rpe=ex.target_rpe,
                        tempo=ex.tempo,
                        rest_seconds=ex.rest_seconds,
                        notes=ex.notes,
                    )
                    session.add(cloned_ex)
            
            await session.commit()
            phase.workout_program_id = cloned_program.id
            
    session.add(phase)
    await session.commit()

    stmt = select(Session).options(selectinload(Session.phases)).where(Session.id == new_session.id)
    new_session = (await session.execute(stmt)).scalar_one()
    return BaseResponse(data=new_session, message="Session and Phase created successfully")



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

    # Snapshot WorkoutProgram if provided
    snapshot = None
    if data.workout_program_id:
        snapshot = await _snapshot_workout_program(session, data.workout_program_id)

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
        workout_program_id=data.workout_program_id,
        workout_program_snapshot=snapshot,
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

    # Snapshot workout program if changing
    if 'workout_program_id' in update_data:
        if update_data['workout_program_id']:
            update_data['workout_program_snapshot'] = await _snapshot_workout_program(
                session, update_data['workout_program_id']
            )
        else:
            update_data['workout_program_snapshot'] = None

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


@router.post("/suggest-nutrition", response_model=BaseResponse[dict])
async def suggest_nutrition(
    current_user: CurrentUser, data: SuggestNutritionRequest
) -> Any:
    """Gọi AI (Gemini) để gợi ý mục tiêu dinh dưỡng."""
    profile_data = {
        "gender": data.gender,
        "age": data.age,
        "height": data.height,
        "current_weight": data.current_weight,
        "body_fat_percentage": data.body_fat_percentage,
        "activity_level": data.activity_level,
    }
    try:
        suggestion = AIService.suggest_nutrition(
            profile=profile_data,
            goal=data.goal,
            phase_desc=data.phase_description
        )
        return BaseResponse(data=suggestion, message="Lấy gợi ý AI thành công")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Helper: Snapshot WorkoutProgram ────────────────────────────────────────────

async def _snapshot_workout_program(session: Any, source_id: int) -> dict:
    """Snapshot a WorkoutProgram (+ Days + Exercises) into a JSON dict."""
    stmt = (
        select(WorkoutProgram)
        .options(selectinload(WorkoutProgram.days).selectinload(WorkoutDay.exercises))
        .where(WorkoutProgram.id == source_id)
    )
    source = (await session.execute(stmt)).scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail=f"WorkoutProgram #{source_id} not found")

    snapshot = {
        "id": source.id,
        "name": source.name,
        "frequency_per_week": source.frequency_per_week,
        "notes": source.notes,
        "days": []
    }

    for day in sorted(source.days, key=lambda d: d.order):
        day_dict = {
            "id": day.id,
            "day_label": day.day_label,
            "day_of_week": day.day_of_week,
            "order": day.order,
            "exercises": []
        }
        for ex in sorted(day.exercises, key=lambda e: e.order):
            day_dict["exercises"].append({
                "id": ex.id,
                "exercise_name": ex.exercise_name,
                "order": ex.order,
                "sets": ex.sets,
                "reps": ex.reps,
                "target_rpe": ex.target_rpe,
                "tempo": ex.tempo,
                "rest_seconds": ex.rest_seconds,
                "notes": ex.notes,
            })
        snapshot["days"].append(day_dict)

    return snapshot
