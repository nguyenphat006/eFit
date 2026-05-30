import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyLogService, DailyLogCreate, DailyLogUpdate } from '../services/api/dailyLogService';

const QUERY_KEY = ['dailyLogs'];

export const useDailyLogs = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: dailyLogService.getAll,
  });
};

export const useCreateDailyLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DailyLogCreate) => dailyLogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useUpdateDailyLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DailyLogUpdate }) => 
      dailyLogService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useDeleteDailyLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dailyLogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};
