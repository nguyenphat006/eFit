from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import select, col, func
from sqlalchemy.orm import selectinload
from typing import Any, Optional
from app.api.deps import SessionDep, CurrentUser
from app.models.nutrition import FoodItem, FoodCategory
from app.schemas.nutrition import FoodItemRead, FoodItemCreate, FoodItemUpdate
from app.schemas.response import BaseResponse, PaginatedResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[FoodItemRead])
async def get_foods(
    session: SessionDep,
    q: Optional[str] = None,
    category_code: Optional[str] = None,
    is_system_data: Optional[bool] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> Any:
    """
    Get a paginated list of foods with search and filtering.
    """
    statement = select(FoodItem).options(selectinload(FoodItem.category))
    
    if q:
        statement = statement.where(col(FoodItem.name).ilike(f"%{q}%"))
    if category_code:
        statement = statement.where(FoodItem.category_code == category_code)
    if is_system_data is not None:
        statement = statement.where(FoodItem.is_system_data == is_system_data)

    # Count total
    count_statement = select(func.count()).select_from(statement.subquery())
    total_result = await session.execute(count_statement)
    total = total_result.scalar_one()

    # Pagination & Sorting
    statement = statement.order_by(FoodItem.name).offset((page - 1) * size).limit(size)
    result = await session.execute(statement)
    foods = result.scalars().all()

    return PaginatedResponse(
        data=foods,
        total=total,
        page=page,
        size=size
    )

@router.post("", response_model=BaseResponse[FoodItemRead])
async def create_food(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    food_in: FoodItemCreate,
) -> Any:
    """
    Create new food item.
    """
    # Check category
    category = await session.get(FoodCategory, food_in.category_code)
    if not category:
        raise HTTPException(status_code=400, detail="Category not found")
        
    food = FoodItem.model_validate(food_in)
    food.created_by = current_user.id
    
    # If standard user, force to non-system data
    if not current_user.role_id or current_user.role.name != "Admin":
        food.is_system_data = False
        
    session.add(food)
    await session.commit()
    
    # Reload with category eager-loaded
    stmt = select(FoodItem).options(selectinload(FoodItem.category)).where(FoodItem.id == food.id)
    res = await session.execute(stmt)
    food = res.scalar_one()
    
    return BaseResponse(data=food, message="Food created successfully")

@router.get("/{id}", response_model=BaseResponse[FoodItemRead])
async def get_food(
    id: int,
    session: SessionDep,
) -> Any:
    """
    Get a specific food item by ID.
    """
    statement = select(FoodItem).options(selectinload(FoodItem.category)).where(FoodItem.id == id)
    result = await session.execute(statement)
    food = result.scalar_one_or_none()
    
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    return BaseResponse(data=food)

@router.put("/{id}", response_model=BaseResponse[FoodItemRead])
async def update_food(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: int,
    food_in: FoodItemUpdate,
) -> Any:
    """
    Update a food item.
    """
    food = await session.get(FoodItem, id)
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
        
    # Only admins can update system data, users can only update their own data
    is_admin = current_user.role_id and current_user.role.name == "Admin"
    if food.is_system_data and not is_admin:
        raise HTTPException(status_code=403, detail="Cannot edit system food data")
    if not food.is_system_data and food.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    update_data = food_in.model_dump(exclude_unset=True)
    
    if "category_code" in update_data:
        category = await session.get(FoodCategory, update_data["category_code"])
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
            
    for field, value in update_data.items():
        setattr(food, field, value)
        
    food.updated_by = current_user.id
    session.add(food)
    await session.commit()
    
    # Reload with category eager-loaded
    stmt = select(FoodItem).options(selectinload(FoodItem.category)).where(FoodItem.id == food.id)
    res = await session.execute(stmt)
    food = res.scalar_one()
    
    return BaseResponse(data=food, message="Food updated successfully")

@router.delete("/{id}", response_model=BaseResponse)
async def delete_food(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: int,
) -> Any:
    """
    Delete a food item.
    """
    food = await session.get(FoodItem, id)
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
        
    is_admin = current_user.role_id and current_user.role.name == "Admin"
    if food.is_system_data and not is_admin:
        raise HTTPException(status_code=403, detail="Cannot delete system food data")
    if not food.is_system_data and food.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    await session.delete(food)
    await session.commit()
    return BaseResponse(message="Food deleted successfully")
