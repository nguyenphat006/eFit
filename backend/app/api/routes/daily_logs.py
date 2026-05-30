from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List

from app.db.session import get_session
from app.models.fitness import DailyLog
from app.schemas.daily_log import DailyLogCreate, DailyLogUpdate, DailyLogResponse
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
