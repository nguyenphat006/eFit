import { axiosClient } from '@/lib/axiosClient';
import { withFallback } from './withFallback';
import { MOCK_EXERCISES } from './mockData';
import { Exercise, ExerciseCreate, ExerciseUpdate, ExerciseListResponse } from '@/types/exercise';

class ExerciseService {
  private readonly baseUrl = '/api/v1/exercises';

  async getExercises(
    skip: number = 0,
    limit: number = 50,
    search?: string,
    category?: string[],
    equipment?: string[],
    target?: string[]
  ): Promise<ExerciseListResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    if (category && category.length > 0) {
      category.forEach(c => params.append('category', c));
    }
    if (equipment && equipment.length > 0) {
      equipment.forEach(e => params.append('equipment', e));
    }
    if (target && target.length > 0) {
      target.forEach(t => params.append('target', t));
    }

    return withFallback(
      axiosClient.get<any, ExerciseListResponse>(`${this.baseUrl}?${params.toString()}`),
      MOCK_EXERCISES,
      'ExerciseService.getExercises'
    );
  }

  async getExercise(id: number): Promise<Exercise> {
    return withFallback(
      axiosClient.get<any, Exercise>(`${this.baseUrl}/${id}`),
      MOCK_EXERCISES.items.find(i => i.id === id) as Exercise,
      'ExerciseService.getExercise'
    );
  }

  async createExercise(payload: ExerciseCreate): Promise<Exercise> {
    return axiosClient.post<any, Exercise>(this.baseUrl, payload);
  }

  async updateExercise(id: number, payload: ExerciseUpdate): Promise<Exercise> {
    return axiosClient.put<any, Exercise>(`${this.baseUrl}/${id}`, payload);
  }

  async deleteExercise(id: number): Promise<boolean> {
    return axiosClient.delete(`${this.baseUrl}/${id}`).then(() => true);
  }
}

export const exerciseService = new ExerciseService();
