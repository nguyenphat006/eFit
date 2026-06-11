import { axiosClient } from '@/lib/axiosClient';
import { withFallback } from './withFallback';
import { MOCK_FOOD_CATEGORIES, mockFoodsPaginated } from './mockData';
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
    return withFallback(
      axiosClient
        .get<any, BaseResponse<FoodCategory[]>>('/api/v1/categories')
        .then((r) => r.data),
      MOCK_FOOD_CATEGORIES,
      'nutritionService.getCategories',
    );
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
    return withFallback(
      axiosClient.get<any, PaginatedResponse<FoodItem>>('/api/v1/foods', { params }),
      mockFoodsPaginated(params),
      'nutritionService.getFoods',
    );
  },

  /**
   * Get food item by ID
   */
  getFoodById: async (id: number): Promise<FoodItem> => {
    const response = await axiosClient.get<any, BaseResponse<FoodItem>>(`/api/v1/foods/${id}`);
    return response.data;
  },

  /**
   * Create new food item
   */
  createFood: async (data: Partial<FoodItem>): Promise<FoodItem> => {
    const response = await axiosClient.post<any, BaseResponse<FoodItem>>('/api/v1/foods', data);
    return response.data;
  },

  /**
   * Update food item
   */
  updateFood: async (id: number, data: Partial<FoodItem>): Promise<FoodItem> => {
    const response = await axiosClient.put<any, BaseResponse<FoodItem>>(`/api/v1/foods/${id}`, data);
    return response.data;
  },

  /**
   * Delete food item
   */
  deleteFood: async (id: number): Promise<void> => {
    await axiosClient.delete(`/api/v1/foods/${id}`);
  },

  /**
   * Upload an image file and get the URL back
   */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post<any, BaseResponse<{ url: string; filename: string }>>('/api/v1/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },
};
