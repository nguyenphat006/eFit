from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep, CurrentUser, RequirePermission
from app.models.fitness import User
from app.models.auth import Role, Permission, RolePermissionLink
from app.schemas.user import RoleRead, PermissionRead
from app.schemas.response import BaseResponse

router = APIRouter()

class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    permission_ids: List[int] = []

class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_ids: List[int] | None = None

@router.get("/", response_model=BaseResponse[List[RoleRead]])
async def read_roles(
    session: SessionDep,
    current_user: User = Depends(RequirePermission("manage_roles")),
) -> Any:
    """
    Get all roles.
    """
    statement = select(Role).options(selectinload(Role.permissions))
    result = await session.execute(statement)
    return BaseResponse(data=result.scalars().all())

@router.post("/", response_model=BaseResponse[RoleRead])
async def create_role(
    *, session: SessionDep, role_in: RoleCreate,
    current_user: User = Depends(RequirePermission("manage_roles"))
) -> Any:
    """
    Create a new role with permissions.
    """
    # Check if role exists
    statement = select(Role).where(Role.name == role_in.name)
    result = await session.execute(statement)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role already exists")
        
    db_role = Role(name=role_in.name, description=role_in.description)
    
    if role_in.permission_ids:
        perms_stmt = select(Permission).where(Permission.id.in_(role_in.permission_ids))
        perms_result = await session.execute(perms_stmt)
        db_role.permissions = list(perms_result.scalars().all())
        
    session.add(db_role)
    await session.commit()
    await session.refresh(db_role)
    
    # Reload with permissions for response
    reload_stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == db_role.id)
    reload_res = await session.execute(reload_stmt)
    return BaseResponse(data=reload_res.scalar_one())

@router.put("/{id}", response_model=BaseResponse[RoleRead])
async def update_role(
    *, session: SessionDep, id: int, role_in: RoleUpdate,
    current_user: User = Depends(RequirePermission("manage_roles"))
) -> Any:
    """
    Update a role and its permissions.
    """
    # Get role
    statement = select(Role).options(selectinload(Role.permissions)).where(Role.id == id)
    result = await session.execute(statement)
    db_role = result.scalar_one_or_none()
    
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role_in.name is not None:
        db_role.name = role_in.name
    if role_in.description is not None:
        db_role.description = role_in.description
        
    if role_in.permission_ids is not None:
        perms_stmt = select(Permission).where(Permission.id.in_(role_in.permission_ids))
        perms_result = await session.execute(perms_stmt)
        db_role.permissions = list(perms_result.scalars().all())
        
    session.add(db_role)
    await session.commit()
    await session.refresh(db_role)
    
    # Reload with permissions for response
    reload_stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == db_role.id)
    reload_res = await session.execute(reload_stmt)
    return BaseResponse(message="Role updated successfully", data=reload_res.scalar_one())
