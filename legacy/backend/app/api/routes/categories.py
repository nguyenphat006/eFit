from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import Any, List
from app.api.deps import SessionDep, CurrentUser
from app.models.nutrition import FoodCategory
from app.schemas.nutrition import FoodCategoryRead, FoodCategoryCreate, FoodCategoryUpdate
from app.schemas.response import BaseResponse

router = APIRouter()

@router.get("", response_model=BaseResponse[List[FoodCategoryRead]])
async def get_categories(
    session: SessionDep,
) -> Any:
    """
    Get all food categories.
    """
    statement = select(FoodCategory).order_by(FoodCategory.name)
    result = await session.execute(statement)
    categories = result.scalars().all()
    
    return BaseResponse(data=categories)

@router.post("", response_model=BaseResponse[FoodCategoryRead])
async def create_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    category_in: FoodCategoryCreate,
) -> Any:
    """
    Create a new food category (Admin only).
    """
    # Assuming standard users can't create master categories
    if not current_user.role_id or current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    category = await session.get(FoodCategory, category_in.code)
    if category:
        raise HTTPException(status_code=400, detail="Category code already exists")
        
    new_category = FoodCategory.model_validate(category_in)
    new_category.created_by = current_user.id
    
    session.add(new_category)
    await session.commit()
    await session.refresh(new_category)
    return BaseResponse(data=new_category, message="Category created successfully")

@router.get("/{code}", response_model=BaseResponse[FoodCategoryRead])
async def get_category(
    code: str,
    session: SessionDep,
) -> Any:
    """
    Get a food category by code.
    """
    category = await session.get(FoodCategory, code)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return BaseResponse(data=category)

@router.put("/{code}", response_model=BaseResponse[FoodCategoryRead])
async def update_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    code: str,
    category_in: FoodCategoryUpdate,
) -> Any:
    """
    Update a food category (Admin only).
    """
    if not current_user.role_id or current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    category = await session.get(FoodCategory, code)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
        
    category.updated_by = current_user.id
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return BaseResponse(data=category, message="Category updated successfully")

@router.delete("/{code}", response_model=BaseResponse)
async def delete_category(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    code: str,
) -> Any:
    """
    Delete a food category (Admin only).
    """
    if not current_user.role_id or current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    category = await session.get(FoodCategory, code)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await session.delete(category)
    await session.commit()
    return BaseResponse(message="Category deleted successfully")
