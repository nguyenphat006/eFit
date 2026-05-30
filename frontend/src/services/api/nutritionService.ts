import { axiosClient } from '@/lib/axiosClient';
import { FoodCategory, FoodItem, PaginatedResponse } from '@/types/nutrition';

interface BaseResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export const nutritionService = {
  /**
   * Get all food categories
   */
  getCategories: async (): Promise<FoodCategory[]> => {
    const response = await axiosClient.get<any, BaseResponse<FoodCategory[]>>('/api/v1/categories');
    return response.data;
  },

  /**
   * Get food category by code
   */
  getCategoryByCode: async (code: string): Promise<FoodCategory> => {
    const response = await axiosClient.get<any, BaseResponse<FoodCategory>>(`/api/v1/categories/${code}`);
    return response.data;
  },

  /**
   * Get paginated foods with filters
   */
  getFoods: async (params?: {
    q?: string;
    category_code?: string;
    is_system_data?: boolean;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<FoodItem>> => {
    const response = await axiosClient.get<any, PaginatedResponse<FoodItem>>('/api/v1/foods', {
      params,
    });
    return response;
  },

  /**
   * Get food item by ID
   */
  getFoodById: async (id: number): Promise<FoodItem> => {
    const response = await axiosClient.get<any, BaseResponse<FoodItem>>(`/api/v1/foods/${id}`);
    return response.data;
  },
};
