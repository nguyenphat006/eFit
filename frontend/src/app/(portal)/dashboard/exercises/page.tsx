'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HeroHeader } from '@/components/shared/hero-header';
import { exerciseService } from '@/services/api/exerciseService';
import { Exercise } from '@/types/exercise';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, Trash2, LayoutGrid, List as ListIcon, Eye, Filter } from 'lucide-react';
import ExerciseFormSheet from './components/ExerciseFormSheet';
import ExerciseDetailDialog from './components/ExerciseDetailDialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const CATEGORIES = ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];
const EQUIPMENTS = ['assisted', 'band', 'barbell', 'body weight', 'cable', 'dumbbell', 'elliptical machine', 'ez barbell', 'hammer', 'kettlebell', 'leverage machine', 'medicine ball', 'olympic barbell', 'resistance band', 'roller', 'rope', 'skierg machine', 'sled machine', 'smith machine', 'stability ball', 'stationary bike', 'stepmill machine', 'tire', 'trap bar', 'upper body ergometer', 'weight', 'wheel roller'];
const TARGETS = ['abductors', 'abs', 'adductors', 'biceps', 'calves', 'cardiovascular system', 'delts', 'forearms', 'glutes', 'hamstrings', 'lats', 'levator scapulae', 'pectorals', 'quads', 'serratus anterior', 'spine', 'traps', 'triceps', 'upper back'];

