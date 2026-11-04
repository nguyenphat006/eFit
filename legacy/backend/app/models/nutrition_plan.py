from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from app.models.base import TimeStampedModel
from sqlalchemy import UniqueConstraint

class NutritionPlan(TimeStampedModel, table=True):
    __tablename__ = "nutritionplan"
    id: Optional[int] = Field(default=None, primary_key=True)
    phase_id: int = Field(foreign_key="phase.id", nullable=False, index=True, unique=True)
    
    # Snapshot of the target macros at the time this plan was created
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    
    notes: Optional[str] = None
    
    phase: "Phase" = Relationship(back_populates="nutrition_plan")
    meals: List["Meal"] = Relationship(back_populates="plan", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class Meal(TimeStampedModel, table=True):
    __tablename__ = "meal"
    id: Optional[int] = Field(default=None, primary_key=True)
    plan_id: int = Field(foreign_key="nutritionplan.id", nullable=False)
    name: str  # e.g. "Meal 1", "Meal 2"
    order: int = Field(default=0)
    
    # Macro targets for this specific meal
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    
    plan: NutritionPlan = Relationship(back_populates="meals")
    items: List["MealItem"] = Relationship(back_populates="meal", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class MealItem(TimeStampedModel, table=True):
    __tablename__ = "mealitem"
    id: Optional[int] = Field(default=None, primary_key=True)
    meal_id: int = Field(foreign_key="meal.id", nullable=False)
    
    food_category_code: str = Field(foreign_key="foodcategory.code", nullable=False)
    food_item_id: Optional[int] = Field(default=None, foreign_key="fooditem.id")
    
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fat: float
    
    primary_food_text: str  # e.g. "140g Cơm trắng"
    alternatives_text: str  # e.g. "Có thể thay bằng: 200g Khoai lang..."
    
    meal: Meal = Relationship(back_populates="items")
