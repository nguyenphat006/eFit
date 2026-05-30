from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.base import TimeStampedSchema, IDModel

# --- Food Category Schemas ---
class FoodCategoryBase(BaseModel):
    code: str = Field(..., description="Unique code for category, e.g., GRAINS")
    name: str = Field(..., description="Name of the category, e.g., Lương thực")
    description: Optional[str] = None

class FoodCategoryCreate(FoodCategoryBase):
    pass

class FoodCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class FoodCategoryRead(TimeStampedSchema, FoodCategoryBase):
    pass

# --- Food Item Schemas ---
class FoodItemBase(BaseModel):
    name: str
    category_code: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = 0.0
    base_unit: str = "100g"
    default_serving_name: Optional[str] = None
    default_serving_weight: Optional[float] = None
    is_system_data: bool = True

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemUpdate(BaseModel):
    name: Optional[str] = None
    category_code: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    base_unit: Optional[str] = None
    default_serving_name: Optional[str] = None
    default_serving_weight: Optional[float] = None
    is_system_data: Optional[bool] = None

class FoodItemRead(TimeStampedSchema, FoodItemBase, IDModel):
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    category: Optional[FoodCategoryRead] = None
