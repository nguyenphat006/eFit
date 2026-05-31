'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { nutritionService } from '@/services/api/nutritionService';
import { FoodCategory, FoodItem, PaginatedResponse } from '@/types/nutrition';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Apple, Flame, Image as ImageIcon, MoreHorizontal, Edit, Trash, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FoodFormSheet } from './components/FoodFormSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/shared/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

export default function NutritionLibraryPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [foodsData, setFoodsData] = useState<PaginatedResponse<FoodItem> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  
  // Delete State
  const [foodToDelete, setFoodToDelete] = useState<FoodItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle category change
  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

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
        page: currentPage,
        size: pageSize,
      });
      setFoodsData(data);
    } catch (error) {
      console.error('Failed to fetch foods:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, currentPage]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  // Handlers
  const handleCreate = () => {
    setEditingFood(null);
    setIsFormOpen(true);
  };

  const handleEdit = (food: FoodItem) => {
    setEditingFood(food);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!foodToDelete) return;
    setIsDeleting(true);
    try {
      await nutritionService.deleteFood(foodToDelete.id);
      setFoodToDelete(null);
      fetchFoods();
    } catch (error) {
      console.error('Failed to delete food:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Define Columns
  const columns = useMemo<ColumnDef<FoodItem>[]>(() => [
    {
      id: "image",
      header: () => <div className="text-center">Hình ảnh</div>,
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center mx-auto shrink-0">
          {row.original.image_url ? (
            <img src={row.original.image_url} alt={row.original.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-400 opacity-50" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Món ăn",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800 line-clamp-1">{row.original.name}</div>
          <Badge variant="outline" className="mt-1 text-[10px] uppercase font-semibold tracking-wider text-slate-500 bg-slate-50">
            {row.original.category?.name || row.original.category_code}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "base_unit",
      header: "Khẩu phần",
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium text-slate-700">{row.original.base_unit}</div>
          {row.original.default_serving_name && (
            <div className="text-xs text-slate-400 mt-0.5">
              Gợi ý: {row.original.default_serving_name}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "calories",
      header: () => (
        <div className="text-right whitespace-nowrap">
          <Flame className="w-4 h-4 inline-block mr-1 text-orange-400 mb-0.5" />
          Calories
        </div>
      ),
      cell: ({ row }) => <div className="text-right font-bold text-slate-700">{row.original.calories}</div>,
    },
    {
      accessorKey: "protein",
      header: () => <div className="text-right">Protein</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100">
            {row.original.protein}g
          </span>
        </div>
      ),
    },
    {
      accessorKey: "carbs",
      header: () => <div className="text-right">Carbs</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-sm font-medium border border-amber-100">
            {row.original.carbs}g
          </span>
        </div>
      ),
    },
    {
      accessorKey: "fat",
      header: () => <div className="text-right">Fat</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-sm font-medium border border-rose-100">
            {row.original.fat}g
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <div className="text-right pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={() => handleEdit(row.original)} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2 text-slate-500" /> Sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFoodToDelete(row.original)} 
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
              >
                <Trash className="w-4 h-4 mr-2" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [handleEdit]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
            Thư viện Dinh dưỡng
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Tra cứu thông tin hàng ngàn loại thực phẩm, từ nguyên liệu thô đến các món ăn chế biến sẵn với thông số Calories và Macros chuẩn xác nhất.
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-[#54B7F0] hover:bg-[#3FA3DC] text-white shadow-sm shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Thêm Món ăn
        </Button>
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
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
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

      {/* Custom Data Table */}
      <DataTable 
        columns={columns} 
        data={foodsData?.data || []} 
        isLoading={loading}
        pagination={foodsData ? {
          page: currentPage,
          size: pageSize,
          total: foodsData.total
        } : undefined}
        onPageChange={setCurrentPage}
      />

      {/* Add/Edit Form Sheet */}
      <FoodFormSheet 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        categories={categories}
        initialData={editingFood}
        onSuccess={fetchFoods}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!foodToDelete} onOpenChange={(open) => !open && setFoodToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa món ăn?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <b>{foodToDelete?.name}</b> khỏi hệ thống không? Dữ liệu đã xóa sẽ không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa món ăn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
