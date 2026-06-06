import { useState, useEffect, useMemo } from 'react';
import { Phase } from '@/types/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nutritionService } from '@/services/api/nutritionService';
import { AsyncFoodSelect } from './AsyncFoodSelect';
import { FoodItem, FoodCategory } from '@/types/nutrition';
import { Plus, Trash2, Save, X, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BuilderProps {
  phase: Phase;
  initialPlan?: any;
  onSave: (planPayload: any) => Promise<void>;
  onCancel: () => void;
}

export default function NutritionPlanBuilder({ phase, initialPlan, onSave, onCancel }: BuilderProps) {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [notes, setNotes] = useState(initialPlan?.notes || '');
  const [meals, setMeals] = useState<any[]>(
    initialPlan?.meals || [
      { name: 'Bữa sáng', order: 0, items: [] },
      { name: 'Bữa trưa', order: 1, items: [] },
      { name: 'Bữa tối', order: 2, items: [] },
    ]
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, foodsRes] = await Promise.all([
        nutritionService.getCategories(),
        nutritionService.getFoods({ size: 100 })
      ]);
      setCategories(cats);
      setFoods(foodsRes.data);
    } catch (e) {
      console.error("Failed to load food library", e);
    }
  };

  const handleAddMeal = () => {
    setMeals([...meals, { name: `Bữa ${meals.length + 1}`, order: meals.length, items: [] }]);
  };

  const handleRemoveMeal = (mealIndex: number) => {
    setMeals(meals.filter((_, i) => i !== mealIndex));
  };

  const handleUpdateMealName = (mealIndex: number, name: string) => {
    const newMeals = [...meals];
    newMeals[mealIndex].name = name;
    setMeals(newMeals);
  };

  const handleAddItem = (mealIndex: number) => {
    const newMeals = [...meals];
    newMeals[mealIndex].items.push({
      food_category_code: '',
      food_item_id: null,
      grams: 100,
      target_calories: 0,
      target_protein: 0,
      target_carbs: 0,
      target_fat: 0,
      primary_food_text: '',
      alternatives_text: ''
    });
    setMeals(newMeals);
  };

  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    const newMeals = [...meals];
    newMeals[mealIndex].items.splice(itemIndex, 1);
    setMeals(newMeals);
  };

  const handleUpdateItem = (mealIndex: number, itemIndex: number, field: string, value: any, fullFoodObj?: FoodItem) => {
    const newMeals = [...meals];
    const item = newMeals[mealIndex].items[itemIndex];
    item[field] = value;

    // Trigger recalculation if food_item_id or grams changes
    if (field === 'food_item_id' && fullFoodObj) {
      const ratio = (item.grams || 100) / 100;
      item.food_category_code = fullFoodObj.category_code;
      item.target_protein = Math.round(fullFoodObj.protein * ratio);
      item.target_carbs = Math.round(fullFoodObj.carbs * ratio);
      item.target_fat = Math.round(fullFoodObj.fat * ratio);
      item.target_calories = Math.round(fullFoodObj.calories * ratio);
      item.primary_food_text = `${item.grams}g ${fullFoodObj.name}`;
      item._cached_food = fullFoodObj; // Save for later gram recalculations
    } else if (field === 'grams') {
      // Find food from cache or initial list
      const food = item._cached_food || foods.find(f => f.id === parseInt(item.food_item_id));
      if (food) {
        const ratio = (item.grams || 100) / 100;
        item.target_protein = Math.round(food.protein * ratio);
        item.target_carbs = Math.round(food.carbs * ratio);
        item.target_fat = Math.round(food.fat * ratio);
        item.target_calories = Math.round(food.calories * ratio);
        item.primary_food_text = `${item.grams}g ${food.name}`;
      }
    }

    setMeals(newMeals);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // Calculate totals for each meal
      const payloadMeals = meals.map((m, i) => {
        const target_protein = m.items.reduce((sum: number, it: any) => sum + (it.target_protein || 0), 0);
        const target_carbs = m.items.reduce((sum: number, it: any) => sum + (it.target_carbs || 0), 0);
        const target_fat = m.items.reduce((sum: number, it: any) => sum + (it.target_fat || 0), 0);
        const target_calories = m.items.reduce((sum: number, it: any) => sum + (it.target_calories || 0), 0);

        return {
          ...m,
          order: i,
          target_protein,
          target_carbs,
          target_fat,
          target_calories
        };
      });

      const payload = {
        notes,
        meals: payloadMeals
      };
      
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    let p = 0, c = 0, f = 0, cal = 0;
    meals.forEach(m => {
      m.items.forEach((it: any) => {
        p += it.target_protein || 0;
        c += it.target_carbs || 0;
        f += it.target_fat || 0;
        cal += it.target_calories || 0;
      });
    });
    return { p, c, f, cal };
  }, [meals]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" /> Xây dựng Lịch ăn Thủ công
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> Lưu Lịch Ăn
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Calories</span>
            <div className="flex items-end gap-1">
              <span className={`text-xl font-bold ${totals.cal > (phase.target_calories || 0) * 1.05 ? 'text-red-500' : 'text-slate-800'}`}>{totals.cal}</span>
              <span className="text-sm text-slate-500 mb-0.5">/ {phase.target_calories || '-'} kcal</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Protein</span>
            <div className="flex items-end gap-1">
              <span className="text-xl font-bold text-blue-600">{totals.p}</span>
              <span className="text-sm text-slate-500 mb-0.5">/ {phase.target_protein || '-'} g</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Carbs</span>
            <div className="flex items-end gap-1">
              <span className="text-xl font-bold text-orange-600">{totals.c}</span>
              <span className="text-sm text-slate-500 mb-0.5">/ {phase.target_carbs || '-'} g</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase">Fat</span>
            <div className="flex items-end gap-1">
              <span className="text-xl font-bold text-amber-600">{totals.f}</span>
              <span className="text-sm text-slate-500 mb-0.5">/ {phase.target_fat || '-'} g</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {meals.map((meal, mIdx) => {
          const mCal = meal.items.reduce((s: number, i: any) => s + (i.target_calories || 0), 0);
          const mP = meal.items.reduce((s: number, i: any) => s + (i.target_protein || 0), 0);
          const mC = meal.items.reduce((s: number, i: any) => s + (i.target_carbs || 0), 0);
          const mF = meal.items.reduce((s: number, i: any) => s + (i.target_fat || 0), 0);

          return (
            <div key={mIdx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
                <Input 
                  value={meal.name} 
                  onChange={(e) => handleUpdateMealName(mIdx, e.target.value)}
                  className="font-bold text-lg w-48 border-none bg-transparent shadow-none px-2 focus-visible:ring-1"
                />
                <div className="flex items-center gap-4">
                  <div className="text-xs font-semibold text-slate-500">
                    {mCal} kcal ({mP}P / {mC}C / {mF}F)
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveMeal(mIdx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {meal.items.map((item: any, iIdx: number) => (
                  <div key={iIdx} className="flex items-start gap-4 p-3 bg-slate-50/50 border rounded-lg">
                    <div className="flex-1 grid grid-cols-12 gap-3">
                      <div className="col-span-5">
                        <Label className="text-xs text-slate-500 mb-1 block">Thực phẩm</Label>
                        <AsyncFoodSelect 
                          value={item.food_item_id?.toString() || null} 
                          onChange={(food: FoodItem) => handleUpdateItem(mIdx, iIdx, 'food_item_id', food.id.toString(), food)}
                          foods={foods}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-slate-500 mb-1 block">Số lượng (Gram)</Label>
                        <Input 
                          type="number" 
                          value={item.grams || ''} 
                          onChange={(e) => handleUpdateItem(mIdx, iIdx, 'grams', parseFloat(e.target.value) || 0)}
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-5 flex items-center gap-4 pt-6">
                        <div className="flex gap-3 text-sm">
                          <div className="flex flex-col"><span className="text-xs text-slate-400">Calo</span><span className="font-bold text-slate-700">{item.target_calories || 0}</span></div>
                          <div className="flex flex-col"><span className="text-xs text-slate-400">Pro</span><span className="font-bold text-blue-600">{item.target_protein || 0}</span></div>
                          <div className="flex flex-col"><span className="text-xs text-slate-400">Carb</span><span className="font-bold text-orange-600">{item.target_carbs || 0}</span></div>
                          <div className="flex flex-col"><span className="text-xs text-slate-400">Fat</span><span className="font-bold text-amber-600">{item.target_fat || 0}</span></div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(mIdx, iIdx)} className="text-slate-400 hover:text-red-500 mt-5">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={() => handleAddItem(mIdx)} className="border-dashed w-full text-slate-500">
                  <Plus className="w-4 h-4 mr-2" /> Thêm nguyên liệu
                </Button>
              </div>
            </div>
          );
        })}

        <Button variant="outline" onClick={handleAddMeal} className="w-full border-dashed py-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
          <Plus className="w-5 h-5 mr-2" /> Thêm Bữa ăn mới
        </Button>

        <div className="pt-4">
          <Label className="text-slate-600 font-bold">Ghi chú / Lời khuyên</Label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-2 p-3 border rounded-xl min-h-[100px] text-sm bg-slate-50 focus:bg-white"
            placeholder="Nhập ghi chú hoặc lời khuyên cho học viên..."
          />
        </div>
      </div>
    </div>
  );
}
