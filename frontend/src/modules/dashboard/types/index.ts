export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number; // in kg
}

export interface DashboardMetrics {
  complianceScore: number; // percentage
  currentPhase: string; // Hypertrophy, Strength, etc.
  weightToday: number; // in kg
  sleepHours: number;
  caloriesConsumed: number;
}
