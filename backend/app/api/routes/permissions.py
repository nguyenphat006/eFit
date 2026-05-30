from typing import Any, List
from fastapi import APIRouter, Depends
from sqlmodel import select
from fastapi import Request

from app.api.deps import SessionDep, CurrentUser, RequirePermission
from app.models.fitness import User
from app.models.auth import Permission
from app.schemas.user import PermissionRead
from app.schemas.response import BaseResponse
from pydantic import BaseModel

router = APIRouter()

class APIRouteInfo(BaseModel):
    path: str
    methods: List[str]
    required_permission: str | None = None

class ModuleAPIInfo(BaseModel):
    module: str
    api_count: int
    apis: List[APIRouteInfo]

@router.get("/", response_model=BaseResponse[List[PermissionRead]])
async def read_permissions(
    session: SessionDep,
    current_user: User = Depends(RequirePermission("manage_roles")),
) -> Any:
    """
    Get all permissions in the system database.
    """
    statement = select(Permission)
    result = await session.execute(statement)
    return BaseResponse(data=result.scalars().all())

@router.get("/system-routes", response_model=BaseResponse[List[ModuleAPIInfo]])
async def read_system_routes(
    request: Request,
    current_user: User = Depends(RequirePermission("manage_roles"))
) -> Any:
    """
    Get all registered API routes grouped by module (tag),
    including the permissions required for each endpoint.
    """
    modules = {}
    
    for route in request.app.routes:
        if not hasattr(route, 'dependant'):
            continue
            
        tags = getattr(route, "tags", [])
        module_name = tags[0] if tags else "General"
        
        required_perm = None
        for dep in route.dependant.dependencies:
            if hasattr(dep, "call") and hasattr(dep.call, "required_permission"):
                required_perm = dep.call.required_permission
                break
                
        route_info = APIRouteInfo(
            path=route.path,
            methods=list(route.methods),
            required_permission=required_perm
        )
        
        if module_name not in modules:
            modules[module_name] = []
            
        modules[module_name].append(route_info)
        
    result = []
    for module, apis in modules.items():
        result.append(ModuleAPIInfo(
            module=module,
            api_count=len(apis),
            apis=apis
        ))
        
    return BaseResponse(data=result)
