"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCrudHooks } from "@/lib/api/createCrudHooks";
import { clientService } from "../services/client.service";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

const hooks = createCrudHooks(CLIENTS_QUERY_KEY, clientService);

export const clientQueryKeys = hooks.keys;
export const useClientsList = hooks.useList;
export const useClientDetail = hooks.useDetail;
export const useCreateClientMutation = hooks.useCreate;
export const useUpdateClientMutation = hooks.useUpdate;
export const useDeleteClientMutation = hooks.useDelete;
export const useBatchDeleteClientsMutation = hooks.useBatchDelete;
export const useBatchStatusClientsMutation = hooks.useBatchStatus;

/** Liên kết / hủy liên kết tài khoản đăng nhập cho học viên (userId = null -> hủy) */
export function useLinkClientAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number | null }) =>
      userId === null ? clientService.unlinkAccount(id) : clientService.linkAccount(id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
  });
}
