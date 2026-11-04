"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { StatusBadge, statusOptions } from "@/components/common/StatusBadge";
import { ListPage, RelativeTime, defineColumns, remoteSource, useExcelExport, useListState, type BulkAction } from "@/components/list";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { planningOptionSources } from "@/modules/workouts";
import type { Schemas } from "@/types/api";
import { AssignTemplateModal } from "./components/AssignTemplateModal";
import { SeasonFormModal } from "./components/SeasonFormModal";
import {
  useAssignSeasonMutation,
  useBatchDeleteSeasonsMutation,
  useCreateSeasonMutation,
  useDeleteSeasonMutation,
  useSeasonsList,
  useUpdateSeasonMutation,
} from "./hooks/useSeasonsQuery";
import { FITNESS_GOAL, SEASON_KIND, SEASON_STATUS } from "./statusMap";
import { DELETABLE_STATUSES, type SeasonCreateInput, type SeasonListItem } from "./types";

/** Danh sách mùa giải (gồm mùa mẫu) — lọc theo học viên qua `?client=<id>`. */
export function SeasonsView() {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const router = useRouter();
  const { can } = usePermission();
  const list = useListState({ defaultOrdering: "-updated_at" });
  const query = useSeasonsList(list.params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SeasonListItem | null>(null);
  const [assigning, setAssigning] = useState<SeasonListItem | null>(null);

  const createMutation = useCreateSeasonMutation();
  const updateMutation = useUpdateSeasonMutation();
  const deleteMutation = useDeleteSeasonMutation();
  const assignMutation = useAssignSeasonMutation();
  const batchDelete = useBatchDeleteSeasonsMutation();

  const { openExport, exportModal } = useExcelExport({
    endpoint: "/seasons/",
    label: t("title"),
    list,
    total: query.data?.count ?? 0,
    preview: query.data?.results,
  });

  const filteredClientId = Number(list.filters.client) || null;
  const defaultClient = useMemo(() => {
    if (!filteredClientId) return null;
    const row = query.data?.results.find((r) => r.client === filteredClientId);
    return { id: filteredClientId, name: row?.client_name || `#${filteredClientId}` };
  }, [filteredClientId, query.data]);

  const columns = useMemo(
    () =>
      defineColumns<SeasonListItem>([
        { key: "name", title: t("fields.name"), width: 240, pinned: "left", hideable: false, sortable: true, filter: { type: "text" }, link: (r) => `/seasons/${r.id}` },
        {
          key: "status",
          title: tc("fields.status"),
          width: 130,
          sortable: true,
          filter: { type: "multiSelect", options: statusOptions(SEASON_STATUS, tr) },
          render: (v) => <StatusBadge map={SEASON_STATUS} value={v} />,
        },
        {
          key: "client_name",
          title: t("fields.client"),
          width: 190,
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
        {
          key: "goal_type",
          title: t("fields.goal"),
          width: 140,
          filter: { type: "multiSelect", options: statusOptions(FITNESS_GOAL, tr) },
          render: (v) => <StatusBadge map={FITNESS_GOAL} value={v} />,
        },
        { key: "start_date", title: t("fields.startDate"), width: 120, sortable: true },
        { key: "end_date", title: t("fields.endDate"), width: 120, sortable: true },
        { key: "phase_count", title: t("fields.phaseCount"), width: 100, align: "right" },
        {
          key: "is_template",
          title: t("fields.kind"),
          width: 120,
          filter: { type: "select", options: statusOptions(SEASON_KIND, tr) },
          render: (v) => <StatusBadge map={SEASON_KIND} value={v} />,
        },
        { key: "owner_name", title: t("fields.owner"), width: 160, defaultHidden: true },
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

  const handleSubmit = async (values: SeasonCreateInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: values });
      toast.success(tc("messages.updated", { entity: t("entity") }));
      setFormOpen(false);
      return;
    }
    const created = await createMutation.mutateAsync(values);
    toast.success(tc("messages.created", { entity: t("entity") }));
    setFormOpen(false);
    router.push(`/seasons/${created.id}`);
  };

  const showBatchResult = (res: { message: string; data: { skipped?: unknown[] } }) =>
    res.data.skipped?.length ? toast.warning(res.message) : toast.success(res.message);

  const bulkActions: BulkAction[] = can(PERMISSIONS.SEASON.DELETE)
    ? [
        {
          key: "delete",
          label: tc("actions.delete"),
          icon: <Trash2 />,
          danger: true,
          confirm: {
            title: (n: number) => tc("messages.bulkDeleteTitle", { count: n, entity: t("entity") }),
            content: t("deleteRule"),
            okText: tc("actions.delete"),
          },
          onClick: async (ids: number[]) => showBatchResult(await batchDelete.mutateAsync(ids)),
        },
      ]
    : [];

  return (
    <ListPage<SeasonListItem>
      moduleCode="SEASON"
      tableKey="seasons-table"
      list={list}
      query={query}
      columns={columns}
      entityLabel={t("entity")}
      searchPlaceholder={t("searchPlaceholder")}
      onCreate={can(PERMISSIONS.SEASON.CREATE) ? () => { setEditing(null); setFormOpen(true); } : undefined}
      rowActions={{
        onEdit: can(PERMISSIONS.SEASON.UPDATE) ? (r) => { setEditing(r); setFormOpen(true); } : undefined,
        onDelete: can(PERMISSIONS.SEASON.DELETE)
          ? async (r) => {
              await deleteMutation.mutateAsync(r.id);
              toast.success(tc("messages.deleted", { entity: t("entity") }));
            }
          : undefined,
        deleteTitle: (r) => tc("messages.deleteTitle", { entity: t("entity"), name: r.name }),
        protectedReason: (r) => (DELETABLE_STATUSES.includes(r.status) ? null : t("deleteRule")),
        more: can(PERMISSIONS.SEASON.CREATE)
          ? (r) => (r.is_template ? [{ key: "assign", label: t("assign.action"), icon: <UserPlus />, onClick: () => setAssigning(r) }] : [])
          : undefined,
      }}
      bulkActions={bulkActions}
      onExport={can(PERMISSIONS.SEASON.EXPORT) ? openExport : undefined}
    >
      <SeasonFormModal open={formOpen} editing={editing} defaultClient={defaultClient} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <AssignTemplateModal
        open={!!assigning}
        template={assigning}
        onCancel={() => setAssigning(null)}
        onSubmit={async (values) => {
          const created = await assignMutation.mutateAsync(values);
          toast.success(t("assign.done"));
          setAssigning(null);
          router.push(`/seasons/${created.id}`);
        }}
      />
      {exportModal}
    </ListPage>
  );
}

export default SeasonsView;
