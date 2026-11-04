"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { StatusBadge, statusOptions } from "@/components/common/StatusBadge";
import { ListPage, RelativeTime, defineColumns, useExcelExport, useListState, type BulkAction } from "@/components/list";
import { CLIENT_STATUS, FITNESS_GOAL, GENDER } from "@/constants/fitness";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useNumberFormat } from "@/providers/NumberFormatProvider";
import { ClientFormModal } from "./components/ClientFormModal";
import {
  useBatchDeleteClientsMutation,
  useClientsList,
  useCreateClientMutation,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from "./hooks/useClientsQuery";
import type { ClientCreateInput, ClientItem } from "./types";

const DETAIL_HREF = "/clients/";

/** Danh sách học viên — HLV chỉ thấy học viên của mình, quản trị viên thấy tất cả (lọc ở backend). */
export function ClientsView() {
  const t = useTranslations("clients");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const tr = useTranslations();
  const { can, isSuperUser } = usePermission();
  const { formatNumber } = useNumberFormat();
  const list = useListState({ defaultOrdering: "-updated_at" });
  const query = useClientsList(list.params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientItem | null>(null);

  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const deleteMutation = useDeleteClientMutation();
  const batchDelete = useBatchDeleteClientsMutation();

  const { openExport, exportModal } = useExcelExport({
    endpoint: "/clients/",
    label: t("title"),
    list,
    total: query.data?.count ?? 0,
    preview: query.data?.results,
  });

  const columns = useMemo(
    () =>
      defineColumns<ClientItem>([
        {
          key: "full_name",
          title: t("fields.fullName"),
          width: 220,
          pinned: "left",
          hideable: false,
          sortable: true,
          filter: { type: "text" },
          link: (r) => `${DETAIL_HREF}${r.id}`,
        },
        { key: "phone", title: t("fields.phone"), width: 140, filter: { type: "text" } },
        {
          key: "fitness_goal",
          title: tf("fields.goal"),
          width: 150,
          filter: { type: "multiSelect", options: statusOptions(FITNESS_GOAL, tr) },
          render: (v) => <StatusBadge map={FITNESS_GOAL} value={v} />,
        },
        {
          key: "current_weight",
          title: `${tf("fields.weight")} (${tf("units.kg")})`,
          width: 120,
          align: "right",
          sortable: true,
          render: (v) => (v == null ? "—" : formatNumber(v, 1)),
        },
        {
          key: "gender",
          title: tf("fields.gender"),
          width: 110,
          defaultHidden: true,
          filter: { type: "multiSelect", options: statusOptions(GENDER, tr) },
          render: (v) => (v ? <StatusBadge map={GENDER} value={v} /> : "—"),
        },
        { key: "coach_name", title: t("fields.coach"), width: 170, defaultHidden: !isSuperUser },
        {
          key: "status",
          title: t("fields.status"),
          width: 130,
          sortable: true,
          filter: { type: "multiSelect", options: statusOptions(CLIENT_STATUS, tr) },
          render: (v) => <StatusBadge map={CLIENT_STATUS} value={v} />,
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
    [t, tf, tc, tr, formatNumber, isSuperUser],
  );

  const handleSubmit = async (values: ClientCreateInput) => {
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

  const bulkActions: BulkAction[] = can(PERMISSIONS.CLIENT.DELETE)
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
    : [];

  return (
    <ListPage<ClientItem>
      moduleCode="CLIENT"
      tableKey="clients-table"
      list={list}
      query={query}
      columns={columns}
      entityLabel={t("entity")}
      searchPlaceholder={t("searchPlaceholder")}
      onCreate={can(PERMISSIONS.CLIENT.CREATE) ? () => { setEditing(null); setFormOpen(true); } : undefined}
      rowActions={{
        onEdit: can(PERMISSIONS.CLIENT.UPDATE) ? (r) => { setEditing(r); setFormOpen(true); } : undefined,
        onDelete: can(PERMISSIONS.CLIENT.DELETE)
          ? async (r) => {
              await deleteMutation.mutateAsync(r.id);
              toast.success(tc("messages.deleted", { entity: t("entity") }));
            }
          : undefined,
        deleteTitle: (r) => tc("messages.deleteTitle", { entity: t("entity"), name: r.full_name }),
      }}
      bulkActions={bulkActions}
      onExport={can(PERMISSIONS.CLIENT.EXPORT) ? openExport : undefined}
    >
      <ClientFormModal
        open={formOpen}
        editing={editing}
        canAssignCoach={isSuperUser}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      {exportModal}
    </ListPage>
  );
}

export default ClientsView;
