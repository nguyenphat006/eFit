from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from uuid import uuid4
import aiofiles

from app.core.config import settings
from app.api.deps import CurrentUser
from app.schemas.response import BaseResponse

router = APIRouter()

IMAGES_DIR = Path(settings.UPLOAD_DIR) / "images"


@router.post("/image", response_model=BaseResponse[dict])
async def upload_image(
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    """
    Upload an image file.
    - Allowed types: JPEG, PNG, WebP
    - Max size: 5MB
    - Returns the public URL of the uploaded image.
    """
    # Validate content type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use JPEG, PNG, or WebP.",
        )

    # Read file and validate size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB.",
        )

    # Generate unique filename
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"
    filename = f"{uuid4().hex}{ext}"
    filepath = IMAGES_DIR / filename

    # Ensure directory exists
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Write file
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)

    # Build public URL
    image_url = f"{settings.BASE_URL}/uploads/images/{filename}"

    return BaseResponse(
        data={"url": image_url, "filename": filename},
        message="Image uploaded successfully",
    )
