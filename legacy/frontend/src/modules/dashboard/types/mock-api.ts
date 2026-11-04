// frontend/src/modules/dashboard/types/mock-api.ts

export interface SessionActiveStatus {
  phaseName: string;
  currentDay: number;
  totalDays: number;
  currentWeight: number;
  targetWeight: number;
  daysRemaining: number;
}

export interface ComplianceStats {
  todayNutritionScore: number;
  todayWorkoutCompleted: boolean;
  overallTodayScore: number; // 0-100
  weeklyTrend: { date: string; score: number }[];
}

export interface CorrelationData {
  date: string;
  weight: number;
  caloriesIn: number;
  targetCalories: number;
}

export interface AIInsight {
  id: string;
  type: 'plateau' | 'macro' | 'overtraining' | 'motivation';
  message: string;
  actionRequired?: string;
}

export const mockSessionStatus: SessionActiveStatus = {
  phaseName: "Phase 2: Thắt chặt Calorie",
  currentDay: 24,
  totalDays: 90,
  currentWeight: 75.5,
  targetWeight: 70.0,
  daysRemaining: 66,
};

export const mockCompliance: ComplianceStats = {
  todayNutritionScore: 90,
  todayWorkoutCompleted: true,
  overallTodayScore: 95,
  weeklyTrend: [
    { date: "T2", score: 100 },
    { date: "T3", score: 95 },
    { date: "T4", score: 100 },
    { date: "T5", score: 85 },
    { date: "T6", score: 90 },
    { date: "T7", score: 60 }, // Cuối tuần lười
    { date: "CN", score: 95 },
  ],
};

export const mockCorrelationChart: CorrelationData[] = Array.from({ length: 14 }).map((_, i) => ({
  date: `Ngày ${i + 1}`,
  weight: 77 - (i * 0.1) + (Math.random() * 0.3 - 0.15),
  caloriesIn: 2200 + (Math.random() * 400 - 200),
  targetCalories: 2100,
}));

export const mockAIInsights: AIInsight[] = [
  {
    id: "1",
    type: "plateau",
    message: "Cân nặng không giảm 4 ngày nay dù lượng calo nạp vào đúng chuẩn (2100 kcal).",
    actionRequired: "Đề xuất giảm thêm 100 kcal/ngày hoặc tăng 15p Cardio."
  },
  {
    id: "2",
    type: "macro",
    message: "Hôm nay bạn còn thiếu 25g Protein so với mục tiêu cắt mỡ.",
    actionRequired: "Gợi ý: Thêm 1 muỗng Whey hoặc 100g ức gà vào bữa phụ."
  }
];
