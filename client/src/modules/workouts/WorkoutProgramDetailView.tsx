"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { ACTIVE_STATUS, StatusBadge } from "@/components/common/StatusBadge";
import { DetailPage } from "@/components/detail";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { CloneProgramModal } from "./components/CloneProgramModal";
import { WorkoutProgramFormModal } from "./components/WorkoutProgramFormModal";
import { ProgramDaysTab } from "./components/program-days/ProgramDaysTab";
import {
  useCloneWorkoutProgramMutation,
  useDeleteWorkoutProgramMutation,
  useUpdateWorkoutProgramMutation,
  useWorkoutProgramDetail,
} from "./hooks/useWorkoutProgramsQuery";
import { PROGRAM_KIND } from "./statusMap";
import type { WorkoutProgramCreateInput, WorkoutProgramItem } from "./types";

const LIST_HREF = "/workouts";

export function WorkoutProgramDetailView({ programId }: { programId: number }) {
  const t = useTranslations("workouts");
  const tc = useTranslations("common");
  const router = useRouter();
  const { can } = usePermission();
  const query = useWorkoutProgramDetail(programId);
  const updateMutation = useUpdateWorkoutProgramMutation();
  const deleteMutation = useDeleteWorkoutProgramMutation();
  const cloneMutation = useCloneWorkoutProgramMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const canUpdate = can(PERMISSIONS.WORKOUT_PROGRAM.UPDATE);
  const program = query.data;

  return (
    <DetailPage<WorkoutProgramItem>
      query={query}
      backHref={LIST_HREF}
      entityLabel={t("entity")}
      hero={(p) => ({
        title: p.name,
        badges: [
          <StatusBadge key="kind" map={PROGRAM_KIND} value={p.is_template} />,
          <StatusBadge key="active" map={ACTIVE_STATUS} value={p.is_active} />,
        ],
        subtitle: [
          p.client_name || t("fields.noClient"),
          t("fields.frequencyValue", { count: p.frequency_per_week }),
          t("days.dayCount", { count: p.days.length }),
        ],
        updatedAt: p.updated_at,
        updatedBy: p.updated_by_name,
        fields: [
          { label: t("fields.startDate"), value: p.start_date || "—" },
          { label: t("fields.endDate"), value: p.end_date || "—" },
          { label: t("fields.owner"), value: p.owner_name },
          { label: t("fields.source"), value: p.source_program_name || "—" },
          { label: t("fields.notes"), value: p.notes, wide: true },
        ],
      })}
      onEdit={canUpdate ? () => setEditOpen(true) : undefined}
      moreActions={(p) => [
        { key: "clone", label: t("clone.action"), icon: <Copy />, onClick: can(PERMISSIONS.WORKOUT_PROGRAM.CREATE) ? () => setCloneOpen(true) : undefined },
        {
          key: "delete",
          label: tc("actions.delete"),
          icon: <Trash2 />,
          danger: true,
          confirm: { title: tc("messages.deleteTitle", { entity: t("entity"), name: p.name }), content: tc("messages.deleteIrreversible"), okText: tc("actions.delete") },
          onClick: can(PERMISSIONS.WORKOUT_PROGRAM.DELETE)
            ? async () => {
                await deleteMutation.mutateAsync(p.id);
                toast.success(tc("messages.deleted", { entity: t("entity") }));
                router.push(LIST_HREF);
              }
            : undefined,
        },
      ]}
      tabs={(p) => [{ key: "days", label: t("days.title"), children: <ProgramDaysTab program={p} canEdit={canUpdate} /> }]}
      audit={{ model: "workouts.workoutprogram", objectId: programId }}
    >
      {program && (
        <>
          <WorkoutProgramFormModal
            open={editOpen}
            editing={program}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (values: Partial<WorkoutProgramCreateInput>) => {
              await updateMutation.mutateAsync({ id: program.id, data: values });
              toast.success(tc("messages.updated", { entity: t("entity") }));
              setEditOpen(false);
            }}
          />
          <CloneProgramModal
            open={cloneOpen}
            sourceName={program.name}
            onCancel={() => setCloneOpen(false)}
            onSubmit={async (values) => {
              const created = await cloneMutation.mutateAsync({ id: program.id, data: values });
              toast.success(t("clone.done"));
              setCloneOpen(false);
              router.push(`/workouts/${created.id}`);
            }}
          />
        </>
      )}
    </DetailPage>
  );
}

export default WorkoutProgramDetailView;
