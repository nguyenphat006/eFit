"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/controls/Combobox";
import { NumberInput } from "@/components/controls/NumberInput";
import { ExercisePicker } from "./ExercisePicker";
import { EMPTY_EXERCISE, WEEKDAYS, type DaysFormValues } from "./daysUtils";

interface DayEditorCardProps {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}

/** Một buổi tập đang sửa: tên, thứ trong tuần, danh sách bài tập (thêm / bỏ / đổi thứ tự). */
export function DayEditorCard({ index, total, onMove, onRemove }: DayEditorCardProps) {
  const t = useTranslations("workouts");
  const tv = useTranslations("validation");
  const { control, register, formState, setValue } = useFormContext<DaysFormValues>();
  const exercises = useFieldArray({ control, name: `days.${index}.exercises` });
  const dayErrors = formState.errors.days?.[index];
  const weekdayOptions = WEEKDAYS.map((d) => ({ value: String(d), label: t(`weekday.${d}`) }));

  return (
    <section className="flex flex-col gap-3 rounded-lg p-3" style={{ background: "var(--c-bg-subtle)" }}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <Input
            aria-label={t("days.dayLabel")}
            placeholder={t("days.dayLabelPlaceholder")}
            aria-invalid={Boolean(dayErrors?.day_label)}
            {...register(`days.${index}.day_label`, { required: tv("required", { field: t("days.dayLabel") }) })}
          />
          {dayErrors?.day_label && <span className="text-xs text-destructive">{dayErrors.day_label.message}</span>}
        </div>
        <div className="w-40">
          <Controller
            control={control}
            name={`days.${index}.day_of_week`}
            render={({ field }) => (
              <Combobox
                options={weekdayOptions}
                value={field.value || null}
                onChange={(v) => field.onChange(v ?? "")}
                placeholder={t("days.dayOfWeek")}
                allowClear
              />
            )}
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("days.moveUp")} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("days.moveDown")} disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("days.removeDay")} className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      </div>

      {exercises.fields.length > 0 && (
        <div className="dt-scroll">
          <table className="dt">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>{t("days.exercise")}</th>
                <th style={{ width: 80 }}>{t("days.sets")}</th>
                <th style={{ width: 96 }}>{t("days.reps")}</th>
                <th style={{ width: 80 }}>{t("days.rpe")}</th>
                <th style={{ width: 88 }}>{t("days.tempo")}</th>
                <th style={{ width: 96 }}>{t("days.restSeconds")}</th>
                <th style={{ minWidth: 140 }}>{t("days.notes")}</th>
                <th style={{ width: 104 }} />
              </tr>
            </thead>
            <tbody>
              {exercises.fields.map((row, exIndex) => {
                const base = `days.${index}.exercises.${exIndex}` as const;
                return (
                  <tr key={row.id}>
                    <td>
                      <Controller
                        control={control}
                        name={`${base}.exercise`}
                        render={({ field }) => (
                          <ExercisePicker
                            value={field.value}
                            currentName={row.exercise_name}
                            onChange={(picked) => {
                              field.onChange(picked?.id ?? null);
                              if (picked) setValue(`${base}.exercise_name`, picked.name, { shouldDirty: true });
                            }}
                          />
                        )}
                      />
                      <Input
                        className="mt-1 h-8"
                        aria-label={t("days.exerciseName")}
                        placeholder={t("days.exerciseNamePlaceholder")}
                        {...register(`${base}.exercise_name`)}
                      />
                    </td>
                    <td>
                      <Controller control={control} name={`${base}.sets`} render={({ field }) => <NumberInput aria-label={t("days.sets")} min={1} max={50} value={field.value} onChange={field.onChange} />} />
                    </td>
                    <td>
                      <Input aria-label={t("days.reps")} {...register(`${base}.reps`)} />
                    </td>
                    <td>
                      <Controller control={control} name={`${base}.target_rpe`} render={({ field }) => <NumberInput aria-label={t("days.rpe")} min={5} max={10} value={field.value} onChange={field.onChange} />} />
                    </td>
                    <td>
                      <Input aria-label={t("days.tempo")} placeholder="3-1-1-0" {...register(`${base}.tempo`)} />
                    </td>
                    <td>
                      <Controller control={control} name={`${base}.rest_seconds`} render={({ field }) => <NumberInput aria-label={t("days.restSeconds")} min={0} value={field.value} onChange={field.onChange} />} />
                    </td>
                    <td>
                      <Input aria-label={t("days.notes")} {...register(`${base}.notes`)} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("days.moveUp")} disabled={exIndex === 0} onClick={() => exercises.move(exIndex, exIndex - 1)}>
                          <ArrowUp />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("days.moveDown")} disabled={exIndex === exercises.fields.length - 1} onClick={() => exercises.move(exIndex, exIndex + 1)}>
                          <ArrowDown />
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={t("days.removeExercise")} className="text-destructive hover:text-destructive" onClick={() => exercises.remove(exIndex)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => exercises.append({ ...EMPTY_EXERCISE })}>
          <Plus /> {t("days.addExercise")}
        </Button>
      </div>
    </section>
  );
}
