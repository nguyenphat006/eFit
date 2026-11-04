import { axiosClient } from '@/lib/axiosClient';
import { withFallback } from './withFallback';
import { MOCK_WORKOUT_PROGRAMS } from './mockData';
import {
  WorkoutProgram,
  WorkoutProgramListItem,
  WorkoutProgramCreate,
  WorkoutDay,
  WorkoutDayCreate,
  WorkoutExercise,
  WorkoutExerciseCreate,
  WorkoutExerciseUpdate,
} from '@/types/workout';

interface BaseResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export const workoutService = {
  // ─── WorkoutProgram ────────────────────────────────────────────────────────

  listPrograms: async (page = 1, size = 20, is_template?: boolean): Promise<PaginatedResponse<WorkoutProgramListItem>> => {
    const fallback: PaginatedResponse<WorkoutProgramListItem> = {
      data: MOCK_WORKOUT_PROGRAMS,
      total: MOCK_WORKOUT_PROGRAMS.length,
      page: 1,
      size: MOCK_WORKOUT_PROGRAMS.length,
      total_pages: 1,
    };
    
    let url = `/api/v1/workout-programs?page=${page}&size=${size}`;
    if (is_template !== undefined) {
      url += `&is_template=${is_template}`;
    }

    return withFallback(
      axiosClient.get<any, PaginatedResponse<WorkoutProgramListItem>>(url),
      fallback,
      'workoutService.listPrograms',
    );
  },

  getProgram: async (id: number): Promise<WorkoutProgram> => {
    const res = await axiosClient.get<any, BaseResponse<WorkoutProgram>>(`/api/v1/workout-programs/${id}`);
    return res.data;
  },

  createProgram: async (payload: WorkoutProgramCreate): Promise<WorkoutProgram> => {
    const res = await axiosClient.post<any, BaseResponse<WorkoutProgram>>('/api/v1/workout-programs', payload);
    return res.data;
  },

  updateProgram: async (id: number, payload: Partial<WorkoutProgramCreate>): Promise<WorkoutProgram> => {
    const res = await axiosClient.put<any, BaseResponse<WorkoutProgram>>(`/api/v1/workout-programs/${id}`, payload);
    return res.data;
  },

  deleteProgram: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/workout-programs/${id}`);
  },

  // ─── WorkoutDay ────────────────────────────────────────────────────────────

  createDay: async (programId: number, payload: Omit<WorkoutDayCreate, 'program_id'>): Promise<WorkoutDay> => {
    const res = await axiosClient.post<any, BaseResponse<WorkoutDay>>(
      `/api/v1/workout-programs/${programId}/days`,
      { ...payload, program_id: programId }
    );
    return res.data;
  },

  updateDay: async (dayId: number, payload: { day_label?: string; day_of_week?: number | null; order?: number }): Promise<WorkoutDay> => {
    const res = await axiosClient.put<any, BaseResponse<WorkoutDay>>(
      `/api/v1/workout-programs/days/${dayId}`,
      payload
    );
    return res.data;
  },

  deleteDay: async (dayId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/workout-programs/days/${dayId}`);
  },

  // ─── WorkoutExercise ───────────────────────────────────────────────────────

  createExercise: async (dayId: number, payload: Omit<WorkoutExerciseCreate, 'workout_day_id'>): Promise<WorkoutExercise> => {
    const res = await axiosClient.post<any, BaseResponse<WorkoutExercise>>(
      `/api/v1/workout-programs/days/${dayId}/exercises`,
      { ...payload, workout_day_id: dayId }
    );
    return res.data;
  },

  updateExercise: async (exerciseId: number, payload: WorkoutExerciseUpdate): Promise<WorkoutExercise> => {
    const res = await axiosClient.put<any, BaseResponse<WorkoutExercise>>(
      `/api/v1/workout-programs/exercises/${exerciseId}`,
      payload
    );
    return res.data;
  },

  deleteExercise: async (exerciseId: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/workout-programs/exercises/${exerciseId}`);
  },
};
