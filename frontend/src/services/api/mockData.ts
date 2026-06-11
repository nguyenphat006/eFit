import type { SessionListItem, DailyLog, Session, Phase } from '@/types/session';
import type { WorkoutProgramListItem } from '@/types/workout';
import type { FoodCategory, FoodItem, PaginatedResponse as NutritionPaginated } from '@/types/nutrition';

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const offsetDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

export const MOCK_SESSIONS: SessionListItem[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Mùa siết cơ hè 2026',
    goal_type: 'Cutting',
    start_date: fmt(offsetDays(-30)),
    end_date: fmt(offsetDays(60)),
    is_active: true,
    status: 'Active',
    phase_count: 3,
    created_at: fmt(offsetDays(-35)),
  },
  {
    id: 2,
    user_id: 1,
    name: 'Bulking Đông 2025',
    goal_type: 'Bulking',
    start_date: fmt(offsetDays(-180)),
    end_date: fmt(offsetDays(-60)),
    is_active: false,
    status: 'Completed',
    phase_count: 4,
    created_at: fmt(offsetDays(-200)),
  },
  {
    id: 3,
    user_id: 1,
    name: 'Recomp Q4 2026',
    goal_type: 'Recomp',
    start_date: fmt(offsetDays(70)),
    end_date: fmt(offsetDays(160)),
    is_active: false,
    status: 'Draft',
    phase_count: 0,
    created_at: fmt(offsetDays(-2)),
  },
  {
    id: 4,
    user_id: 1,
    name: 'Maintenance Spring',
    goal_type: 'Maintaining',
    start_date: fmt(offsetDays(-400)),
    end_date: fmt(offsetDays(-300)),
    is_active: false,
    status: 'Completed',
    phase_count: 2,
    created_at: fmt(offsetDays(-410)),
  },
  {
    id: 5,
    user_id: 1,
    name: 'Cutting Mini-Cut Tết',
    goal_type: 'Cutting',
    start_date: fmt(offsetDays(-260)),
    end_date: fmt(offsetDays(-230)),
    is_active: false,
    status: 'Abandoned',
    phase_count: 1,
    created_at: fmt(offsetDays(-265)),
  },
];

export const MOCK_DAILY_LOGS: DailyLog[] = Array.from({ length: 30 }).map(
  (_, i) => {
    const d = offsetDays(-i);
    const weight = 78.4 - i * 0.08 + (i % 3 === 0 ? 0.2 : -0.1);
    const sleep = 6.5 + ((i * 13) % 4) * 0.4;
    const workoutDone = i % 2 === 0 || i % 5 === 1;
    const meals = Math.min(4, 3 + (i % 2));
    const cheat: 'NONE' | 'PLANNED' | 'UNPLANNED' =
      i % 7 === 3 ? 'UNPLANNED' : i % 5 === 0 ? 'PLANNED' : 'NONE';
    const steps = 5000 + (i * 437) % 8000;
    const cardio = i % 3 === 0 ? 25 + (i % 4) * 5 : null;
    const fatigue = (i % 5) + 1;
    const score =
      (workoutDone ? 30 : 0) +
      (meals / 4) * 50 +
      (cheat === 'UNPLANNED' ? -15 : 0) +
      (weight ? 20 : 0);

    return {
      id: 100 - i,
      user_id: 1,
      phase_id: i < 7 ? 1 : 2,
      log_date: fmt(d),
      target_calories_snapshot: 2200,
      target_protein_snapshot: 165,
      target_carbs_snapshot: 220,
      target_fat_snapshot: 73,
      weight: parseFloat(weight.toFixed(1)),
      calories_in: 2100 + (i % 4) * 80,
      protein_in: 155 + (i % 3) * 10,
      carbs_in: 210 + (i % 4) * 12,
      fat_in: 68 + (i % 5) * 3,
      sleep_hours: parseFloat(sleep.toFixed(1)),
      work_hours: 7 + (i % 3),
      fatigue_level: fatigue,
      is_workout_completed: workoutDone,
      steps,
      cardio_duration_minutes: cardio,
      cardio_type: cardio ? (i % 2 === 0 ? 'LISS' : 'HIIT') : null,
      diet_meals_completed: meals,
      diet_target_meals: 4,
      diet_protein_estimated: true,
      diet_cheat_status: cheat,
      diet_notes:
        cheat === 'UNPLANNED'
          ? '1 ly trà sữa size L + 1 chiếc bánh ngọt'
          : cheat === 'PLANNED'
          ? 'Cheat day theo kế hoạch'
          : null,
      body_images:
        i % 4 === 0
          ? [
              `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop`,
              `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=200&fit=crop`,
            ]
          : null,
      compliance_score: Math.max(0, Math.min(100, Math.round(score))),
      compliance_notes: null,
      chest_measure: i % 5 === 0 ? 102 : undefined,
      waist_measure: i % 5 === 0 ? 78 : undefined,
      hips_measure: i % 5 === 0 ? 96 : undefined,
      created_at: fmt(d),
    } as DailyLog;
  },
);

