from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select
from typing import Any, Optional
from datetime import date
import math

from app.api.deps import SessionDep, CurrentUser
from app.models.fitness import Client, User
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientRead, ClientListRead, ClientLinkAccount,
)
from app.schemas.response import BaseResponse, PaginatedResponse

router = APIRouter()


# ─── Client CRUD ─────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[ClientListRead])
async def list_clients(
    session: SessionDep,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status: Active / Inactive / Archived"),
    search: Optional[str] = Query(None, description="Tìm theo tên hoặc SĐT"),
) -> Any:
    """Lấy danh sách học viên của PT hiện tại."""
    from sqlalchemy import func, or_

    base_filter = Client.coach_id == current_user.id

    # Count
    count_stmt = select(func.count(Client.id)).where(base_filter)
    if status:
        count_stmt = count_stmt.where(Client.status == status)
    if search:
        count_stmt = count_stmt.where(
            or_(
                Client.full_name.ilike(f"%{search}%"),
                Client.phone.ilike(f"%{search}%"),
            )
        )
    total = (await session.execute(count_stmt)).scalar() or 0

    # Query
    stmt = select(Client).where(base_filter)
    if status:
        stmt = stmt.where(Client.status == status)
    if search:
        stmt = stmt.where(
            or_(
                Client.full_name.ilike(f"%{search}%"),
                Client.phone.ilike(f"%{search}%"),
            )
        )
    stmt = stmt.order_by(Client.created_at.desc()).offset((page - 1) * size).limit(size)
    clients = (await session.execute(stmt)).scalars().all()

    return PaginatedResponse(
        data=clients, total=total, page=page, size=size,
        total_pages=math.ceil(total / size) if size > 0 else 1
    )


@router.get("/{client_id}", response_model=BaseResponse[ClientRead])
async def get_client(
    client_id: int, session: SessionDep, current_user: CurrentUser,
) -> Any:
    """Lấy chi tiết 1 học viên."""
    client = await session.get(Client, client_id)
    if not client or client.coach_id != current_user.id:
        raise HTTPException(status_code=404, detail="Học viên không tồn tại")
    return BaseResponse(data=client)


@router.post("", response_model=BaseResponse[ClientRead])
async def create_client(
    session: SessionDep, current_user: CurrentUser, data: ClientCreate,
) -> Any:
    """PT tạo học viên mới."""
    client = Client(
        coach_id=current_user.id,
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        current_weight=data.current_weight,
        height=data.height,
        body_fat_percentage=data.body_fat_percentage,
        fitness_goal=data.fitness_goal,
        activity_level=data.activity_level,
        training_frequency=data.training_frequency,
        notes=data.notes,
    )
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return BaseResponse(data=client, message="Thêm học viên thành công")


@router.put("/{client_id}", response_model=BaseResponse[ClientRead])
async def update_client(
    client_id: int, session: SessionDep, current_user: CurrentUser, data: ClientUpdate,
) -> Any:
    """Cập nhật thông tin học viên."""
    client = await session.get(Client, client_id)
    if not client or client.coach_id != current_user.id:
        raise HTTPException(status_code=404, detail="Học viên không tồn tại")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    session.add(client)
    await session.commit()
    await session.refresh(client)
    return BaseResponse(data=client, message="Cập nhật thông tin học viên thành công")


@router.delete("/{client_id}", response_model=BaseResponse)
async def delete_client(
    client_id: int, session: SessionDep, current_user: CurrentUser,
) -> Any:
    """Xóa học viên (soft delete bằng cách chuyển status → Archived)."""
    client = await session.get(Client, client_id)
    if not client or client.coach_id != current_user.id:
        raise HTTPException(status_code=404, detail="Học viên không tồn tại")

    client.status = "Archived"
    session.add(client)
    await session.commit()
    return BaseResponse(message="Đã lưu trữ học viên")


# ─── Link Account ────────────────────────────────────────────────────────────

@router.post("/{client_id}/link-account", response_model=BaseResponse[ClientRead])
async def link_client_account(
    client_id: int, session: SessionDep, current_user: CurrentUser,
    data: ClientLinkAccount,
) -> Any:
    """
    Liên kết tài khoản eFit (User) cho một Client.
    Khi học viên tự đăng ký tài khoản eFit, PT có thể liên kết
    tài khoản đó với hồ sơ Client đã tạo sẵn.
    """
    client = await session.get(Client, client_id)
    if not client or client.coach_id != current_user.id:
        raise HTTPException(status_code=404, detail="Học viên không tồn tại")

    # Kiểm tra User tồn tại
    user = await session.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản User không tồn tại")

    # Kiểm tra user_id chưa bị link với Client khác
    stmt = select(Client).where(Client.user_id == data.user_id, Client.id != client_id)
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Tài khoản này đã được liên kết với học viên '{existing.full_name}'"
        )

    client.user_id = data.user_id
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return BaseResponse(data=client, message="Liên kết tài khoản thành công")


@router.delete("/{client_id}/link-account", response_model=BaseResponse[ClientRead])
async def unlink_client_account(
    client_id: int, session: SessionDep, current_user: CurrentUser,
) -> Any:
    """Hủy liên kết tài khoản eFit khỏi Client."""
    client = await session.get(Client, client_id)
    if not client or client.coach_id != current_user.id:
        raise HTTPException(status_code=404, detail="Học viên không tồn tại")

    client.user_id = None
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return BaseResponse(data=client, message="Đã hủy liên kết tài khoản")
