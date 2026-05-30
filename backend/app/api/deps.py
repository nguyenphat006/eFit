from typing import Annotated, Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.core.config import settings
from app.db.session import async_session
from app.models.fitness import User
from app.models.auth import Role, Permission

security = HTTPBearer()

async def get_db_session():
    async with async_session() as session:
        yield session

async def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    return credentials.credentials

SessionDep = Annotated[Session, Depends(get_db_session)]
TokenDep = Annotated[str, Depends(get_token)]

async def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = await session.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

class RequirePermission:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    async def __call__(self, current_user: CurrentUser, session: SessionDep) -> User:
        if not current_user.role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions (no role assigned)",
            )
        
        # Load role with permissions
        # Currently, SQLModel async session might need explicit eager loading for relationships,
        # but let's query it explicitly to be safe in async mode.
        from sqlalchemy.orm import selectinload
        
        statement = select(Role).options(selectinload(Role.permissions)).where(Role.id == current_user.role_id)
        result = await session.execute(statement)
        role = result.scalar_one_or_none()
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions (role not found)",
            )
            
        has_permission = any(perm.name == self.required_permission for perm in role.permissions)
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Requires: {self.required_permission}",
            )
            
        return current_user
