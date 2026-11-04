"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dumbbell, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useConfirm } from "@/components/feedback/confirm";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { useNumberFormat } from "@/providers/NumberFormatProvider";
import { DaysReadView } from "@/modules/workouts";
import { useCreatePhaseMutation, useDeletePhaseMutation, useRefreshSnapshotMutation, useUpdatePhaseMutation } from "../hooks/useSeasonsQuery";
import type { PhaseCreateInput, PhaseItem, SeasonItem, WorkoutSnapshot } from "../types";
import { PhaseFormModal } from "./PhaseFormModal";

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} className={danger ? "text-destructive hover:text-destructive" : "text-muted-foreground"}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Tab "Giai đoạn": danh sách giai đoạn của mùa giải, mục tiêu macro, giáo án (snapshot) — thêm / sửa / xóa khi có quyền. */
export function PhasesTab({ season, canEdit }: { season: SeasonItem; canEdit: boolean }) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const tf = useTranslations("fitness");
  const { formatNumber } = useNumberFormat();
  const confirm = useConfirm();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PhaseItem | null>(null);
  const [viewing, setViewing] = useState<PhaseItem | null>(null);
  const createMutation = useCreatePhaseMutation();
  const updateMutation = useUpdatePhaseMutation();
  const deleteMutation = useDeletePhaseMutation();
  const refreshMutation = useRefreshSnapshotMutation();

  const handleSubmit = async (values: PhaseCreateInput) => {
    if (editing) {
      // `season` không đổi được khi sửa — backend bỏ qua nếu trùng mùa giải hiện tại
      await updateMutation.mutateAsync({ id: editing.id, data: values });
      toast.success(tc("messages.updated", { entity: t("phases.entity") }));
    } else {
      await createMutation.mutateAsync(values);
      toast.success(tc("messages.created", { entity: t("phases.entity") }));
    }
    setFormOpen(false);
  };

  const remove = (phase: PhaseItem) =>
    confirm({
      title: tc("messages.deleteTitle", { entity: t("phases.entity"), name: phase.name }),
      description: t("phases.deleteHint"),
      confirmText: tc("actions.delete"),
      danger: true,
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(phase.id);
          toast.success(tc("messages.deleted", { entity: t("phases.entity") }));
        } catch (error) {
          toast.error(extractErrorMessage(error));
          throw error;
        }
      },
    });

  const refresh = async (phase: PhaseItem) => {
    try {
      await refreshMutation.mutateAsync(phase.id);
      toast.success(t("phases.snapshotRefreshed"));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const snapshot = viewing?.workout_program_snapshot as WorkoutSnapshot | null | undefined;

  return (
    <div className="flex flex-col gap-3">
      {canEdit && season.phases.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> {t("phases.createTitle")}
          </Button>
        </div>
      )}
      {season.phases.length === 0 ? (
        <EmptyState
          description={t("phases.empty")}
          actionText={canEdit ? t("phases.createTitle") : undefined}
          onAction={canEdit ? () => { setEditing(null); setFormOpen(true); } : undefined}
        />
      ) : (
        <div className="dt-scroll">
          <table className="dt">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>{t("phases.name")}</th>
                <th>{t("phases.period")}</th>
                <th className="text-right">{tf("fields.calories")}</th>
                <th className="text-right">{t("phases.macros")}</th>
                <th>{t("phases.workoutProgram")}</th>
                <th>{t("phases.nutritionPlan")}</th>
                {canEdit && <th style={{ width: 120 }} />}
              </tr>
            </thead>
            <tbody>
              {season.phases.map((phase) => (
                <tr key={phase.id}>
                  <td className="text-muted-foreground">{phase.sort_order}</td>
                  <td>
                    <div className="font-medium">{phase.name}</div>
                    {phase.description && <div className="text-xs text-muted-foreground">{phase.description}</div>}
                  </td>
                  <td className="whitespace-nowrap">{t("phases.periodValue", { start: phase.start_date, end: phase.end_date })}</td>
                  <td className="text-right">{phase.target_calories ? `${formatNumber(phase.target_calories, 0)} ${tf("units.kcal")}` : "—"}</td>
                  <td className="text-right whitespace-nowrap">
                    {phase.target_protein || phase.target_carbs || phase.target_fat
                      ? t("phases.macroValue", {
                          p: formatNumber(phase.target_protein, 0),
                          c: formatNumber(phase.target_carbs, 0),
                          f: formatNumber(phase.target_fat, 0),
                        })
                      : "—"}
                  </td>
                  <td>
                    {phase.workout_program ? (
                      <div className="flex items-center gap-1">
                        <Link href={`/workouts/${phase.workout_program}`} className="text-primary hover:underline">
                          {phase.workout_program_name}
                        </Link>
                        {phase.workout_program_snapshot != null && (
                          <IconButton label={t("phases.viewSnapshot")} onClick={() => setViewing(phase)}>
                            <Dumbbell />
                          </IconButton>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{t("phases.noWorkout")}</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge tone={phase.has_nutrition_plan ? "success" : "neutral"} label={phase.has_nutrition_plan ? t("phases.hasPlan") : t("phases.noPlan")} />
                  </td>
                  {canEdit && (
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        {phase.workout_program && (
                          <IconButton label={t("phases.refreshSnapshot")} onClick={() => refresh(phase)}>
                            <RefreshCw />
                          </IconButton>
                        )}
                        <IconButton label={tc("actions.edit")} onClick={() => { setEditing(phase); setFormOpen(true); }}>
                          <Pencil />
                        </IconButton>
                        <IconButton label={tc("actions.delete")} danger onClick={() => remove(phase)}>
                          <Trash2 />
                        </IconButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PhaseFormModal open={formOpen} season={season} editing={editing} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-[880px]">
          <DialogHeader>
            <DialogTitle>{snapshot?.name ?? viewing?.workout_program_name}</DialogTitle>
            <DialogDescription>{t("phases.snapshotHint", { phase: viewing?.name ?? "" })}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">{snapshot && <DaysReadView days={snapshot.days} />}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
