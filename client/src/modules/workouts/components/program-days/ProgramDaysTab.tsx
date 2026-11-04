"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/feedback/confirm";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { useUpdateWorkoutProgramMutation } from "../../hooks/useWorkoutProgramsQuery";
import type { WorkoutProgramItem } from "../../types";
import { DayEditorCard } from "./DayEditorCard";
import { DaysReadView } from "./DaysReadView";
import { toDaysPayload, toFormValues, type DaysFormValues } from "./daysUtils";

/** Tab "Buổi tập": xem cây buổi tập -> bài tập; có quyền sửa thì chuyển sang chế độ sửa cả khối (Lưu / Hủy). */
export function ProgramDaysTab({ program, canEdit }: { program: WorkoutProgramItem; canEdit: boolean }) {
  const t = useTranslations("workouts");
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {canEdit && program.days.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> {t("days.edit")}
            </Button>
          </div>
        )}
        <DaysReadView
          days={program.days}
          emptyActionText={canEdit ? t("days.addDay") : undefined}
          onEmptyAction={canEdit ? () => setEditing(true) : undefined}
        />
      </div>
    );
  }
  return <ProgramDaysEditor program={program} onDone={() => setEditing(false)} />;
}

function ProgramDaysEditor({ program, onDone }: { program: WorkoutProgramItem; onDone: () => void }) {
  const t = useTranslations("workouts");
  const tc = useTranslations("common");
  const confirm = useConfirm();
  const updateMutation = useUpdateWorkoutProgramMutation();
  const form = useForm<DaysFormValues>({
    defaultValues: program.days.length ? toFormValues(program.days) : { days: [{ day_label: "", day_of_week: "", exercises: [] }] },
  });
  const days = useFieldArray({ control: form.control, name: "days" });
  const { isDirty, isSubmitting } = form.formState;

  const cancel = async () => {
    if (isDirty && !(await confirm({ title: t("days.discardTitle"), confirmText: t("days.discard"), danger: true }))) return;
    onDone();
  };

  const save = form.handleSubmit(async (values) => {
    const missing = values.days.some((d) => d.exercises.some((e) => !e.exercise && !e.exercise_name.trim()));
    if (missing) {
      toast.error(t("days.exerciseRequired"));
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: program.id, data: { days: toDaysPayload(values) } });
      toast.success(t("days.saved"));
      onDone();
    } catch (error) {
      toast.error(extractErrorMessage(error, tc("messages.saveError")));
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={save} className="flex flex-col gap-3">
        {days.fields.map((field, index) => (
          <DayEditorCard key={field.id} index={index} total={days.fields.length} onMove={days.move} onRemove={() => days.remove(index)} />
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => days.append({ day_label: "", day_of_week: "", exercises: [] })}>
            <Plus /> {t("days.addDay")}
          </Button>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" onClick={cancel} disabled={isSubmitting}>
              {tc("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tc("status.saving") : tc("actions.save")}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
