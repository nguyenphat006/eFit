import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nutritionService } from '@/services/api/nutritionService';
import { FoodItem } from '@/types/nutrition';
import { Loader2, Search, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AsyncFoodSelectProps {
  value: string | null;
  onChange: (food: FoodItem) => void;
  foods: FoodItem[]; // Pass initial fetched foods so we have the selected one's name initially
}

export function AsyncFoodSelect({ value, onChange, foods: initialFoods }: AsyncFoodSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<FoodItem[]>(initialFoods.slice(0, 50));
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When value changes from outside, find the selected food to display its name
  useEffect(() => {
    if (!value) {
      setSelectedFood(null);
      return;
    }
    // Check in current options or initialFoods
    let food = options.find(f => f.id.toString() === value) || initialFoods.find(f => f.id.toString() === value);
    if (food) {
      setSelectedFood(food);
    } else {
      // If not found (rare, but could happen if it's a very obscure item not in initial 100), 
      // we could fetch it individually, but for now we'll just try to fetch it.
      nutritionService.getFoodById(parseInt(value)).then(f => setSelectedFood(f)).catch(e => console.error(e));
    }
  }, [value, initialFoods, options]);

  // Debounce search
  useEffect(() => {
    if (!open) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await nutritionService.getFoods({ q: query, size: 20 });
        setOptions(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, open]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setOptions(initialFoods.slice(0, 50));
    }
  }, [open, initialFoods]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white text-left font-normal"
        >
          <span className="truncate">
            {selectedFood ? `${selectedFood.name} (${selectedFood.calories}kcal/100g)` : "Chọn thực phẩm..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[350px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input 
            placeholder="Tìm món ăn trên máy chủ..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />}
        </div>
        <div className="max-h-64 overflow-y-auto">
          <div className="p-1">
            {options.length === 0 && !loading && (
              <div className="py-6 text-center text-sm text-slate-500">
                Không tìm thấy món nào.
              </div>
            )}
            {options.map((food) => (
              <div
                key={food.id}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900",
                  value === food.id.toString() && "bg-slate-100 font-medium text-slate-900"
                )}
                onClick={() => {
                  onChange(food);
                  setOpen(false);
                }}
              >
                <div className="flex flex-col flex-1 truncate mr-2">
                  <span>{food.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {food.protein}P • {food.carbs}C • {food.fat}F
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {food.calories}kcal
                </div>
                <Check
                  className={cn(
                    "ml-2 h-4 w-4",
                    value === food.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