// ─── Phases for the active session ───────────────────────────────────────────
export const MOCK_PHASES: Phase[] = [
  {
    id: 1,
    session_id: 1,
    name: 'Phase 1 — Thích nghi',
    description:
      'Làm quen với deficit nhẹ và tăng dần volume. Mục tiêu: tạo nền tảng phục hồi tốt, không giảm cơ.',
    order: 0,
    start_date: fmt(offsetDays(-30)),
    end_date: fmt(offsetDays(-1)),
    target_calories: 2400,
    target_protein: 165,
    target_carbs: 260,
    target_fat: 75,
    workout_program_id: 1,
    workout_program_snapshot: null,
    created_at: fmt(offsetDays(-32)),
  },
  {
    id: 2,
    session_id: 1,
    name: 'Phase 2 — Cắt cường độ',
    description:
      'Deficit ~500 kcal/ngày. Ưu tiên protein 2.2g/kg để giữ cơ. Thêm 2 buổi LISS/tuần.',
    order: 1,
    start_date: fmt(offsetDays(0)),
    end_date: fmt(offsetDays(28)),
    target_calories: 2100,
    target_protein: 175,
    target_carbs: 200,
    target_fat: 68,
    workout_program_id: 1,
    workout_program_snapshot: null,
    created_at: fmt(offsetDays(-32)),
  },
  {
    id: 3,
    session_id: 1,
    name: 'Phase 3 — Peak Week',
    description:
      'Tuần đỉnh trước photoshoot. Cao protein, giảm carb dần, tăng cardio HIIT.',
    order: 2,
    start_date: fmt(offsetDays(29)),
    end_date: fmt(offsetDays(60)),
    target_calories: 1900,
    target_protein: 180,
    target_carbs: 160,
    target_fat: 62,
    workout_program_id: null,
    workout_program_snapshot: null,
    created_at: fmt(offsetDays(-32)),
  },
];

export function buildMockSessionDetail(id: number): Session {
  const listItem =
    MOCK_SESSIONS.find((s) => s.id === id) ?? MOCK_SESSIONS[0];
  const phases =
    listItem.id === 1
      ? MOCK_PHASES
      : MOCK_PHASES.map((p) => ({ ...p, session_id: listItem.id }));
  return {
    id: listItem.id,
    user_id: listItem.user_id,
    name: listItem.name,
    goal_type: listItem.goal_type,
    start_date: listItem.start_date,
    end_date: listItem.end_date,
    is_active: listItem.is_active,
    status: listItem.status,
    phases,
    created_at: listItem.created_at,
  };
}

export function mockPhaseDailyLogs(phaseId: number): DailyLog[] {
  return MOCK_DAILY_LOGS.filter((l) => l.phase_id === phaseId);
}

