"""
seed_nutrition — dữ liệu gốc thư viện dinh dưỡng (8 nhóm + thực phẩm phổ biến), giữ mã nhóm của bản cũ.

    python manage.py seed_nutrition

Idempotent: nhóm khóa theo category_code, thực phẩm khóa theo tên — chỉ tạo khi chưa có,
không ghi đè dữ liệu đã chỉnh trên giao diện. Macro tính trên base_unit (mặc định 100g).
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.nutrition.models import FoodCategory, FoodItem

CATEGORIES = [
    ("GRAINS", "Lương thực & Tinh bột", "Cơm, bún, phở, mì, bánh mì, yến mạch..."),
    ("MEATS", "Thịt & Gia cầm", "Thịt bò, lợn, gà, vịt..."),
    ("SEAFOOD", "Thủy hải sản", "Cá, tôm, cua, mực..."),
    ("DAIRY_EGGS", "Trứng & Sữa", "Sữa bò, phô mai, sữa chua, trứng các loại"),
    ("VEGETABLES", "Rau củ quả", "Rau xanh, trái cây, nấm..."),
    ("FATS", "Dầu mỡ & Hạt", "Dầu ăn, mỡ, bơ đậu phộng, các loại hạt khô"),
    ("SUPPLEMENTS", "Thực phẩm bổ sung", "Whey Protein, Mass, BCAA, Creatine..."),
    ("RECIPE", "Món ăn hoàn chỉnh", "Các món ăn đã chế biến sẵn (1 tô phở, 1 đĩa cơm tấm...)"),
]

FOODS = [
    {"name": "Cơm trắng", "category": "GRAINS", "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3, "fiber": 0.4, "default_serving_name": "1 chén", "default_serving_weight": 130},
    {"name": "Bún tươi", "category": "GRAINS", "calories": 110, "protein": 1.7, "carbs": 25, "fat": 0.1, "fiber": 0.5, "default_serving_name": "1 chén", "default_serving_weight": 150},
    {"name": "Yến mạch (Rolled Oats)", "category": "GRAINS", "calories": 389, "protein": 16.9, "carbs": 66.3, "fat": 6.9, "fiber": 10.6, "default_serving_name": "1 khẩu phần", "default_serving_weight": 40},
    {"name": "Ức gà (sống, không da)", "category": "MEATS", "calories": 110, "protein": 23, "carbs": 0, "fat": 1.2, "fiber": 0, "default_serving_name": "1 lạng", "default_serving_weight": 100},
    {"name": "Thịt bò thăn (sống)", "category": "MEATS", "calories": 143, "protein": 22, "carbs": 0, "fat": 5.5, "fiber": 0, "default_serving_name": "1 lạng", "default_serving_weight": 100},
    {"name": "Thịt heo nạc (sống)", "category": "MEATS", "calories": 143, "protein": 21, "carbs": 0, "fat": 6, "fiber": 0, "default_serving_name": "1 lạng", "default_serving_weight": 100},
    {"name": "Trứng gà (toàn quả)", "category": "DAIRY_EGGS", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "fiber": 0, "default_serving_name": "1 quả vừa", "default_serving_weight": 50},
    {"name": "Sữa tươi không đường", "category": "DAIRY_EGGS", "calories": 62, "protein": 3.2, "carbs": 4.8, "fat": 3.3, "fiber": 0, "base_unit": "100ml", "default_serving_name": "1 hộp", "default_serving_weight": 180},
    {"name": "Whey Protein Concentrate 80%", "category": "SUPPLEMENTS", "calories": 380, "protein": 80, "carbs": 5, "fat": 4, "fiber": 0, "default_serving_name": "1 muỗng (scoop)", "default_serving_weight": 30},
    {"name": "Súp lơ xanh (Broccoli)", "category": "VEGETABLES", "calories": 34, "protein": 2.8, "carbs": 6.6, "fat": 0.4, "fiber": 2.6, "default_serving_name": "1 bông vừa", "default_serving_weight": 150},
    {"name": "Bơ đậu phộng (Không đường)", "category": "FATS", "calories": 588, "protein": 25, "carbs": 20, "fat": 50, "fiber": 6, "default_serving_name": "1 muỗng canh", "default_serving_weight": 15},
    # Món hoàn chỉnh: base_unit là 1 phần ăn thay vì 100g
    {"name": "Phở bò (Tô vừa)", "category": "RECIPE", "calories": 450, "protein": 25, "carbs": 60, "fat": 12, "fiber": 2, "base_unit": "1 tô", "default_serving_name": "1 tô", "default_serving_weight": 1},
    {"name": "Cơm tấm sườn bì chả", "category": "RECIPE", "calories": 750, "protein": 35, "carbs": 80, "fat": 30, "fiber": 3, "base_unit": "1 đĩa", "default_serving_name": "1 đĩa", "default_serving_weight": 1},
]


class Command(BaseCommand):
    help = "Seed nhom thuc pham + thuc pham pho bien (idempotent)"

    @transaction.atomic
    def handle(self, *args, **opts):
        categories = {}
        new_categories = 0
        for order, (code, name, desc) in enumerate(CATEGORIES, start=1):
            cat = FoodCategory.all_objects.filter(category_code=code).first()
            if cat is None:
                cat = FoodCategory.objects.create(category_code=code, category_name=name, description=desc, sort_order=order)
                new_categories += 1
            categories[code] = cat

        new_foods = 0
        for data in FOODS:
            data = dict(data)
            category = categories[data.pop('category')]
            if FoodItem.all_objects.filter(name=data['name']).exists():
                continue
            FoodItem.objects.create(category=category, is_system_data=True, **data)
            new_foods += 1
        self.stdout.write(self.style.SUCCESS(f'seed_nutrition: +{new_categories} nhom, +{new_foods} thuc pham.'))
