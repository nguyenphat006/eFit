"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, CircleCheck, Trash2 } from "lucide-react";
import { ACTIVE_STATUS, StatusBadge, statusOptions } from "@/components/common/StatusBadge";
import { ListPage, RelativeTime, defineColumns, useExcelExport, useListState, type BulkAction, type FilterOption } from "@/components/list";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { ExerciseFormModal } from "./components/ExerciseFormModal";
import {
  useBatchDeleteExercisesMutation,
  useBatchStatusExercisesMutation,
  useCreateExerciseMutation,
  useDeleteExerciseMutation,
  useExercisesList,
  useUpdateExerciseMutation,
} from "./hooks/useExercisesQuery";
import { exerciseService } from "./services/exercise.service";
import type { ExerciseCreateInput, ExerciseFilterOptions, ExerciseItem } from "./types";

const DETAIL_HREF = "/library/exercises/";

/** Bộ lọc chọn nhiều lấy giá trị phân biệt từ API khi mở (không tải sẵn lúc vào trang) */
function distinctOptions(field: keyof ExerciseFilterOptions) {
  return async (search: string): Promise<FilterOption[]> => {
    const data = await exerciseService.getFilterOptions();
    const q = search.trim().toLowerCase();
    return data[field].filter((v) => !q || v.toLowerCase().includes(q)).map((v) => ({ value: v, label: v }));
  };
}

/** Thư viện bài tập dùng chung — danh sách + bộ lọc theo vùng cơ, dụng cụ, cơ mục tiêu. */
export function ExercisesView() {
  const t = useTranslations("exercises");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const { can } = usePermission();
  const list = useListState({ defaultOrdering: "name" });
  const query = useExercisesList(list.params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseItem | null>(null);

  const createMutation = useCreateExerciseMutation();
  const updateMutation = useUpdateExerciseMutation();
  const deleteMutation = useDeleteExerciseMutation();
  const batchDelete = useBatchDeleteExercisesMutation();
  const batchStatus = useBatchStatusExercisesMutation();

  const { openExport, exportModal } = useExcelExport({
    endpoint: "/exercises/",
    label: t("title"),
    list,
    total: query.data?.count ?? 0,
    preview: query.data?.results,
  });

  const columns = useMemo(
    () =>
      defineColumns<ExerciseItem>([
        {
          key: "name",
          title: t("fields.name"),
          width: 260,
          pinned: "left",
          hideable: false,
          sortable: true,
          filter: { type: "text" },
          link: (r) => `${DETAIL_HREF}${r.id}`,
        },
        { key: "target", title: t("fields.target"), width: 160, sortable: true, filter: { type: "remote", fetchOptions: distinctOptions("target") } },
        { key: "body_part", title: t("fields.bodyPart"), width: 150, sortable: true, filter: { type: "remote", fetchOptions: distinctOptions("body_part") } },
        { key: "equipment", title: t("fields.equipment"), width: 160, sortable: true, filter: { type: "remote", fetchOptions: distinctOptions("equipment") } },
        { key: "category", title: t("fields.category"), width: 140, sortable: true, defaultHidden: true, filter: { type: "remote", fetchOptions: distinctOptions("category") } },
        { key: "muscle_group", title: t("fields.muscleGroup"), width: 160, defaultHidden: true },
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
          filter: { type: "date" },
          render: (v, r) => <RelativeTime value={v} by={r.updated_by_name} />,
        },
      ]),
    [t, tc, tr],
  );

  const handleSubmit = async (values: ExerciseCreateInput) => {
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
    ...(can(PERMISSIONS.EXERCISE.UPDATE)
      ? [
          { key: "activate", label: tc("actions.activate"), icon: <CircleCheck />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: true })) },
          { key: "deactivate", label: tc("actions.deactivate"), icon: <Ban />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: false })) },
        ]
      : []),
    ...(can(PERMISSIONS.EXERCISE.DELETE)
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
    <ListPage<ExerciseItem>
      moduleCode="EXERCISE"
      tableKey="exercises-table"
      list={list}
      query={query}
      columns={columns}
      entityLabel={t("entity")}
      searchPlaceholder={t("searchPlaceholder")}
      onCreate={can(PERMISSIONS.EXERCISE.CREATE) ? () => { setEditing(null); setFormOpen(true); } : undefined}
      rowActions={{
        onEdit: can(PERMISSIONS.EXERCISE.UPDATE) ? (r) => { setEditing(r); setFormOpen(true); } : undefined,
        onDelete: can(PERMISSIONS.EXERCISE.DELETE)
          ? async (r) => {
              await deleteMutation.mutateAsync(r.id);
              toast.success(tc("messages.deleted", { entity: t("entity") }));
            }
          : undefined,
        deleteTitle: (r) => tc("messages.deleteTitle", { entity: t("entity"), name: r.name }),
      }}
      bulkActions={bulkActions}
      onExport={can(PERMISSIONS.EXERCISE.EXPORT) ? openExport : undefined}
    >
      <ExerciseFormModal open={formOpen} editing={editing} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
      {exportModal}
    </ListPage>
  );
}

export default ExercisesView;