// Helper component for MultiSelect
function FilterDropdown({ title, options, selected, onChange }: { title: string, options: string[], selected: string[], onChange: (val: string[]) => void }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto min-w-[140px] justify-between text-muted-foreground font-normal">
          {selected.length === 0 ? title : `${title} (${selected.length})`}
          <Filter className="w-4 h-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
        {options.map(opt => (
          <DropdownMenuCheckboxItem key={opt} checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} className="capitalize">
            {opt}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Infinite Scroll & Search
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [target, setTarget] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Forms & Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<number | null>(null);
  
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastExerciseElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && exercises.length < total) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, exercises.length, total]);

  useEffect(() => {
    let isSubscribed = true;
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const skip = (page - 1) * pageSize;
        const res = await exerciseService.getExercises(skip, pageSize, search, category, equipment, target);
        if (isSubscribed) {
          if (page === 1) {
            setExercises(res.items || []);
          } else {
            setExercises(prev => {
              const newItems = res.items || [];
              // filter out duplicates just in case
              const existingIds = new Set(prev.map(e => e.id));
              const uniqueNewItems = newItems.filter(e => !existingIds.has(e.id));
              return [...prev, ...uniqueNewItems];
            });
          }
          setTotal(res.total || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };
    fetchExercises();
    return () => { isSubscribed = false; };
  }, [page, search, category, equipment, target, pageSize]);

  // Reset page on filters change
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleCategory = (val: string[]) => { setCategory(val); setPage(1); };
  const handleEquipment = (val: string[]) => { setEquipment(val); setPage(1); };
  const handleTarget = (val: string[]) => { setTarget(val); setPage(1); };

  const handleDelete = async () => {
    if (!exerciseToDelete) return;
    try {
      await exerciseService.deleteExercise(exerciseToDelete);
      setExerciseToDelete(null);
      setPage(1); // reload from start
    } catch (e) {
      console.error(e);
    }
  };

  const renderGrid = () => {
    if (loading && exercises.length === 0) {
      return <div className="py-12 text-center text-muted-foreground">Đang tải...</div>;
    }
    if (!loading && exercises.length === 0) {
      return <div className="py-12 text-center text-muted-foreground">Không tìm thấy bài tập nào.</div>;
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exercises.map((ex, index) => {
            const isLast = index === exercises.length - 1;
            return (
              <Card 
                key={ex.id} 
                ref={isLast ? lastExerciseElementRef : null}
                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => setDetailExercise(ex)}
              >
                {/* Image Placeholder */}
                <div className="w-full h-40 bg-muted flex items-center justify-center border-b">
                  <div className="text-muted-foreground/40 flex flex-col items-center">
                    <Eye className="w-8 h-8 mb-2" />
                    <span className="text-xs font-medium">Chưa có ảnh/video</span>
                  </div>
                </div>

                <CardHeader className="pb-3 px-4 pt-4 border-b bg-muted/5">
                  <CardTitle className="text-base line-clamp-1" title={ex.name}>{ex.name}</CardTitle>
                  <CardDescription className="capitalize text-xs font-medium text-[#54B7F0]">{ex.category || 'Chung'}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>Dụng cụ:</span>
                      <span className="font-medium text-foreground capitalize truncate ml-2 max-w-[120px]">{ex.equipment || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mục tiêu:</span>
                      <span className="font-medium text-foreground capitalize truncate ml-2 max-w-[120px]">{ex.target || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cơ chính:</span>
                      <span className="font-medium text-foreground capitalize truncate ml-2 max-w-[120px]">{ex.muscle_group || '-'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-3 border-t bg-muted/10 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingExercise(ex); setIsFormOpen(true); }}>
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => setExerciseToDelete(ex.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {loading && exercises.length > 0 && (
          <div className="py-4 text-center text-muted-foreground text-sm">
            Đang tải thêm...
          </div>
        )}
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* We build a simple custom list instead of DataTable to easily support infinite scroll without pagination footer */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Tên Bài Tập</th>
                <th className="px-4 py-3 font-medium">Danh mục</th>
                <th className="px-4 py-3 font-medium">Dụng cụ</th>
                <th className="px-4 py-3 font-medium">Mục tiêu</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exercises.map((ex, index) => {
                const isLast = index === exercises.length - 1;
                return (
                  <tr key={ex.id} ref={isLast ? lastExerciseElementRef : null} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{ex.name}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{ex.category || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{ex.equipment || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{ex.target || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailExercise(ex)}>
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingExercise(ex); setIsFormOpen(true); }}>
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setExerciseToDelete(ex.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {loading && exercises.length > 0 && (
            <div className="py-4 text-center text-muted-foreground text-sm w-full border-t">
              Đang tải thêm...
            </div>
          )}
          {!loading && exercises.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Không tìm thấy bài tập nào.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <HeroHeader
        eyebrow="Thư viện · Exercise Library"
        title="Quản lý Bài tập"
        titleAccent=""
        subtitle="Quản lý danh sách các bài tập chuẩn dùng trong giáo án và ghi log tập luyện."
        action={
          <Button className="bg-[#54B7F0] hover:bg-[#54B7F0]/90 text-white" onClick={() => { setEditingExercise(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Thêm Bài tập
          </Button>
        }
        meta={
          <>
            <span>Tổng cộng {total} bài tập</span>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm tên bài tập..." 
                className="pl-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <FilterDropdown title="Danh mục" options={CATEGORIES} selected={category} onChange={handleCategory} />
            <FilterDropdown title="Công cụ" options={EQUIPMENTS} selected={equipment} onChange={handleEquipment} />
            <FilterDropdown title="Mục tiêu" options={TARGETS} selected={target} onChange={handleTarget} />
          </div>
          
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md border shrink-0 mt-2 xl:mt-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("px-3 text-muted-foreground", viewMode === 'grid' && "bg-background text-foreground shadow-sm")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Dạng Thẻ
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("px-3 text-muted-foreground", viewMode === 'list' && "bg-background text-foreground shadow-sm")}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4 mr-2" /> Danh sách
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? renderList() : renderGrid()}
      </div>

      <ExerciseFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingExercise}
        onSuccess={() => setPage(1)} // refresh from start
      />

      <ExerciseDetailDialog
        isOpen={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        exercise={detailExercise}
      />

      <ConfirmDialog
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={handleDelete}
        title="Xoá Bài tập?"
        description="Bạn có chắc muốn xoá bài tập này khỏi thư viện? Điều này có thể ảnh hưởng đến lịch sử tập luyện của học viên."
      />
    </div>
  );
}
