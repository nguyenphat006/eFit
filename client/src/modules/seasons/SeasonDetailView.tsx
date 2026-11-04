"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheck, CirclePlay, CircleSlash, Trash2, UserPlus } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailPage, type DetailAction } from "@/components/detail";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { AssignTemplateModal } from "./components/AssignTemplateModal";
import { PhaseLogsTab } from "./components/PhaseLogsTab";
import { PhasesTab } from "./components/PhasesTab";
import { SeasonFormModal } from "./components/SeasonFormModal";
import { NutritionTab } from "./components/nutrition/NutritionTab";
import {
  useAssignSeasonMutation,
  useChangeSeasonStatusMutation,
  useDeleteSeasonMutation,
  useSeasonDetail,
  useUpdateSeasonMutation,
} from "./hooks/useSeasonsQuery";
import { FITNESS_GOAL, SEASON_KIND, SEASON_STATUS } from "./statusMap";
import { DELETABLE_STATUSES, SEASON_TRANSITIONS, type SeasonItem, type SeasonStatus } from "./types";

const LIST_HREF = "/seasons";

const STATUS_ACTION_ICON: Record<SeasonStatus, React.ReactNode> = {
  DRAFT: null,
  ACTIVE: <CirclePlay />,
  COMPLETED: <CircleCheck />,
  ABANDONED: <CircleSlash />,
};

export function SeasonDetailView({ seasonId }: { seasonId: number }) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const router = useRouter();
  const { can } = usePermission();
  const query = useSeasonDetail(seasonId);
  const updateMutation = useUpdateSeasonMutation();
  const deleteMutation = useDeleteSeasonMutation();
  const statusMutation = useChangeSeasonStatusMutation();
  const assignMutation = useAssignSeasonMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const canUpdate = can(PERMISSIONS.SEASON.UPDATE);
  const season = query.data;

  const statusActions = (s: SeasonItem): DetailAction[] =>
    s.is_template
      ? []
      : SEASON_TRANSITIONS[s.status].map((next) => ({
          key: `status-${next}`,
          label: t(`statusAction.${next}` as "statusAction.ACTIVE"),
          icon: STATUS_ACTION_ICON[next],
          confirm: { title: t(`statusConfirm.${next}` as "statusConfirm.ACTIVE", { name: s.name }), okText: t(`statusAction.${next}` as "statusAction.ACTIVE") },
          onClick: canUpdate
            ? async () => {
                await statusMutation.mutateAsync({ id: s.id, status: next });
                toast.success(t("statusChanged"));
              }
            : undefined,
        }));

  return (
    <DetailPage<SeasonItem>
      query={query}
      backHref={LIST_HREF}
      entityLabel={t("entity")}
      hero={(s) => ({
        title: s.name,
        badges: [
          <StatusBadge key="status" map={s.is_template ? SEASON_KIND : SEASON_STATUS} value={s.is_template ? s.is_template : s.status} />,
          <StatusBadge key="goal" map={FITNESS_GOAL} value={s.goal_type} />,
        ],
        subtitle: [
          s.client_name || t("fields.noClient"),
          t("phases.periodValue", { start: s.start_date, end: s.end_date }),
          t("fields.phaseCountValue", { count: s.phases.length }),
        ],
        updatedAt: s.updated_at,
        updatedBy: s.updated_by_name,
        fields: [
          { label: t("fields.owner"), value: s.owner_name },
          { label: t("fields.source"), value: s.source_season_name || "—" },
          { label: tc("fields.description"), value: s.description, wide: true },
        ],
      })}
      onEdit={canUpdate ? () => setEditOpen(true) : undefined}
      moreActions={(s) => [
        ...statusActions(s),
        ...(s.is_template
          ? [{ key: "assign", label: t("assign.action"), icon: <UserPlus />, onClick: can(PERMISSIONS.SEASON.CREATE) ? () => setAssignOpen(true) : undefined }]
          : []),
        {
          key: "delete",
          label: tc("actions.delete"),
          icon: <Trash2 />,
          danger: true,
          disabledReason: DELETABLE_STATUSES.includes(s.status) ? null : t("deleteRule"),
          confirm: { title: tc("messages.deleteTitle", { entity: t("entity"), name: s.name }), content: tc("messages.deleteIrreversible"), okText: tc("actions.delete") },
          onClick: can(PERMISSIONS.SEASON.DELETE)
            ? async () => {
                await deleteMutation.mutateAsync(s.id);
                toast.success(tc("messages.deleted", { entity: t("entity") }));
                router.push(LIST_HREF);
              }
            : undefined,
        },
      ]}
      tabs={(s) => [
        { key: "phases", label: t("tabs.phases"), children: <PhasesTab season={s} canEdit={canUpdate} /> },
        { key: "nutrition", label: t("tabs.nutrition"), children: <NutritionTab season={s} canEdit={canUpdate} /> },
        ...(s.is_template ? [] : [{ key: "logs", label: t("tabs.logs"), children: <PhaseLogsTab season={s} /> }]),
      ]}
      audit={{ model: "seasons.season", objectId: seasonId }}
    >
      {season && (
        <>
          <SeasonFormModal
            open={editOpen}
            editing={season}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (values) => {
              await updateMutation.mutateAsync({ id: season.id, data: values });
              toast.success(tc("messages.updated", { entity: t("entity") }));
              setEditOpen(false);
            }}
          />
          <AssignTemplateModal
            open={assignOpen}
            template={season}
            onCancel={() => setAssignOpen(false)}
            onSubmit={async (values) => {
              const created = await assignMutation.mutateAsync(values);
              toast.success(t("assign.done"));
              setAssignOpen(false);
              router.push(`/seasons/${created.id}`);
            }}
          />
        </>
      )}
    </DetailPage>
  );
}

export default SeasonDetailView;
