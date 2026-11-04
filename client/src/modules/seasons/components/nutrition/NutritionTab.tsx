"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/feedback/confirm";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { useGenerateNutritionPlanMutation, useNutritionPlan, useSaveNutritionPlanMutation } from "../../hooks/useSeasonsQuery";
import { foodOptionSources } from "../../services/season.service";
import type { NutritionPlanItem, PhaseItem, SeasonItem } from "../../types";
import { PhasePicker } from "../PhasePicker";
import { MealEditorCard } from "./MealEditorCard";
import { emptyMeal, formValuesToPayload, planToFormValues, type PlanFormValues } from "./planUtils";
import { PlanReadView } from "./PlanReadView";

const GENERATED_MEALS = 4;

/** Tab "Thực đơn": chọn giai đoạn → xem / sửa / sinh gợi ý thực đơn theo macro mục tiêu của giai đoạn. */
export function NutritionTab({ season, canEdit }: { season: SeasonItem; canEdit: boolean }) {
  const t = useTranslations("seasons");
  const [phaseId, setPhaseId] = useState<number | null>(season.phases[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const phase = season.phases.find((p) => p.id === phaseId) ?? null;

  if (!season.phases.length) return <EmptyState description={t("phases.empty")} />;
  return (
    <div className="flex flex-col gap-4">
      <PhasePicker phases={season.phases} value={phaseId} disabled={editing} onChange={setPhaseId} />
      {phase && (editing ? <PlanEditor phase={phase} onDone={() => setEditing(false)} /> : <PlanPanel phase={phase} canEdit={canEdit} onEdit={() => setEditing(true)} />)}
    </div>
  );
}

function PlanPanel({ phase, canEdit, onEdit }: { phase: PhaseItem; canEdit: boolean; onEdit: () => void }) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const confirm = useConfirm();
  const query = useNutritionPlan(phase.id);
  const generate = useGenerateNutritionPlanMutation();
  const plan = query.data;

  const runGenerate = () =>
    confirm({
      title: t("nutrition.generateTitle"),
      description: plan ? t("nutrition.generateReplace", { count: GENERATED_MEALS }) : t("nutrition.generateHint", { count: GENERATED_MEALS }),
      confirmText: t("nutrition.generate"),
      onConfirm: async () => {
        try {
          await generate.mutateAsync({ phaseId: phase.id, mealCount: GENERATED_MEALS });
          toast.success(t("nutrition.generated"));
        } catch (error) {
          toast.error(extractErrorMessage(error));
          throw error;
        }
      },
    });

  if (query.isLoading) return <Skeleton className="h-48 w-full" />;
  if (query.isError) return <EmptyState description={tc("messages.loadError")} actionText={tc("actions.retry")} onAction={() => query.refetch()} />;

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={runGenerate} disabled={generate.isPending}>
            <Sparkles /> {t("nutrition.generate")}
          </Button>
          {plan && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil /> {t("nutrition.edit")}
            </Button>
          )}
        </div>
      )}
      {plan ? (
        <PlanReadView plan={plan} phase={phase} />
      ) : (
        <EmptyState description={t("nutrition.empty")} actionText={canEdit ? t("nutrition.create") : undefined} onAction={canEdit ? onEdit : undefined} />
      )}
    </div>
  );
}

function PlanEditor({ phase, onDone }: { phase: PhaseItem; onDone: () => void }) {
  const query = useNutritionPlan(phase.id);
  if (query.isLoading) return <Skeleton className="h-48 w-full" />;
  return <PlanEditorForm phase={phase} plan={query.data ?? null} onDone={onDone} />;
}

function PlanEditorForm({ phase, plan, onDone }: { phase: PhaseItem; plan: NutritionPlanItem | null; onDone: () => void }) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const confirm = useConfirm();
  const save = useSaveNutritionPlanMutation();
  const form = useForm<PlanFormValues>({ defaultValues: plan ? planToFormValues(plan) : { notes: "", meals: [emptyMeal(t("nutrition.mealDefault", { n: 1 }))] } });
  const meals = useFieldArray({ control: form.control, name: "meals" });
  const { isDirty, isSubmitting } = form.formState;
  const categories = useQuery({ queryKey: ["food-categories", "all-active"], queryFn: foodOptionSources.categories, staleTime: 5 * 60_000 });
  const categoryOptions = useMemo(
    () => (categories.data?.results ?? []).map((c) => ({ value: String(c.id), label: c.category_name, code: c.category_code })),
    [categories.data],
  );

  const cancel = async () => {
    if (isDirty && !(await confirm({ title: t("nutrition.discardTitle"), confirmText: t("nutrition.discard"), danger: true }))) return;
    onDone();
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ phaseId: phase.id, data: formValuesToPayload(values) });
      toast.success(t("nutrition.saved"));
      onDone();
    } catch (error) {
      toast.error(extractErrorMessage(error, tc("messages.saveError")));
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {meals.fields.map((field, index) => (
          <MealEditorCard
            key={field.id}
            index={index}
            total={meals.fields.length}
            categoryOptions={categoryOptions}
            onMove={meals.move}
            onRemove={() => meals.remove(index)}
          />
        ))}
        <Textarea aria-label={t("nutrition.notes")} placeholder={t("nutrition.notes")} rows={2} {...form.register("notes")} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => meals.append(emptyMeal(t("nutrition.mealDefault", { n: meals.fields.length + 1 })))}>
            <Plus /> {t("nutrition.addMeal")}
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
