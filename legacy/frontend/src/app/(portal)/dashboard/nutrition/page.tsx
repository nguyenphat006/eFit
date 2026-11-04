'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { nutritionService } from '@/services/api/nutritionService';
import { FoodCategory, FoodItem, PaginatedResponse } from '@/types/nutrition';
import { Input } from '@/components/ui/input';
import {
  Search, Flame, Image as ImageIcon, MoreHorizontal, Edit, Trash, Plus,
  Apple, Layers, Utensils, Beef, LayoutGrid, List as ListIcon,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FoodFormSheet } from './components/FoodFormSheet';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ColumnDef } from '@tanstack/react-table';
import { HeroHeader } from '@/components/shared/hero-header';
import { KpiTile } from '@/components/shared/kpi-tile';
import { StatusPill } from '@/components/shared/status-pill';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function NutritionLibraryPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [foodsData, setFoodsData] = useState<PaginatedResponse<FoodItem> | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  const [foodToDelete, setFoodToDelete] = useState<FoodItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    nutritionService.getCategories().then(setCategories).catch(console.error);
  }, []);

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedSearch, selectedCategory, currentPage]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const handleDeleteConfirm = async () => {
    if (!foodToDelete) return;
    setIsDeleting(true);
    try {
      await nutritionService.deleteFood(foodToDelete.id);
      setFoodToDelete(null);
      fetchFoods();
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  // Mini macro pill
  const MacroPill = ({ value, color, unit = 'g' }: { value: number; color: string; unit?: string }) => (
    <span
      className="inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded-md text-xs font-bold border tabular-nums"
      style={{
        background: `${color}1A`,
        borderColor: `${color}33`,
        color,
      }}
    >
      {value}{unit}
    </span>
  );

  const columns = useMemo<ColumnDef<FoodItem>[]>(() => [
    {
      id: 'image',
      header: () => <div className="text-center">Ảnh</div>,
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-xl bg-input/40 border overflow-hidden flex items-center justify-center mx-auto shrink-0">
          {row.original.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.image_url} alt={row.original.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Món ăn',
      cell: ({ row }) => (
        <div>
          <div className="font-extrabold text-foreground line-clamp-1">{row.original.name}</div>
          <StatusPill tone="blue" size="xs" className="mt-1">
            {row.original.category?.name || row.original.category_code}
          </StatusPill>
        </div>
      ),
    },
    {
      accessorKey: 'base_unit',
      header: 'Khẩu phần',
      cell: ({ row }) => (
        <div>
          <div className="text-xs font-bold text-foreground">{row.original.base_unit}</div>
          {row.original.default_serving_name && (
            <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              ≈ {row.original.default_serving_name}
              {row.original.default_serving_weight ? ` (${row.original.default_serving_weight}g)` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'calories',
      header: () => (
        <div className="text-right whitespace-nowrap inline-flex items-center justify-end w-full gap-1">
          <Flame className="w-3.5 h-3.5 text-[#EF9035]" /> Calo
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-extrabold text-foreground tabular-nums">
          {row.original.calories}
        </div>
      ),
    },
    {
      accessorKey: 'protein',
      header: () => <div className="text-right">Protein</div>,
      cell: ({ row }) => <div className="text-right"><MacroPill value={row.original.protein} color="#54B7F0" /></div>,
    },
    {
      accessorKey: 'carbs',
      header: () => <div className="text-right">Carbs</div>,
      cell: ({ row }) => <div className="text-right"><MacroPill value={row.original.carbs} color="#EF9035" /></div>,
    },
    {
      accessorKey: 'fat',
      header: () => <div className="text-right">Fat</div>,
      cell: ({ row }) => <div className="text-right"><MacroPill value={row.original.fat} color="#a78bfa" /></div>,
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="text-right pr-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-input text-muted-foreground hover:text-foreground focus:outline-none">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={() => { setEditingFood(row.original); setIsFormOpen(true); }} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2 text-muted-foreground" /> Sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setFoodToDelete(row.original)}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash className="w-4 h-4 mr-2" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  // ─── Stats from current page ───
  const stats = useMemo(() => {
    const total = foodsData?.total ?? 0;
    const items = foodsData?.data ?? [];
    const avgCal = items.length
      ? Math.round(items.reduce((s, f) => s + f.calories, 0) / items.length)
      : 0;
    const avgProtein = items.length
      ? Math.round(items.reduce((s, f) => s + f.protein, 0) / items.length)
      : 0;
    return { total, categories: categories.length, avgCal, avgProtein };
  }, [foodsData, categories]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {stats.total === 0 ? (
        <HeroHeader
          eyebrow="Dinh dưỡng · Library"
          title="Thư viện"
          titleAccent="dinh dưỡng."
          subtitle="Tra cứu calo, macro của hàng nghìn loại thực phẩm và món ăn Việt. Dữ liệu chuẩn hoá theo USDA và bảng dinh dưỡng Việt Nam."
          action={
            <Button
              onClick={() => { setEditingFood(null); setIsFormOpen(true); }}
              className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm món ăn
            </Button>
          }
          meta={
            <>
              <span>{stats.total} món</span>
              <span>{stats.categories} danh mục</span>
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-between border-b pb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Thư viện dinh dưỡng
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {stats.total} món ăn & thực phẩm · {stats.categories} danh mục phân loại
            </p>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Tổng món ăn" value={stats.total} icon={Apple} tone="green" loading={loading} />
        <KpiTile label="Danh mục" value={stats.categories} icon={Layers} tone="blue" loading={loading} />
        <KpiTile label="Calo TB / 100g" value={stats.avgCal} unit="kcal" icon={Flame} tone="orange" loading={loading} />
        <KpiTile label="Protein TB" value={stats.avgProtein} unit="g" icon={Beef} tone="purple" loading={loading} />
      </div>

      {/* Filter bar with view toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card p-3 rounded-xl shadow-card-light border">
        <div className="relative w-full md:max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm món ăn (VD: phở bò, ức gà...)"
            className="pl-9 bg-input/40 border-border focus-visible:ring-[#54B7F0]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px] shrink-0">
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
            <SelectTrigger className="bg-input/40 border-border focus:ring-[#54B7F0]">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {stats.total > 0 && (
          <Button
            onClick={() => { setEditingFood(null); setIsFormOpen(true); }}
            className="btn-gradient-orange text-white font-extrabold tracking-wide shrink-0 h-10 px-5"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm món ăn
          </Button>
        )}

        {/* View toggle pushed to the right */}
        <div className="md:ml-auto flex items-center gap-1 bg-input/30 rounded-lg p-1 border border-border">
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all',
              view === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Hiển thị danh sách (table)"
          >
            <ListIcon className="w-3.5 h-3.5" /> Danh sách
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={cn(
              'flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all',
              view === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Hiển thị thẻ (card grid)"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Thẻ
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <DataTable
          columns={columns}
          data={foodsData?.data || []}
          isLoading={loading}
          pagination={
            foodsData ? { page: currentPage, size: pageSize, total: foodsData.total } : undefined
          }
          onPageChange={setCurrentPage}
        />
      ) : (
        <FoodGridView
          foods={foodsData?.data || []}
          loading={loading}
          onEdit={(food) => { setEditingFood(food); setIsFormOpen(true); }}
          onDelete={(food) => setFoodToDelete(food)}
          pagination={foodsData ? { page: currentPage, size: pageSize, total: foodsData.total } : undefined}
          onPageChange={setCurrentPage}
        />
      )}

      <FoodFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        categories={categories}
        initialData={editingFood}
        onSuccess={fetchFoods}
      />

      <ConfirmDialog
        isOpen={!!foodToDelete}
        onClose={() => setFoodToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Xóa món ăn?"
        itemName={foodToDelete?.name}
      />
    </div>
  );
}

// ─── Grid (card) view for foods ─────────────────────────────────────────────
function FoodGridView({
  foods, loading, onEdit, onDelete, pagination, onPageChange,
}: {
  foods: FoodItem[];
  loading: boolean;
  onEdit: (food: FoodItem) => void;
  onDelete: (food: FoodItem) => void;
  pagination?: { page: number; size: number; total: number };
  onPageChange: (page: number) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border h-56 animate-pulse" />
        ))}
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-dashed py-16 text-center">
        <div className="inline-flex w-12 h-12 rounded-full bg-input items-center justify-center mb-3">
          <Apple className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="font-extrabold text-lg text-foreground">Không tìm thấy món ăn</p>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          Thay đổi bộ lọc hoặc thử từ khóa khác.
        </p>
      </div>
    );
  }

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.size)) : 1;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {foods.map((food) => (
          <FoodCard key={food.id} food={food} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 px-2">
          <p className="text-xs font-bold text-muted-foreground">
            Trang {pagination.page} / {totalPages} · {pagination.total} món
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function FoodCard({
  food, onEdit, onDelete,
}: {
  food: FoodItem;
  onEdit: (food: FoodItem) => void;
  onDelete: (food: FoodItem) => void;
}) {
  const macros = [
    { label: 'P', value: food.protein, color: '#54B7F0' },
    { label: 'C', value: food.carbs, color: '#EF9035' },
    { label: 'F', value: food.fat, color: '#a78bfa' },
  ];
  const totalMacro = food.protein + food.carbs + food.fat || 1;

  return (
    <div className="bg-card rounded-2xl border shadow-card-light hover:shadow-card-hover transition-all overflow-hidden flex flex-col">
      {/* Image / placeholder */}
      <div className="aspect-[16/10] bg-gradient-to-br from-input/40 to-input/10 relative">
        {food.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={food.image_url} alt={food.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.5} />
          </div>
        )}
        {/* Category pill top-left */}
        <div className="absolute top-2 left-2">
          <StatusPill tone="blue" size="xs">
            {food.category?.name ?? food.category_code}
          </StatusPill>
        </div>
        {/* Action menu top-right */}
        <div className="absolute top-1.5 right-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md bg-card/80 backdrop-blur text-muted-foreground hover:text-foreground hover:bg-card focus:outline-none border">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(food)} className="cursor-pointer">
                <Edit className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(food)}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash className="w-3.5 h-3.5 mr-2" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name */}
        <div>
          <h4 className="font-extrabold tracking-tight text-sm leading-snug line-clamp-2 text-foreground">
            {food.name}
          </h4>
          {food.default_serving_name && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              {food.base_unit} · {food.default_serving_name}
              {food.default_serving_weight ? ` (${food.default_serving_weight}g)` : ''}
            </p>
          )}
        </div>

        {/* Calories row */}
        <div className="flex items-baseline justify-between border-t pt-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#EF9035]" /> Calo
          </span>
          <span className="font-extrabold text-lg tabular-nums">
            {food.calories}<span className="text-[10px] font-bold text-muted-foreground ml-0.5">kcal</span>
          </span>
        </div>

        {/* Macro stacked bar — visual macro split */}
        <div className="space-y-1.5">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-input">
            {macros.map((m) => (
              <div
                key={m.label}
                style={{ width: `${(m.value / totalMacro) * 100}%`, background: m.color }}
                title={`${m.label}: ${m.value}g`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {macros.map((m) => (
              <div key={m.label} className="flex items-baseline gap-1">
                <span
                  className="w-4 h-4 rounded grid place-items-center text-[9px] font-extrabold text-white"
                  style={{ background: m.color }}
                >
                  {m.label}
                </span>
                <span className="text-xs font-extrabold tabular-nums">{m.value}<span className="text-[9px] font-bold text-muted-foreground">g</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