// ─── Workout Programs ────────────────────────────────────────────────────────
// Extended type so the UI can show usage stats. Real backend may not have these
// fields yet — UI gracefully falls back when missing.
export type WorkoutProgramListWithStats = WorkoutProgramListItem & {
  last_used_at?: string | null;
  total_workouts_logged?: number;
  total_exercises?: number;
};

export const MOCK_WORKOUT_PROGRAMS: WorkoutProgramListWithStats[] = [
  {
    id: 1,
    user_id: 1,
    name: 'PPL — Hypertrophy Block',
    frequency_per_week: 6,
    start_date: fmt(offsetDays(-30)),
    end_date: fmt(offsetDays(60)),
    is_active: true,
    notes: 'Push/Pull/Legs split, RPE 7-8.',
    day_count: 6,
    created_at: fmt(offsetDays(-35)),
    last_used_at: fmt(offsetDays(-1)),
    total_workouts_logged: 18,
    total_exercises: 42,
  },
  {
    id: 2,
    user_id: 1,
    name: 'Upper / Lower 4 ngày',
    frequency_per_week: 4,
    start_date: null,
    end_date: null,
    is_active: false,
    notes: 'Backup template, dùng khi bận.',
    day_count: 4,
    created_at: fmt(offsetDays(-90)),
    last_used_at: fmt(offsetDays(-45)),
    total_workouts_logged: 24,
    total_exercises: 32,
  },
  {
    id: 3,
    user_id: 1,
    name: 'Full body 3 ngày — Tập nhẹ',
    frequency_per_week: 3,
    start_date: null,
    end_date: null,
    is_active: false,
    notes: 'Dùng cho deload week.',
    day_count: 3,
    created_at: fmt(offsetDays(-180)),
    last_used_at: fmt(offsetDays(-120)),
    total_workouts_logged: 6,
    total_exercises: 18,
  },
  {
    id: 4,
    user_id: 1,
    name: '5/3/1 Strength',
    frequency_per_week: 4,
    start_date: null,
    end_date: null,
    is_active: false,
    notes: 'Powerbuilding template.',
    day_count: 4,
    created_at: fmt(offsetDays(-240)),
    last_used_at: null,
    total_workouts_logged: 0,
    total_exercises: 28,
  },
];

// ─── Food library ────────────────────────────────────────────────────────────
export const MOCK_FOOD_CATEGORIES: FoodCategory[] = [
  { code: 'GRAINS', name: 'Lương thực & Tinh bột', description: 'Cơm, bún, phở, mì, yến mạch...' },
  { code: 'MEATS', name: 'Thịt & Gia cầm', description: 'Thịt bò, lợn, gà, vịt...' },
  { code: 'SEAFOOD', name: 'Thủy hải sản', description: 'Cá, tôm, cua, mực...' },
  { code: 'DAIRY_EGGS', name: 'Trứng & Sữa', description: 'Sữa, phô mai, sữa chua, trứng...' },
  { code: 'VEGETABLES', name: 'Rau củ quả', description: 'Rau xanh, trái cây, nấm...' },
  { code: 'FATS', name: 'Dầu mỡ & Hạt', description: 'Dầu ăn, mỡ, các loại hạt khô' },
  { code: 'SUPPLEMENTS', name: 'Thực phẩm bổ sung', description: 'Whey, Mass, Creatine...' },
  { code: 'RECIPE', name: 'Món ăn hoàn chỉnh', description: 'Phở, cơm tấm, bún bò...' },
];

