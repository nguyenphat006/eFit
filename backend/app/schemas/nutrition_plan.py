from pydantic import BaseModel, Field
from typing import List, Optional

class MealItemBase(BaseModel):
    food_category_code: str
    food_item_id: Optional[int] = None
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    primary_food_text: str
    alternatives_text: str

class MealBase(BaseModel):
    name: str
    order: int
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float

class NutritionPlanBase(BaseModel):
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    notes: Optional[str] = None

class MealItemCreate(BaseModel):
    food_category_code: str
    food_item_id: Optional[int] = None
    grams: Optional[float] = None  # UI can pass this for reference, but backend only relies on macros
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    primary_food_text: str
    alternatives_text: str

class MealCreate(BaseModel):
    name: str
    order: int
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    items: List[MealItemCreate] = []

class NutritionPlanCreate(BaseModel):
    notes: Optional[str] = None
    meals: List[MealCreate] = []

# --- Output Schemas ---
class MealItemRead(MealItemBase):
    id: int
    meal_id: int

class MealRead(MealBase):
    id: int
    plan_id: int
    items: List[MealItemRead] = []

class NutritionPlanRead(NutritionPlanBase):
    id: int
    phase_id: int
    meals: List[MealRead] = []

# --- AI Output Schemas ---
class AIMealItem(BaseModel):
    category_code: str = Field(description="Mã nhóm thực phẩm (ví dụ: GRAINS, MEATS, FRUITS, VEGETABLES, FATS)")
    target_carbs: float
    target_protein: float
    target_fat: float

class AIMeal(BaseModel):
    name: str = Field(description="Tên bữa ăn (ví dụ: Meal 1, Meal 2, Meal 3)")
    items: List[AIMealItem] = Field(description="Danh sách các thành phần trong bữa ăn")

class AINutritionPlan(BaseModel):
    meals: List[AIMeal] = Field(description="Danh sách các bữa ăn được chia theo tổng Macros")
    notes: str = Field(description="Lời khuyên hoặc lưu ý chung về chế độ ăn")
