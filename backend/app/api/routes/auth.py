from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import select
from sqlalchemy.orm import selectinload

class LoginForm:
    def __init__(
        self,
        username: str = Form(..., description="Email"),
        password: str = Form(..., description="Password"),
    ):
        self.username = username
        self.password = password

from app.api.deps import SessionDep, CurrentUser
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.fitness import User
from app.models.auth import Role
from app.schemas.user import UserCreate, UserRead, Token, UserReadWithRole, UserReadWithRoleAndPermissions
from app.schemas.response import BaseResponse

router = APIRouter()

@router.post("/login", response_model=BaseResponse[Token])
async def login_access_token(
    session: SessionDep, form_data: LoginForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    statement = select(User).where(User.email == form_data.username)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    return BaseResponse(
        data=Token(
            access_token=create_access_token(user.id),
            token_type="bearer",
        )
    )

@router.post("/register", response_model=BaseResponse[UserRead])
async def register_user(
    *, session: SessionDep, user_in: UserCreate
) -> Any:
    """
    Create new user.
    """
    statement = select(User).where(User.email == user_in.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
        
    # Optional: Assign default role (e.g., Member) if it exists
    role_statement = select(Role).where(Role.name == "Member")
    role_result = await session.execute(role_statement)
    member_role = role_result.scalar_one_or_none()
    
    user_obj = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        fitness_goal=user_in.fitness_goal,
        role_id=member_role.id if member_role else None
    )
    session.add(user_obj)
    await session.commit()
    await session.refresh(user_obj)
    return BaseResponse(message="User registered successfully", data=user_obj)

@router.get("/me", response_model=BaseResponse[UserReadWithRoleAndPermissions])
async def read_user_me(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get current user.
    """
    # Load role and permissions
    if current_user.role_id:
        statement = select(User).options(
            selectinload(User.role).selectinload(Role.permissions)
        ).where(User.id == current_user.id)
        result = await session.execute(statement)
        user_with_role = result.scalar_one_or_none()
        return BaseResponse(data=user_with_role)
    return BaseResponse(data=current_user)

from app.schemas.user import UserUpdate

@router.put("/me", response_model=BaseResponse[UserRead])
async def update_user_me(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    user_in: UserUpdate,
) -> Any:
    """
    Update current user profile.
    """
    update_data = user_in.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
    elif "password" in update_data:
        del update_data["password"]

    if "email" in update_data and update_data["email"] != current_user.email:
        statement = select(User).where(User.email == update_data["email"])
        result = await session.execute(statement)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )

    for field, value in update_data.items():
        setattr(current_user, field, value)

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return BaseResponse(message="Profile updated successfully", data=current_user)
