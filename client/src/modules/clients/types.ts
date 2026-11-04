import type { Schemas } from "@/types/api";

/** Kiểu sinh từ OpenAPI (apps/clients/serializers.py). */
export type ClientItem = Schemas["Client"];
export type ClientCreateInput = Schemas["ClientCreateUpdateRequest"];
export type ClientUpdateInput = Partial<ClientCreateInput>;

export interface ClientFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}
