"use client";

import React, { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { ACTIVE_STATUS, StatusBadge } from "@/components/common/StatusBadge";
import { DetailPage, type HeroConfig } from "@/components/detail";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { ExerciseFormModal } from "./components/ExerciseFormModal";
import { asStringList, getInstructionSteps } from "./exerciseUtils";
import { useDeleteExerciseMutation, useExerciseDetail, useUpdateExerciseMutation } from "./hooks/useExercisesQuery";
import type { ExerciseCreateInput, ExerciseItem } from "./types";

const LIST_HREF = "/library/exercises";

function InstructionsTab({ exercise }: { exercise: ExerciseItem }) {
  const t = useTranslations("exercises");
  const locale = useLocale();
  const steps = getInstructionSteps(exercise.instructions, locale);
  if (!steps.length) return <p className="text-sm text-muted-foreground">{t("detail.noInstructions")}</p>;
  return (
    <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-relaxed">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

function MediaTab({ exercise }: { exercise: ExerciseItem }) {
  const t = useTranslations("exercises");
  if (!exercise.image_url && !exercise.video_url) return <p className="text-sm text-muted-foreground">{t("detail.noMedia")}</p>;
  return (
    <div className="space-y-4">
      {exercise.image_url && (
        // Ảnh từ nguồn ngoài (URL tùy ý) -> dùng <img> thường thay vì next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img src={exercise.image_url} alt={exercise.name} className="max-h-96 rounded-lg border object-contain" />
      )}
      {exercise.video_url && (
        <a href={exercise.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ExternalLink className="size-4" />
          {t("detail.openVideo")}
        </a>
      )}
    </div>
  );
}

export interface ExerciseDetailViewProps {
  exerciseId: number;
}

export function ExerciseDetailView({ exerciseId }: ExerciseDetailViewProps) {
  const router = useRouter();
  const t = useTranslations("exercises");
  const tc = useTranslations("common");
  const { can } = usePermission();
  const [editOpen, setEditOpen] = useState(false);

  const query = useExerciseDetail(exerciseId);
  const updateMutation = useUpdateExerciseMutation();
  const deleteMutation = useDeleteExerciseMutation();

  const hero = useCallback(
    (e: ExerciseItem): HeroConfig => ({
      title: e.name,
      image: e.image_url || null,
      badges: [<StatusBadge key="status" map={ACTIVE_STATUS} value={e.is_active} />],
      subtitle: [e.target, e.body_part, e.equipment].filter(Boolean),
      updatedAt: e.updated_at,
      updatedBy: e.updated_by_name,
      fields: [
        { label: t("fields.category"), value: e.category },
        { label: t("fields.muscleGroup"), value: e.muscle_group },
        { label: t("fields.secondaryMuscles"), value: asStringList(e.secondary_muscles).join(", ") || null },
        { label: tc("fields.createdAt"), value: e.created_at },
        { label: tc("fields.description"), value: e.description, wide: true },
      ],
    }),
    [t, tc],
  );

  const handleEditSubmit = async (values: ExerciseCreateInput) => {
    await updateMutation.mutateAsync({ id: exerciseId, data: values });
    toast.success(tc("messages.updated", { entity: t("entity") }));
    setEditOpen(false);
  };

  return (
    <DetailPage<ExerciseItem>
      query={query}
      backHref={LIST_HREF}
      entityLabel={t("entity")}
      hero={hero}
      onEdit={can(PERMISSIONS.EXERCISE.UPDATE) ? () => setEditOpen(true) : undefined}
      moreActions={(e) => [
        {
          key: "delete",
          label: tc("actions.delete"),
          icon: <Trash2 />,
          danger: true,
          confirm: {
            title: tc("messages.deleteTitle", { entity: t("entity"), name: e.name }),
            content: tc("messages.deleteIrreversible"),
            okText: tc("actions.delete"),
          },
          onClick: can(PERMISSIONS.EXERCISE.DELETE)
            ? async () => {
                await deleteMutation.mutateAsync(e.id);
                toast.success(tc("messages.deleted", { entity: t("entity") }));
                router.push(LIST_HREF);
              }
            : undefined,
        },
      ]}
      tabs={(e) => [
        { key: "instructions", label: t("detail.instructionsTab"), children: <InstructionsTab exercise={e} /> },
        { key: "media", label: t("detail.mediaTab"), children: <MediaTab exercise={e} /> },
      ]}
      attachments={{ entityType: "Exercise", entityId: exerciseId, readonly: !can(PERMISSIONS.EXERCISE.UPDATE) }}
      audit={{ model: "exercises.exercise", objectId: exerciseId }}
    >
      {query.data && (
        <ExerciseFormModal open={editOpen} editing={query.data} onCancel={() => setEditOpen(false)} onSubmit={handleEditSubmit} />
      )}
    </DetailPage>
  );
}

export default ExerciseDetailView;
