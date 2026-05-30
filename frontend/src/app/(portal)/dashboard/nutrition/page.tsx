'use client';

import { useEffect, useState, useCallback } from 'react';
import { nutritionService } from '@/services/api/nutritionService';
import { FoodCategory, FoodItem, PaginatedResponse } from '@/types/nutrition';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Apple, Flame } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NutritionLibraryPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [foodsData, setFoodsData] = useState<PaginatedResponse<FoodItem> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await nutritionService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Foods
  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await nutritionService.getFoods({
        q: debouncedSearch || undefined,
        category_code: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        page: 1,
        size: 50,
      });
      setFoodsData(data);
    } catch (error) {
      console.error('Failed to fetch foods:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
          Thư viện Dinh dưỡng
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Tra cứu thông tin hàng ngàn loại thực phẩm, từ nguyên liệu thô đến các món ăn chế biến sẵn với thông số Calories và Macros chuẩn xác nhất.
        </p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm món ăn (VD: Phở bò, Ức gà...)" 
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#54B7F0]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="h-10 bg-slate-50/80 p-1">
              <TabsTrigger value="ALL" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#54B7F0] data-[state=active]:shadow-sm">
                Tất cả
              </TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.code} 
                  value={cat.code}
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#54B7F0] data-[state=active]:shadow-sm whitespace-nowrap"
                >
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#54B7F0]" />
        </div>
      ) : foodsData?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl border border-slate-100 border-dashed">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Apple className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium text-lg">Không tìm thấy thực phẩm nào</p>
          <p className="text-sm text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {foodsData?.data.map((food) => (
            <Card key={food.id} className="group hover:shadow-md hover:border-[#54B7F0]/30 transition-all duration-300 overflow-hidden bg-white">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 text-xs font-normal text-slate-500 border-slate-200">
                      {food.category?.name || food.category_code}
                    </Badge>
                    <CardTitle className="text-lg leading-tight group-hover:text-[#54B7F0] transition-colors line-clamp-2">
                      {food.name}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="font-semibold text-slate-700">{food.calories} Kcal</span>
                      <span className="text-slate-400">/ {food.base_unit}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-5 pt-2">
                {/* Macro Progress Bar visual */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100">
                    P: {food.protein}g
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100">
                    C: {food.carbs}g
                  </Badge>
                  <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100">
                    F: {food.fat}g
                  </Badge>
                </div>
                
                {food.default_serving_name && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Thường dùng:</span>
                    <span className="font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-md">
                      {food.default_serving_name} {food.default_serving_weight ? `(${food.default_serving_weight}g)` : ''}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination Footer */}
      {foodsData && foodsData.total > foodsData.size && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4">
          <p className="text-sm text-slate-500">
            Hiển thị <span className="font-medium">{foodsData.data.length}</span> / <span className="font-medium">{foodsData.total}</span> kết quả
          </p>
        </div>
      )}
    </div>
  );
}