export const MOCK_FOODS: FoodItem[] = [
  { id: 1, name: 'Cơm trắng', category_code: 'GRAINS', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, base_unit: '100g', default_serving_name: '1 chén', default_serving_weight: 130, is_system_data: true },
  { id: 2, name: 'Bún tươi', category_code: 'GRAINS', calories: 110, protein: 1.7, carbs: 25, fat: 0.1, fiber: 0.5, base_unit: '100g', default_serving_name: '1 chén', default_serving_weight: 150, is_system_data: true },
  { id: 3, name: 'Yến mạch (Rolled Oats)', category_code: 'GRAINS', calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, base_unit: '100g', default_serving_name: '1 khẩu phần', default_serving_weight: 40, is_system_data: true },
  { id: 4, name: 'Ức gà (sống, không da)', category_code: 'MEATS', calories: 110, protein: 23, carbs: 0, fat: 1.2, fiber: 0, base_unit: '100g', default_serving_name: '1 lạng', default_serving_weight: 100, is_system_data: true },
  { id: 5, name: 'Thịt bò nạc (sống)', category_code: 'MEATS', calories: 158, protein: 26, carbs: 0, fat: 5.5, fiber: 0, base_unit: '100g', is_system_data: true },
  { id: 6, name: 'Cá hồi (sống)', category_code: 'SEAFOOD', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, base_unit: '100g', is_system_data: true },
  { id: 7, name: 'Tôm sú (sống)', category_code: 'SEAFOOD', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, base_unit: '100g', is_system_data: true },
  { id: 8, name: 'Trứng gà', category_code: 'DAIRY_EGGS', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, base_unit: '100g', default_serving_name: '1 quả', default_serving_weight: 50, is_system_data: true },
  { id: 9, name: 'Sữa chua không đường', category_code: 'DAIRY_EGGS', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, base_unit: '100g', default_serving_name: '1 hũ', default_serving_weight: 100, is_system_data: true },
  { id: 10, name: 'Bông cải xanh', category_code: 'VEGETABLES', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, base_unit: '100g', is_system_data: true },
  { id: 11, name: 'Cà rốt', category_code: 'VEGETABLES', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, base_unit: '100g', is_system_data: true },
  { id: 12, name: 'Dầu olive nguyên chất', category_code: 'FATS', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, base_unit: '100ml', default_serving_name: '1 muỗng canh', default_serving_weight: 14, is_system_data: true },
  { id: 13, name: 'Hạnh nhân', category_code: 'FATS', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5, base_unit: '100g', default_serving_name: '1 nắm', default_serving_weight: 30, is_system_data: true },
  { id: 14, name: 'Whey Isolate (1 scoop ~30g)', category_code: 'SUPPLEMENTS', calories: 120, protein: 27, carbs: 1, fat: 0.5, fiber: 0, base_unit: '100g', default_serving_name: '1 scoop', default_serving_weight: 30, is_system_data: true },
  { id: 15, name: 'Phở bò tái', category_code: 'RECIPE', calories: 350, protein: 25, carbs: 50, fat: 5, fiber: 1.5, base_unit: '1 tô', default_serving_name: '1 tô lớn', default_serving_weight: 500, is_system_data: true },
  { id: 16, name: 'Cơm tấm sườn bì chả', category_code: 'RECIPE', calories: 720, protein: 28, carbs: 90, fat: 22, fiber: 2, base_unit: '1 phần', is_system_data: true },
];

export function mockFoodsPaginated(params?: {
  q?: string; category_code?: string; page?: number; size?: number;
}): NutritionPaginated<FoodItem> {
  const q = params?.q?.toLowerCase() ?? '';
  const cat = params?.category_code;
  let filtered = MOCK_FOODS.map((f) => ({
    ...f,
    category: MOCK_FOOD_CATEGORIES.find((c) => c.code === f.category_code),
  }));
  if (q) filtered = filtered.filter((f) => f.name.toLowerCase().includes(q));
  if (cat && cat !== 'ALL') filtered = filtered.filter((f) => f.category_code === cat);

  const page = params?.page ?? 1;
  const size = params?.size ?? 20;
  const start = (page - 1) * size;
  return {
    data: filtered.slice(start, start + size),
    total: filtered.length,
    page,
    size,
  };
}
