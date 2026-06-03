from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
from datetime import date, timedelta

from app.db.session import get_session
from app.api.deps import SessionDep, CurrentUser
from app.models.fitness import DailyLog, Phase, Session
from app.schemas.daily_log import DailyLogCreate, DailyLogUpdate, DailyLogResponse, DailyLogInlineUpsert
from app.schemas.response import BaseResponse, PaginatedResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[DailyLogResponse])
async def read_daily_logs(
    page: int = Query(1, description="Page number", ge=1),
    size: int = Query(50, description="Items per page", ge=1, le=100),
    db: AsyncSession = Depends(get_session)
):
    from sqlalchemy import func
    import math
    
    count_statement = select(func.count(DailyLog.id))
    total = (await db.execute(count_statement)).scalar() or 0
    
    result = await db.execute(select(DailyLog).offset((page - 1) * size).limit(size).order_by(DailyLog.log_date.desc()))
    logs = result.scalars().all()
    
    total_pages = math.ceil(total / size) if size > 0 else 1
    
    return PaginatedResponse(
        data=logs,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.post("/", response_model=BaseResponse[DailyLogResponse], status_code=status.HTTP_201_CREATED)
async def create_daily_log(
    log_in: DailyLogCreate,
    db: AsyncSession = Depends(get_session)
):
    new_log = DailyLog(**log_in.model_dump())
    db.add(new_log)
    try:
        await db.commit()
        await db.refresh(new_log)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error creating daily log")
    return BaseResponse(message="Log created successfully", data=new_log)

@router.put("/{log_id}", response_model=BaseResponse[DailyLogResponse])
async def update_daily_log(
    log_id: int,
    log_in: DailyLogUpdate,
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(select(DailyLog).where(DailyLog.id == log_id))
    log_db = result.scalars().first()
    if not log_db:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    update_data = log_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log_db, field, value)
        
    db.add(log_db)
    await db.commit()
    await db.refresh(log_db)
    return BaseResponse(message="Log updated successfully", data=log_db)

@router.delete("/{log_id}", response_model=BaseResponse[dict])
async def delete_daily_log(
    log_id: int,
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(select(DailyLog).where(DailyLog.id == log_id))
    log_db = result.scalars().first()
    if not log_db:
        raise HTTPException(status_code=404, detail="Daily log not found")
        
    await db.delete(log_db)
    await db.commit()
    return BaseResponse(message="Log deleted successfully", data=None)


def _calculate_dfi(sleep_hours: Optional[float], work_hours: Optional[float], fatigue_level: Optional[int]) -> Optional[float]:
    """
    Daily Fatigue Index (DFI) theo công thức BA:
    DFI = 0.4 * F_sleep + 0.3 * F_work + 0.3 * F_subjective
    Kết quả: 0 (không mệt) đến 100 (kiệt sức hoàn toàn)
    """
    components = []
    weights = []

    if sleep_hours is not None:
        f_sleep = max(0.0, (8.0 - sleep_hours) / 8.0 * 100.0)
        components.append(0.4 * f_sleep)
        weights.append(0.4)

    if work_hours is not None:
        f_work = min(100.0, work_hours / 10.0 * 100.0)
        components.append(0.3 * f_work)
        weights.append(0.3)

    if fatigue_level is not None:
        f_subjective = fatigue_level * 20.0
        components.append(0.3 * f_subjective)
        weights.append(0.3)

    if not components:
        return None

    total_weight = sum(weights)
    return round(sum(components) / total_weight, 1)


@router.get("/me", response_model=PaginatedResponse[DailyLogResponse])
async def get_my_daily_logs(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=100),
    session: SessionDep = None,
):
    """Get daily logs of the current user."""
    from sqlalchemy import func
    import math

    count_stmt = select(func.count(DailyLog.id)).where(DailyLog.user_id == current_user.id)
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = (
        select(DailyLog)
        .where(DailyLog.user_id == current_user.id)
        .order_by(DailyLog.log_date.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    logs = (await session.execute(stmt)).scalars().all()
    total_pages = math.ceil(total / size) if size > 0 else 1

    return PaginatedResponse(data=logs, total=total, page=page, size=size, total_pages=total_pages)


@router.get("/summary", response_model=BaseResponse[dict])
async def get_daily_log_summary(
    current_user: CurrentUser,
    session: SessionDep = None,
):
    """
    Dashboard summary: DFI hôm nay + lịch sử 7 ngày gần nhất.
    """
    today = date.today()
    seven_days_ago = today - timedelta(days=6)

    stmt = (
        select(DailyLog)
        .where(DailyLog.user_id == current_user.id)
        .where(DailyLog.log_date >= seven_days_ago)
        .order_by(DailyLog.log_date.asc())
    )
    logs = (await session.execute(stmt)).scalars().all()

    # Build 7-day history
    history = []
    for log in logs:
        dfi = _calculate_dfi(log.sleep_hours, log.work_hours, log.fatigue_level)
        history.append({
            "date": log.log_date.isoformat(),
            "weight": log.weight,
            "sleep_hours": log.sleep_hours,
            "work_hours": log.work_hours,
            "fatigue_level": log.fatigue_level,
            "calories_in": log.calories_in,
            "dfi": dfi,
        })

    # Today's DFI
    today_log = next((l for l in logs if l.log_date == today), None)
    today_dfi = None
    if today_log:
        today_dfi = _calculate_dfi(today_log.sleep_hours, today_log.work_hours, today_log.fatigue_level)

    # Weekly log adherence (C_L) — số ngày có log / 7
    log_adherence = round(len(set(l.log_date for l in logs)) / 7 * 100, 1)

    # Compliance Score tạm (chưa có Workout) = C_L * weight 0.3 / 0.3
    compliance_score = log_adherence  # Sẽ cập nhật khi có WorkoutSession

    return BaseResponse(
        data={
            "today": {
                "date": today.isoformat(),
                "dfi": today_dfi,
                "has_log": today_log is not None,
                "weight": today_log.weight if today_log else None,
                "sleep_hours": today_log.sleep_hours if today_log else None,
            },
            "compliance_score": compliance_score,
            "log_adherence_7d": log_adherence,
            "history_7d": history,
        },
        message="Summary fetched successfully"
    )


# ─── Phase-based DailyLog Endpoints ─────────────────────────────────────────

@router.get("/phase/{phase_id}", response_model=BaseResponse[list[DailyLogResponse]])
async def get_phase_daily_logs(
    phase_id: int, current_user: CurrentUser, session: SessionDep,
):
    """Get all DailyLogs for a specific Phase."""
    phase = await session.get(Phase, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    # Verify ownership via Session
    parent = await session.get(Session, phase.session_id)
    if not parent or parent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    stmt = (
        select(DailyLog)
        .where(DailyLog.phase_id == phase_id, DailyLog.user_id == current_user.id)
        .order_by(DailyLog.log_date.asc())
    )
    logs = (await session.execute(stmt)).scalars().all()
    return BaseResponse(data=logs)


@router.put("/phase/{phase_id}/upsert", response_model=BaseResponse[DailyLogResponse])
async def upsert_daily_log(
    phase_id: int, data: DailyLogInlineUpsert,
    current_user: CurrentUser, session: SessionDep,
):
    """
    UPSERT a DailyLog for inline editing from Phase UI.
    - If log for (user, log_date) exists → update it.
    - If not → create it with snapshot from Phase targets.
    - Auto-calculate compliance_score.
    """
    phase = await session.get(Phase, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    parent = await session.get(Session, phase.session_id)
    if not parent or parent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Validate log_date is within Phase range
    if data.log_date < phase.start_date or data.log_date > phase.end_date:
        raise HTTPException(status_code=400, detail="log_date nằm ngoài khoảng ngày của Phase")

    # Find existing log
    stmt = select(DailyLog).where(
        DailyLog.user_id == current_user.id,
        DailyLog.log_date == data.log_date,
    )
    log = (await session.execute(stmt)).scalar_one_or_none()

    if log:
        # UPDATE existing
        update_data = data.model_dump(exclude_unset=True, exclude={"log_date"})
        for field, value in update_data.items():
            if value is not None:
                setattr(log, field, value)
        # Ensure phase_id is set
        log.phase_id = phase_id
    else:
        # CREATE new with snapshot
        log = DailyLog(
            user_id=current_user.id,
            phase_id=phase_id,
            log_date=data.log_date,
            target_calories_snapshot=phase.target_calories,
            target_protein_snapshot=phase.target_protein,
            target_carbs_snapshot=phase.target_carbs,
            target_fat_snapshot=phase.target_fat,
            **data.model_dump(exclude={"log_date"}, exclude_unset=False),
        )

    # Auto-calculate compliance score
    log.compliance_score = _calculate_compliance(log, phase)

    session.add(log)
    await session.commit()
    await session.refresh(log)
    return BaseResponse(data=log, message="Daily log saved")


def _calculate_compliance(log: DailyLog, phase: Phase) -> float:
    """
    Compliance Score = (nutrition% × w1) + (workout% × w2) + (weight_logged% × w3)
    """
    scores = []
    weights = []

    nutrition_weight = 0.5
    workout_weight = 0.3
    weight_log_weight = 0.2

    # Nutrition score: actual vs target calories
    if phase.target_calories and phase.target_calories > 0 and log.calories_in:
        ratio = log.calories_in / phase.target_calories
        # Phạt nếu vượt quá 20%: mỗi 1% vượt trừ 2 điểm
        if ratio > 1.2:
            nutrition_pct = max(0, 100 - (ratio - 1.0) * 200)
        elif ratio > 1.0:
            nutrition_pct = 100.0  # Trong ngưỡng chấp nhận
        else:
            nutrition_pct = ratio * 100
        scores.append(nutrition_pct * nutrition_weight)
        weights.append(nutrition_weight)

    # Workout score: completed or not
    if log.is_workout_completed is not None:
        workout_pct = 100.0 if log.is_workout_completed else 0.0
        scores.append(workout_pct * workout_weight)
        weights.append(workout_weight)

    # Weight logging score: did user log weight today?
    weight_pct = 100.0 if log.weight is not None else 0.0
    scores.append(weight_pct * weight_log_weight)
    weights.append(weight_log_weight)

    if not weights:
        return 0.0

    total_weight = sum(weights)
    return round(sum(scores) / total_weight, 1) if total_weight > 0 else 0.0
