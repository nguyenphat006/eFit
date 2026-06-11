from fastapi import APIRouter, HTTPException, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from typing import Any
import json
from decimal import Decimal, ROUND_HALF_UP

from app.api.deps import SessionDep, CurrentUser
from app.models.fitness import Phase, Session as TrainingSession
from app.models.nutrition import FoodItem, FoodCategory
from app.models.nutrition_plan import NutritionPlan, Meal, MealItem
from app.schemas.response import BaseResponse
from app.schemas.nutrition_plan import NutritionPlanRead, NutritionPlanCreate
from app.core.config import settings

router = APIRouter(prefix="/nutrition-plans")


async def _get_owned_phase(session: AsyncSession, phase_id: int, current_user) -> Phase:
    """Fetch a Phase and verify the requesting user owns the parent Session."""
    phase = await session.get(Phase, phase_id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    parent = await session.get(TrainingSession, phase.session_id)
    if not parent or parent.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return phase

async def generate_alternatives_text(session: AsyncSession, category_code: str, target_carbs: float, target_protein: float, target_fat: float) -> tuple[int, str, str]:
    """
    Finds the primary food and generates alternatives text based on the target macros.
    Returns: (primary_food_id, primary_food_text, alternatives_text)
    """
    stmt = select(FoodItem).where(FoodItem.category_code == category_code)
    foods = (await session.execute(stmt)).scalars().all()
    
    if not foods:
        return None, f"Unknown ({category_code})", "Không tìm thấy thực phẩm thay thế"
        
    # Logic to calculate grams needed based on the most dominant target macro
    # If category is GRAINS, we match by carbs. If MEATS, match by protein. If FATS, match by fat.
    match_macro = "protein"
    if category_code in ["GRAINS", "FRUITS", "VEGETABLES"]:
        match_macro = "carbs"
    elif category_code in ["FATS", "NUTS"]:
        match_macro = "fat"
        
    target_val = target_carbs if match_macro == "carbs" else (target_fat if match_macro == "fat" else target_protein)
    
    # Calculate grams for each food
    calculated_foods = []
    for f in foods:
        f_macro_val = getattr(f, match_macro)
        if f_macro_val and f_macro_val > 0:
            grams = (target_val / f_macro_val) * 100
            grams_rounded = int(Decimal(grams).quantize(Decimal('10'), rounding=ROUND_HALF_UP))
            # Round to nearest 10g for simplicity
            if grams_rounded > 0:
                calculated_foods.append({
                    "id": f.id,
                    "text": f"{grams_rounded}g {f.name}"
                })
                
    if not calculated_foods:
         return None, f"Tùy chọn ({category_code})", "Không tính được thực phẩm thay thế"
         
    # Pick the first one as primary
    primary = calculated_foods[0]
    alternatives = [cf["text"] for cf in calculated_foods[1:4]] # Top 3 alternatives
    
    alt_text = f"Có thể thay bằng: {', '.join(alternatives)}" if alternatives else "Không có món thay thế"
    
    return primary["id"], primary["text"], alt_text


@router.get("/phase/{phase_id}", response_model=BaseResponse[NutritionPlanRead])
async def get_nutrition_plan(
    phase_id: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    # 1. Fetch Phase and check permissions
    await _get_owned_phase(session, phase_id, current_user)

    stmt = select(NutritionPlan).where(NutritionPlan.phase_id == phase_id)
    from sqlalchemy.orm import selectinload
    stmt = stmt.options(selectinload(NutritionPlan.meals).selectinload(Meal.items))
    existing_plan = (await session.execute(stmt)).scalar_one_or_none()
    
    if not existing_plan:
        raise HTTPException(status_code=404, detail="Chưa có giáo án dinh dưỡng")
        
    from app.services.ai import AIService
    return BaseResponse(data=existing_plan)


@router.post("/phase/{phase_id}/generate", response_model=BaseResponse[NutritionPlanRead])
async def generate_nutrition_plan(
    phase_id: int,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    # 1. Fetch Phase and check permissions
    phase = await _get_owned_phase(session, phase_id, current_user)

    if not all([phase.target_calories, phase.target_protein, phase.target_carbs, phase.target_fat]):
        raise HTTPException(status_code=400, detail="Phase must have target macros set before generating meal plan")

    # 2. Delete existing plan if any
    stmt = select(NutritionPlan).where(NutritionPlan.phase_id == phase_id)
    existing_plan = (await session.execute(stmt)).scalar_one_or_none()
    if existing_plan:
        await session.delete(existing_plan)
        await session.commit()

    # 3. Call shared AI Service (Gemini)
    try:
        from app.services.ai import AIService
        ai_result = AIService.generate_meal_plan(
            target_calories=phase.target_calories,
            target_protein=phase.target_protein,
            target_carbs=phase.target_carbs,
            target_fat=phase.target_fat
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 4. Save to Database
    db_plan = NutritionPlan(
        phase_id=phase_id,
        target_calories=phase.target_calories,
        target_protein=phase.target_protein,
        target_carbs=phase.target_carbs,
        target_fat=phase.target_fat,
        notes=ai_result.get("notes")
    )
    session.add(db_plan)
    await session.flush() # to get db_plan.id

    for i, meal_data in enumerate(ai_result.get("meals", [])):
        db_meal = Meal(
            plan_id=db_plan.id,
            name=meal_data.get("name", f"Meal {i+1}"),
            order=i,
            target_calories=float(str(meal_data.get("target_calories", 0)).replace("kcal", "").strip() or 0),
            target_protein=float(str(meal_data.get("target_protein", 0)).replace("g", "").strip() or 0),
            target_carbs=float(str(meal_data.get("target_carbs", 0)).replace("g", "").strip() or 0),
            target_fat=float(str(meal_data.get("target_fat", 0)).replace("g", "").strip() or 0)
        )
        session.add(db_meal)
        await session.flush()
        
        valid_codes = {"GRAINS", "MEATS", "SEAFOOD", "DAIRY_EGGS", "VEGETABLES", "FATS", "SUPPLEMENTS", "RECIPE"}
        for item_data in meal_data.get("items", []):
            code = item_data.get("food_category_code", "VEGETABLES").upper()
            if code not in valid_codes:
                if "FRUIT" in code: code = "VEGETABLES"
                elif "DAIRY" in code: code = "DAIRY_EGGS"
                else: code = "VEGETABLES"
                
            tp = int(float(str(item_data.get("target_protein", 0)).replace("g", "").strip() or 0))
            tc = int(float(str(item_data.get("target_carbs", 0)).replace("g", "").strip() or 0))
            tf = int(float(str(item_data.get("target_fat", 0)).replace("g", "").strip() or 0))
            t_cal = tp * 4 + tc * 4 + tf * 9
            
            # Use utility function to find foods
            primary_id, primary_text, alt_text = await generate_alternatives_text(session, code, tc, tp, tf)
            
            db_item = MealItem(
                meal_id=db_meal.id,
                food_category_code=code,
                target_protein=tp,
                target_carbs=tc,
                target_fat=tf,
                target_calories=t_cal,
                food_item_id=primary_id,
                primary_food_text=primary_text,
                alternatives_text=alt_text
            )
            session.add(db_item)
            
    await session.commit()
    await session.refresh(db_plan)
    
    # Reload with relationships
    stmt = select(NutritionPlan).where(NutritionPlan.id == db_plan.id)
    from sqlalchemy.orm import selectinload
    stmt = stmt.options(selectinload(NutritionPlan.meals).selectinload(Meal.items))
    final_plan = (await session.execute(stmt)).scalar_one()

    return BaseResponse(data=final_plan)

@router.put("/phase/{phase_id}", response_model=BaseResponse[NutritionPlanRead])
async def save_nutrition_plan(
    phase_id: int,
    plan_in: NutritionPlanCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    # 1. Fetch Phase and check permissions
    phase = await _get_owned_phase(session, phase_id, current_user)

    # 2. Delete existing plan if any
    stmt = select(NutritionPlan).where(NutritionPlan.phase_id == phase_id)
    existing_plan = (await session.execute(stmt)).scalar_one_or_none()
    if existing_plan:
        await session.delete(existing_plan)
        await session.commit()

    # 3. Save new plan to Database
    db_plan = NutritionPlan(
        phase_id=phase_id,
        target_calories=phase.target_calories or 0,
        target_protein=phase.target_protein or 0,
        target_carbs=phase.target_carbs or 0,
        target_fat=phase.target_fat or 0,
        notes=plan_in.notes
    )
    session.add(db_plan)
    await session.flush()

    for meal_data in plan_in.meals:
        db_meal = Meal(
            plan_id=db_plan.id,
            name=meal_data.name,
            order=meal_data.order,
            target_calories=meal_data.target_calories,
            target_protein=meal_data.target_protein,
            target_carbs=meal_data.target_carbs,
            target_fat=meal_data.target_fat
        )
        session.add(db_meal)
        await session.flush()
        
        for item_data in meal_data.items:
            db_item = MealItem(
                meal_id=db_meal.id,
                food_category_code=item_data.food_category_code,
                target_protein=item_data.target_protein,
                target_carbs=item_data.target_carbs,
                target_fat=item_data.target_fat,
                target_calories=item_data.target_calories,
                food_item_id=item_data.food_item_id,
                primary_food_text=item_data.primary_food_text,
                alternatives_text=item_data.alternatives_text
            )
            session.add(db_item)
            
    await session.commit()
    await session.refresh(db_plan)
    
    # Reload with relationships
    stmt = select(NutritionPlan).where(NutritionPlan.id == db_plan.id)
    from sqlalchemy.orm import selectinload
    stmt = stmt.options(selectinload(NutritionPlan.meals).selectinload(Meal.items))
    final_plan = (await session.execute(stmt)).scalar_one()

    return BaseResponse(data=final_plan, message="Lưu giáo án dinh dưỡng thành công")
