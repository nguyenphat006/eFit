from typing import Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlmodel import select, func, or_
from app.api.deps import SessionDep, get_current_user
from app.models.fitness import Exercise, User
from app.schemas.exercise import ExerciseRead, ExerciseCreate, ExerciseUpdate

router = APIRouter()

@router.get("/", response_model=dict)
async def list_exercises(
    db: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    category: list[str] = Query(None),
    equipment: list[str] = Query(None),
    target: list[str] = Query(None),
) -> Any:
    """
    Retrieve exercises.
    """
    query = select(Exercise)

    if search:
        query = query.where(Exercise.name.ilike(f"%{search}%"))
    if category:
        query = query.where(Exercise.category.in_(category))
    if equipment:
        query = query.where(Exercise.equipment.in_(equipment))
    if target:
        query = query.where(Exercise.target.in_(target))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Get items
    query = query.offset(skip).limit(limit).order_by(Exercise.name)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{id}", response_model=ExerciseRead)
async def get_exercise(
    id: int,
    db: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get exercise by ID.
    """
    exercise = await db.get(Exercise, id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.post("/", response_model=ExerciseRead)
async def create_exercise(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_user),
    exercise_in: ExerciseCreate,
) -> Any:
    """
    Create new exercise.
    """
    exercise = Exercise.model_validate(exercise_in)
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise

@router.put("/{id}", response_model=ExerciseRead)
async def update_exercise(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_user),
    id: int,
    exercise_in: ExerciseUpdate,
) -> Any:
    """
    Update an exercise.
    """
    exercise = await db.get(Exercise, id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    update_data = exercise_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)

    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise

@router.delete("/{id}")
async def delete_exercise(
    *,
    db: SessionDep,
    current_user: User = Depends(get_current_user),
    id: int,
) -> Any:
    """
    Delete an exercise.
    """
    exercise = await db.get(Exercise, id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    await db.delete(exercise)
    await db.commit()
    return {"success": True}
