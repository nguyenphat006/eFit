from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUser, RequirePermission
from app.models.fitness import User
from app.models.auth import Role
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserReadWithRole, UserReadWithRoleAndPermissions
from app.schemas.response import BaseResponse, PaginatedResponse
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[UserReadWithRole])
async def read_users(
    session: SessionDep,
    page: int = 1,
    size: int = 50,
    current_user: User = Depends(RequirePermission("manage_users")),
) -> Any:
    """
    Retrieve users.
    """
    from sqlalchemy import func
    import math
    
    count_statement = select(func.count(User.id))
    total = (await session.execute(count_statement)).scalar() or 0

    statement = select(User).options(
        selectinload(User.role)
    ).offset((page - 1) * size).limit(size)
    result = await session.execute(statement)
    users = result.scalars().all()
    
    total_pages = math.ceil(total / size) if size > 0 else 1
    
    return PaginatedResponse(
        data=users,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/{user_id}", response_model=BaseResponse[UserReadWithRoleAndPermissions])
async def read_user_by_id(
    user_id: int,
    session: SessionDep,
    current_user: User = Depends(RequirePermission("manage_users")),
) -> Any:
    """
    Get a specific user by id.
    """
    statement = select(User).options(
        selectinload(User.role).selectinload(Role.permissions)
    ).where(User.id == user_id)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return BaseResponse(data=user)

@router.post("/", response_model=BaseResponse[UserRead])
async def create_user(
    *, session: SessionDep, user_in: UserCreate,
    current_user: User = Depends(RequirePermission("manage_users"))
) -> Any:
    """
    Create new user.
    """
    statement = select(User).where(User.email == user_in.email)
    result = await session.execute(statement)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user_obj = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        fitness_goal=user_in.fitness_goal,
    )
    
    # Assign member role by default if created via API and no specific role specified
    # Actually, UserCreate doesn't take role_id. Let's just create as Member.
    role_statement = select(Role).where(Role.name == "Member")
    role_result = await session.execute(role_statement)
    member_role = role_result.scalar_one_or_none()
    if member_role:
        user_obj.role_id = member_role.id

    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)
    return BaseResponse(message="User created successfully", data=user_obj)

@router.put("/{user_id}", response_model=BaseResponse[UserRead])
async def update_user(
    *, session: SessionDep, user_id: int, user_in: UserUpdate,
    current_user: User = Depends(RequirePermission("manage_users"))
) -> Any:
    """
    Update a user.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.email is not None:
        # Check if email is already taken
        statement = select(User).where(User.email == user_in.email, User.id != user_id)
        result = await session.execute(statement)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_in.email
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.fitness_goal is not None:
        user.fitness_goal = user_in.fitness_goal
    if user_in.password is not None:
        user.hashed_password = get_password_hash(user_in.password)
    if user_in.role_id is not None:
        # Verify role exists
        role = await session.get(Role, user_in.role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        user.role_id = user_in.role_id

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return BaseResponse(message="User updated successfully", data=user)

@router.delete("/{user_id}", response_model=BaseResponse[dict])
async def delete_user(
    *, session: SessionDep, user_id: int,
    current_user: User = Depends(RequirePermission("manage_users"))
) -> Any:
    """
    Delete a user.
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Users cannot delete themselves.")
        
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await session.delete(user)
    await session.commit()
    return BaseResponse(message="User deleted successfully", data=None)
