import { http } from "@/lib/api/axiosClient";
import { createCrudService } from "@/lib/api/crud";
import type { ClientCreateInput, ClientFilters, ClientItem, ClientUpdateInput } from "../types";

const RESOURCE = "/clients/";

/** CRUD + batch chuẩn cho `/clients/` (HLV chỉ thấy học viên của mình) + liên kết tài khoản. */
export const clientService = {
  ...createCrudService<ClientItem, ClientCreateInput, ClientUpdateInput, ClientFilters>(RESOURCE),
  linkAccount: (id: number, userId: number) => http.post<ClientItem>(`${RESOURCE}${id}/link-account/`, { user_id: userId }),
  unlinkAccount: (id: number) => http.delete<ClientItem>(`${RESOURCE}${id}/link-account/`),
};
