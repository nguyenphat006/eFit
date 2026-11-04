"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, CircleCheck, Trash2 } from "lucide-react";
import { ACTIVE_STATUS, StatusBadge, defineStatusMap, statusOptions } from "@/components/common/StatusBadge";
import { ListPage, RelativeTime, defineColumns, useExcelExport, useListState, type BulkAction, type FilterOption } from "@/components/list";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { foodCategoryService } from "@/modules/library/food-categories/services/foodCategory.service";
import { useNumberFormat } from "@/providers/NumberFormatProvider";
import { FoodFormModal } from "./components/FoodFormModal";
import {
  useBatchDeleteFoodsMutation,
  useBatchStatusFoodsMutation,
  useCreateFoodMutation,
  useDeleteFoodMutation,
  useFoodsList,
  useUpdateFoodMutation,
} from "./hooks/useFoodsQuery";
import type { FoodCreateInput, FoodItem } from "./types";

const DATA_SOURCE = defineStatusMap({
  true: { label: "foods.source.system", tone: "info" },
  false: { label: "foods.source.user", tone: "neutral" },
});

/** Nhóm thực phẩm cho bộ lọc cột — danh mục nhỏ, tải khi mở bộ lọc */
async function categoryOptions(search: string): Promise<FilterOption[]> {
  const data = await foodCategoryService.list({ search: search || undefined, page_size: 100, ordering: "sort_order" });
  return data.results.map((c) => ({ value: c.id, label: c.category_name, code: c.category_code }));
}

/** Thư viện thực phẩm — macro theo đơn vị gốc; dữ liệu hệ thống chỉ quản trị viên được sửa / xóa. */
export function FoodsView() {
  const t = useTranslations("foods");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const { can, isSuperUser } = usePermission();
  const { formatNumber } = useNumberFormat();
  const list = useListState({ defaultOrdering: "name" });
  const query = useFoodsList(list.params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);

  const createMutation = useCreateFoodMutation();
  const updateMutation = useUpdateFoodMutation();
  const deleteMutation = useDeleteFoodMutation();
  const batchDelete = useBatchDeleteFoodsMutation();
  const batchStatus = useBatchStatusFoodsMutation();

  const { openExport, exportModal } = useExcelExport({
    endpoint: "/food-items/",
    label: t("title"),
    list,
    total: query.data?.count ?? 0,
    preview: query.data?.results,
  });

  const columns = useMemo(() => {
    const macro = (key: "calories" | "protein" | "carbs" | "fat", label: string, unit: string) => ({
      key,
      title: `${label} (${unit})`,
      width: 110,
      align: "right" as const,
      sortable: true,
      filter: { type: "number" as const },
      render: (v: string) => formatNumber(v, 1),
    });
    return defineColumns<FoodItem>([
      { key: "name", title: t("fields.name"), width: 240, pinned: "left", hideable: false, sortable: true, filter: { type: "text" } },
      {
        key: "category_name",
        title: t("fields.category"),
        width: 170,
        filterField: "category",
        filter: { type: "remote", fetchOptions: categoryOptions },
      },
      { key: "base_unit", title: t("fields.baseUnit"), width: 100 },
      macro("calories", tf("fields.calories"), tf("units.kcal")),
      macro("protein", tf("fields.protein"), tf("units.gram")),
      macro("carbs", tf("fields.carbs"), tf("units.gram")),
      macro("fat", tf("fields.fat"), tf("units.gram")),
      { key: "default_serving_name", title: t("fields.servingName"), width: 140, defaultHidden: true },
      {
        key: "is_system_data",
        title: t("fields.isSystemData"),
        width: 120,
        filter: { type: "select", options: statusOptions(DATA_SOURCE, tr) },
        render: (v) => <StatusBadge map={DATA_SOURCE} value={v} />,
      },
      {
        key: "is_active",
        title: tc("fields.status"),
        width: 130,
        defaultHidden: true,
        filter: { type: "select", options: statusOptions(ACTIVE_STATUS, tr) },
        render: (v) => <StatusBadge map={ACTIVE_STATUS} value={v} />,
      },
      {
        key: "updated_at",
        title: tc("fields.updatedAt"),
        width: 140,
        sortable: true,
        defaultHidden: true,
        filter: { type: "date" },
        render: (v, r) => <RelativeTime value={v} by={r.updated_by_name} />,
      },
    ]);
  }, [t, tf, tc, tr, formatNumber]);

  // Dữ liệu hệ thống chỉ quản trị viên sửa / xóa (backend kiểm tra cả quyền sở hữu với dữ liệu tự tạo)
  const lockedReason = (r: FoodItem) => (r.is_system_data && !isSuperUser ? t("protectedSystem") : null);

  const handleSubmit = async (values: FoodCreateInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: values });
      toast.success(tc("messages.updated", { entity: t("entity") }));
    } else {
      await createMutation.mutateAsync(values);
      toast.success(tc("messages.created", { entity: t("entity") }));
    }
    setFormOpen(false);
  };

  const showBatchResult = (res: { message: string; data: { skipped?: unknown[] } }) =>
    res.data.skipped?.length ? toast.warning(res.message) : toast.success(res.message);

  const bulkActions: BulkAction[] = [
    ...(can(PERMISSIONS.FOOD_ITEM.UPDATE)
      ? [
          { key: "activate", label: tc("actions.activate"), icon: <CircleCheck />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: true })) },
          { key: "deactivate", label: tc("actions.deactivate"), icon: <Ban />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: false })) },
        ]
      : []),
    ...(can(PERMISSIONS.FOOD_ITEM.DELETE)
      ? [
          {
            key: "delete",
            label: tc("actions.delete"),
            icon: <Trash2 />,
            danger: true,
            confirm: {
              title: (n: number) => tc("messages.bulkDeleteTitle", { count: n, entity: t("entity") }),
              content: tc("messages.deleteIrreversible"),
              okText: tc("actions.delete"),
            },
            onClick: async (ids: number[]) => showBatchResult(await batchDelete.mutateAsync(ids)),
          },
        ]
      : []),
  ];

  return (
    <ListPage<FoodItem>
      moduleCode="FOOD_ITEM"
      tableKey="food-items-table"
      list={list}
      query={query}
      columns={columns}
      entityLabel={t("entity")}
      searchPlaceholder={t("searchPlaceholder")}
      onCreate={can(PERMISSIONS.FOOD_ITEM.CREATE) ? () => { setEditing(null); setFormOpen(true); } : undefined}
      rowActions={{
        onEdit: can(PERMISSIONS.FOOD_ITEM.UPDATE) ? (r) => { setEditing(r); setFormOpen(true); } : undefined,
        editDisabledReason: lockedReason,
        onDelete: can(PERMISSIONS.FOOD_ITEM.DELETE)
          ? async (r) => {
              await deleteMutation.mutateAsync(r.id);
              toast.success(tc("messages.deleted", { entity: t("entity") }));
            }
          : undefined,
        protectedReason: lockedReason,
        deleteTitle: (r) => tc("messages.deleteTitle", { entity: t("entity"), name: r.name }),
      }}
      bulkActions={bulkActions}
      onExport={can(PERMISSIONS.FOOD_ITEM.EXPORT) ? openExport : undefined}
    >
      <FoodFormModal
        open={formOpen}
        editing={editing}
        canSetSystemData={isSuperUser}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      {exportModal}
    </ListPage>
  );
}

export default FoodsView;
