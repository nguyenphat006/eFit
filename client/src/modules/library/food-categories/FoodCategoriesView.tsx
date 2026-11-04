"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, CircleCheck, Trash2 } from "lucide-react";
import { ACTIVE_STATUS, StatusBadge, statusOptions } from "@/components/common/StatusBadge";
import { CodeText, ListPage, RelativeTime, defineColumns, useListState, type BulkAction } from "@/components/list";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { FoodCategoryFormModal } from "./components/FoodCategoryFormModal";
import {
  useBatchDeleteFoodCategoriesMutation,
  useBatchStatusFoodCategoriesMutation,
  useCreateFoodCategoryMutation,
  useDeleteFoodCategoryMutation,
  useFoodCategoriesList,
  useUpdateFoodCategoryMutation,
} from "./hooks/useFoodCategoriesQuery";
import type { FoodCategoryCreateInput, FoodCategoryItem, FoodCategoryUpdateInput } from "./types";

/** Danh mục nhóm thực phẩm — sắp theo thứ tự hiển thị; nhóm còn thực phẩm không xóa được. */
export function FoodCategoriesView() {
  const t = useTranslations("foodCategories");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const { can } = usePermission();
  const list = useListState({ defaultOrdering: "sort_order" });
  const query = useFoodCategoriesList(list.params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FoodCategoryItem | null>(null);

  const createMutation = useCreateFoodCategoryMutation();
  const updateMutation = useUpdateFoodCategoryMutation();
  const deleteMutation = useDeleteFoodCategoryMutation();
  const batchDelete = useBatchDeleteFoodCategoriesMutation();
  const batchStatus = useBatchStatusFoodCategoriesMutation();

  const columns = useMemo(
    () =>
      defineColumns<FoodCategoryItem>([
        { key: "category_code", title: tc("fields.code"), width: 150, pinned: "left", hideable: false, sortable: true, filter: { type: "text" }, render: (v) => <CodeText>{v}</CodeText> },
        { key: "category_name", title: t("fields.name"), width: 240, sortable: true, filter: { type: "text" } },
        { key: "food_count", title: t("fields.foodCount"), width: 120, align: "right" },
        { key: "sort_order", title: t("fields.sortOrder"), width: 100, align: "right", sortable: true },
        { key: "description", title: tc("fields.description"), width: 280, ellipsis: true },
        {
          key: "is_active",
          title: tc("fields.status"),
          width: 130,
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
      ]),
    [t, tc, tr],
  );

  const handleSubmit = async (values: FoodCategoryCreateInput | FoodCategoryUpdateInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: values as FoodCategoryUpdateInput });
      toast.success(tc("messages.updated", { entity: t("entity") }));
    } else {
      await createMutation.mutateAsync(values as FoodCategoryCreateInput);
      toast.success(tc("messages.created", { entity: t("entity") }));
    }
    setFormOpen(false);
  };

  const showBatchResult = (res: { message: string; data: { skipped?: unknown[] } }) =>
    res.data.skipped?.length ? toast.warning(res.message) : toast.success(res.message);

  const bulkActions: BulkAction[] = [
    ...(can(PERMISSIONS.FOOD_CATEGORY.UPDATE)
      ? [
          { key: "activate", label: tc("actions.activate"), icon: <CircleCheck />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: true })) },
          { key: "deactivate", label: tc("actions.deactivate"), icon: <Ban />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: false })) },
        ]
      : []),
    ...(can(PERMISSIONS.FOOD_CATEGORY.DELETE)
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
    <ListPage<FoodCategoryItem>
      moduleCode="FOOD_CATEGORY"
      tableKey="food-categories-table"
      list={list}
      query={query}
      columns={columns}
      entityLabel={t("entity")}
      searchPlaceholder={t("searchPlaceholder")}
      onCreate={can(PERMISSIONS.FOOD_CATEGORY.CREATE) ? () => { setEditing(null); setFormOpen(true); } : undefined}
      rowActions={{
        onEdit: can(PERMISSIONS.FOOD_CATEGORY.UPDATE) ? (r) => { setEditing(r); setFormOpen(true); } : undefined,
        onDelete: can(PERMISSIONS.FOOD_CATEGORY.DELETE)
          ? async (r) => {
              await deleteMutation.mutateAsync(r.id);
              toast.success(tc("messages.deleted", { entity: t("entity") }));
            }
          : undefined,
        protectedReason: (r) => (r.food_count > 0 ? t("protectedHasFoods") : null),
        deleteTitle: (r) => tc("messages.deleteTitle", { entity: t("entity"), name: r.category_name }),
      }}
      bulkActions={bulkActions}
    >
      <FoodCategoryFormModal open={formOpen} editing={editing} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </ListPage>
  );
}

export default FoodCategoriesView;
