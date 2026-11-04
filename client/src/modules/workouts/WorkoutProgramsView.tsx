"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CircleCheck, Copy, Trash2 } from "lucide-react";
import { ACTIVE_STATUS, StatusBadge, statusOptions } from "@/components/common/StatusBadge";
import { ListPage, RelativeTime, defineColumns, remoteSource, useExcelExport, useListState, type BulkAction } from "@/components/list";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import type { Schemas } from "@/types/api";
import { CloneProgramModal } from "./components/CloneProgramModal";
import { WorkoutProgramFormModal } from "./components/WorkoutProgramFormModal";
import {
  useBatchDeleteWorkoutProgramsMutation,
  useBatchStatusWorkoutProgramsMutation,
  useCloneWorkoutProgramMutation,
  useCreateWorkoutProgramMutation,
  useDeleteWorkoutProgramMutation,
  useUpdateWorkoutProgramMutation,
  useWorkoutProgramsList,
} from "./hooks/useWorkoutProgramsQuery";
import { planningOptionSources } from "./services/workoutProgram.service";
import { PROGRAM_KIND } from "./statusMap";
import type { WorkoutProgramCreateInput, WorkoutProgramListItem } from "./types";

/** Danh sách giáo án tập (gồm giáo án mẫu) — lọc theo học viên qua `?client=<id>`. */
export function WorkoutProgramsView() {
  const t = useTranslations("workouts");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const router = useRouter();
  const { can } = usePermission();
  const list = useListState({ defaultOrdering: "-updated_at" });
  const query = useWorkoutProgramsList(list.params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkoutProgramListItem | null>(null);
  const [cloning, setCloning] = useState<WorkoutProgramListItem | null>(null);

  const createMutation = useCreateWorkoutProgramMutation();
  const updateMutation = useUpdateWorkoutProgramMutation();
  const deleteMutation = useDeleteWorkoutProgramMutation();
  const cloneMutation = useCloneWorkoutProgramMutation();
  const batchDelete = useBatchDeleteWorkoutProgramsMutation();
  const batchStatus = useBatchStatusWorkoutProgramsMutation();

  const { openExport, exportModal } = useExcelExport({
    endpoint: "/workout-programs/",
    label: t("title"),
    list,
    total: query.data?.count ?? 0,
    preview: query.data?.results,
  });

  const columns = useMemo(
    () =>
      defineColumns<WorkoutProgramListItem>([
        { key: "name", title: t("fields.name"), width: 260, pinned: "left", hideable: false, sortable: true, filter: { type: "text" }, link: (r) => `/workouts/${r.id}` },
        {
          key: "is_template",
          title: t("fields.kind"),
          width: 130,
          filter: { type: "select", options: statusOptions(PROGRAM_KIND, tr) },
          render: (v) => <StatusBadge map={PROGRAM_KIND} value={v} />,
        },
        {
          key: "client_name",
          title: t("fields.client"),
          width: 200,
          filterField: "client",
          filter: {
            type: "remote",
            source: remoteSource<Schemas["Client"]>({
              queryKey: ["clients", "filter"],
              fetchPage: planningOptionSources.clients,
              toOption: (c) => ({ value: String(c.id), label: c.full_name }),
            }),
          },
          render: (v) => v || <span className="text-muted-foreground">{t("fields.noClient")}</span>,
        },
        { key: "frequency_per_week", title: t("fields.frequency"), width: 120, align: "right", sortable: true, filter: { type: "number" } },
        { key: "day_count", title: t("fields.dayCount"), width: 100, align: "right" },
        { key: "start_date", title: t("fields.startDate"), width: 120, sortable: true, defaultHidden: true },
        { key: "end_date", title: t("fields.endDate"), width: 120, defaultHidden: true },
        { key: "owner_name", title: t("fields.owner"), width: 160, defaultHidden: true },
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

  const handleSubmit = async (values: Partial<WorkoutProgramCreateInput>) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: values });
      toast.success(tc("messages.updated", { entity: t("entity") }));
      setFormOpen(false);
      return;
    }
    const created = await createMutation.mutateAsync(values as WorkoutProgramCreateInput);
    toast.success(tc("messages.created", { entity: t("entity") }));
    setFormOpen(false);
    router.push(`/workouts/${created.id}`);
  };

  const showBatchResult = (res: { message: string; data: { skipped?: unknown[] } }) =>
    res.data.skipped?.length ? toast.warning(res.message) : toast.success(res.message);

  const bulkActions: BulkAction[] = [
    ...(can(PERMISSIONS.WORKOUT_PROGRAM.UPDATE)
      ? [
          { key: "activate", label: tc("actions.activate"), icon: <CircleCheck />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: true })) },
          { key: "deactivate", label: tc("actions.deactivate"), icon: <Ban />, onClick: async (ids: number[]) => showBatchResult(await batchStatus.mutateAsync({ ids, isActive: false })) },
        ]
      : []),
    ...(can(PERMISSIONS.WORKOUT_PROGRAM.DELETE)
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
    <ListPage<WorkoutProgramListItem>
      moduleCode="WORKOUT_PROGRAM"
      tableKey="workout-programs-table"
      list={list}
      query={query}
      columns={columns}
      entityLabel={t("entity")}
      searchPlaceholder={t("searchPlaceholder")}
      onCreate={can(PERMISSIONS.WORKOUT_PROGRAM.CREATE) ? () => { setEditing(null); setFormOpen(true); } : undefined}
      rowActions={{
        onEdit: can(PERMISSIONS.WORKOUT_PROGRAM.UPDATE) ? (r) => { setEditing(r); setFormOpen(true); } : undefined,
        onDelete: can(PERMISSIONS.WORKOUT_PROGRAM.DELETE)
          ? async (r) => {
              await deleteMutation.mutateAsync(r.id);
              toast.success(tc("messages.deleted", { entity: t("entity") }));
            }
          : undefined,
        deleteTitle: (r) => tc("messages.deleteTitle", { entity: t("entity"), name: r.name }),
        more: can(PERMISSIONS.WORKOUT_PROGRAM.CREATE)
          ? (r) => [{ key: "clone", label: t("clone.action"), icon: <Copy />, onClick: () => setCloning(r) }]
          : undefined,
      }}
      bulkActions={bulkActions}
      onExport={can(PERMISSIONS.WORKOUT_PROGRAM.EXPORT) ? openExport : undefined}
    >
      <WorkoutProgramFormModal open={formOpen} editing={editing} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <CloneProgramModal
        open={!!cloning}
        sourceName={cloning?.name ?? ""}
        onCancel={() => setCloning(null)}
        onSubmit={async (values) => {
          if (!cloning) return;
          const created = await cloneMutation.mutateAsync({ id: cloning.id, data: values });
          toast.success(t("clone.done"));
          setCloning(null);
          router.push(`/workouts/${created.id}`);
        }}
      />
      {exportModal}
    </ListPage>
  );
}

export default WorkoutProgramsView;
