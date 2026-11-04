from sqlmodel import Field, Relationship
from typing import Optional, List
from app.models.base import TimeStampedModel

class FoodCategory(TimeStampedModel, table=True):
    code: str = Field(primary_key=True, index=True) # VD: "GRAINS", "MEATS", "RECIPE"
    name: str = Field(nullable=False) # VD: "Lương thực", "Thịt gia cầm", "Món ăn"
    description: Optional[str] = None
    
    foods: List["FoodItem"] = Relationship(back_populates="category")

class FoodItem(TimeStampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, nullable=False)
    
    category_code: str = Field(foreign_key="foodcategory.code", nullable=False)
    category: FoodCategory = Relationship(back_populates="foods")
    
    # --- Macro Gốc (BẮT BUỘC TÍNH TRÊN 100g / 100ml / Hoặc 1 serving chuẩn đối với RECIPE) ---
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = 0.0
    image_url: Optional[str] = None
    
    # --- Quy đổi để người dùng dễ dùng ---
    base_unit: str = Field(default="100g") # "100g", "100ml", "1 tô", "1 phần"
    default_serving_name: Optional[str] = None # Vd: "1 quả", "1 chén", "1 muỗng"
    default_serving_weight: Optional[float] = None # Vd: 50.0 (g)
    
    # --- Phân quyền ---
    is_system_data: bool = Field(default=True) # True: Thuộc Master Data, False: User tự tạo
