import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import AsyncSession

# Add the root directory to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.models.nutrition import FoodCategory, FoodItem

CATEGORIES = [
    {"code": "GRAINS", "name": "Lương thực & Tinh bột", "description": "Cơm, bún, phở, mì, bánh mì, yến mạch..."},
    {"code": "MEATS", "name": "Thịt & Gia cầm", "description": "Thịt bò, lợn, gà, vịt..."},
    {"code": "SEAFOOD", "name": "Thủy hải sản", "description": "Cá, tôm, cua, mực..."},
    {"code": "DAIRY_EGGS", "name": "Trứng & Sữa", "description": "Sữa bò, phô mai, sữa chua, trứng các loại"},
    {"code": "VEGETABLES", "name": "Rau củ quả", "description": "Rau xanh, trái cây, nấm..."},
    {"code": "FATS", "name": "Dầu mỡ & Hạt", "description": "Dầu ăn, mỡ, bơ đậu phộng, các loại hạt khô"},
    {"code": "SUPPLEMENTS", "name": "Thực phẩm bổ sung", "description": "Whey Protein, Mass, BCAA, Creatine..."},
    {"code": "RECIPE", "name": "Món ăn hoàn chỉnh", "description": "Các món ăn đã chế biến sẵn (1 tô phở, 1 đĩa cơm tấm...)"}
]

FOODS = [
    # GRAINS
    {"name": "Cơm trắng", "category_code": "GRAINS", "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3, "fiber": 0.4, "default_serving_name": "1 chén", "default_serving_weight": 130},
    {"name": "Bún tươi", "category_code": "GRAINS", "calories": 110, "protein": 1.7, "carbs": 25, "fat": 0.1, "fiber": 0.5, "default_serving_name": "1 chén", "default_serving_weight": 150},
    {"name": "Yến mạch (Rolled Oats)", "category_code": "GRAINS", "calories": 389, "protein": 16.9, "carbs": 66.3, "fat": 6.9, "fiber": 10.6, "default_serving_name": "1 khẩu phần", "default_serving_weight": 40},
    
    # MEATS
    {"name": "Ức gà (sống, không da)", "category_code": "MEATS", "calories": 110, "protein": 23, "carbs": 0, "fat": 1.2, "fiber": 0, "default_serving_name": "1 lạng", "default_serving_weight": 100},
    {"name": "Thịt bò thăn (sống)", "category_code": "MEATS", "calories": 143, "protein": 22, "carbs": 0, "fat": 5.5, "fiber": 0, "default_serving_name": "1 lạng", "default_serving_weight": 100},
    {"name": "Thịt heo nạc (sống)", "category_code": "MEATS", "calories": 143, "protein": 21, "carbs": 0, "fat": 6, "fiber": 0, "default_serving_name": "1 lạng", "default_serving_weight": 100},

    # DAIRY_EGGS
    {"name": "Trứng gà (toàn quả)", "category_code": "DAIRY_EGGS", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "fiber": 0, "default_serving_name": "1 quả vừa", "default_serving_weight": 50},
    {"name": "Sữa tươi không đường", "category_code": "DAIRY_EGGS", "calories": 62, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0, "base_unit": "100ml", "default_serving_name": "1 hộp", "default_serving_weight": 180},
    
    # SUPPLEMENTS
    {"name": "Whey Protein Concentrate 80%", "category_code": "SUPPLEMENTS", "calories": 380, "protein": 80, "carbs": 5, "fat": 4, "fiber": 0, "default_serving_name": "1 muỗng (scoop)", "default_serving_weight": 30},
    
    # VEGETABLES
    {"name": "Súp lơ xanh (Broccoli)", "category_code": "VEGETABLES", "calories": 34, "protein": 2.8, "carbs": 6.6, "fat": 0.4, "fiber": 2.6, "default_serving_name": "1 bông vừa", "default_serving_weight": 150},
    
    # FATS
    {"name": "Bơ đậu phộng (Không đường)", "category_code": "FATS", "calories": 588, "protein": 25, "carbs": 20, "fat": 50, "fiber": 6, "default_serving_name": "1 muỗng canh", "default_serving_weight": 15},

    # RECIPES (Món ăn chế biến sẵn, tính theo tổng phần ăn, vẫn lưu dưới dạng chuẩn 100g hoặc lưu nguyên lượng rồi chia ra)
    # Lưu ý: Vì base_unit quy chuẩn là 100g, nên nếu tô phở 450 Kcal/500g, thì 100g = 90 Kcal.
    # Nhưng đối với RECIPE, đôi khi để base_unit là "1 tô" sẽ dễ hơn. Ở đây ta đã linh hoạt cột `base_unit`.
    {"name": "Phở bò (Tô vừa)", "category_code": "RECIPE", "calories": 450, "protein": 25, "carbs": 60, "fat": 12, "fiber": 2, "base_unit": "1 tô", "default_serving_name": "1 tô", "default_serving_weight": 1},
    {"name": "Cơm tấm sườn bì chả", "category_code": "RECIPE", "calories": 750, "protein": 35, "carbs": 80, "fat": 30, "fiber": 3, "base_unit": "1 đĩa", "default_serving_name": "1 đĩa", "default_serving_weight": 1},
]

async def seed_nutrition():
    print("Seeding Nutrition Master Data...")
    async with AsyncSession(engine) as session:
        # Seed Categories
        for cat_data in CATEGORIES:
            cat = await session.get(FoodCategory, cat_data["code"])
            if not cat:
                new_cat = FoodCategory(**cat_data)
                session.add(new_cat)
                print(f"Added Category: {cat_data['name']}")
        
        await session.commit()
        
        # Seed Foods
        from sqlmodel import select
        for food_data in FOODS:
            stmt = select(FoodItem).where(FoodItem.name == food_data["name"])
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                new_food = FoodItem(**food_data, is_system_data=True)
                session.add(new_food)
                print(f"Added Food: {food_data['name']}")
                
        await session.commit()
    print("Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed_nutrition())
