"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboOption } from "@/components/controls/Combobox";
import { NumberInput } from "@/components/controls/NumberInput";
import { macroCalories } from "../macroUtils";
import { foodOptionSources } from "../../services/season.service";
import { FoodItemPicker } from "./FoodItemPicker";
import { EMPTY_ITEM, type PlanFormValues } from "./planUtils";

const MACROS = ["target_protein", "target_carbs", "target_fat", "target_calories"] as const;

interface MealEditorCardProps {
  index: number;
  total: number;
  categoryOptions: ComboOption[];
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}

/** Một bữa đang sửa: tên + macro mục tiêu, danh sách món (nhóm, thực phẩm, khối lượng, món thay thế, macro). */
export function MealEditorCard({ index, total, categoryOptions, onMove, onRemove }: MealEditorCardProps) {
  const t = useTranslations("seasons");
  const tf = useTranslations("fitness");
  const tv = useTranslations("validation");
  const { control, register, formState } = useFormContext<PlanFormValues>();
  const items = useFieldArray({ control, name: `meals.${index}.items` });
  const mealErrors = formState.errors.meals?.[index];
  const [p, c, f] = useWatch({ control, name: [`meals.${index}.target_protein`, `meals.${index}.target_carbs`, `meals.${index}.target_fat`] });
  const kcal = macroCalories(p, c, f);
  const macroLabel = {
    target_protein: tf("fields.protein"),
    target_carbs: tf("fields.carbs"),
    target_fat: tf("fields.fat"),
    target_calories: tf("fields.calories"),
  };

  return (
    <section className="flex flex-col gap-3 rounded-lg p-3" style={{ background: "var(--c-bg-subtle)" }}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <Input
            aria-label={t("nutrition.mealName")}
            aria-invalid={Boolean(mealErrors?.name)}
            {...register(`meals.${index}.name`, { required: tv("required", { field: t("nutrition.mealName") }) })}
          />
          {mealErrors?.name && <span className="text-xs text-destructive">{mealErrors.name.message}</span>}
        </div>
        {MACROS.map((m) => (
          <div key={m} className="w-28">
            <Controller
              control={control}
              name={`meals.${index}.${m}`}
              render={({ field }) => (
                <NumberInput
                  aria-label={macroLabel[m]}
                  placeholder={m === "target_calories" && kcal ? String(kcal) : macroLabel[m]}
                  min={0}
                  value={field.value}
                  onChange={field.onChange}
                  suffix={m === "target_calories" ? tf("units.kcal") : tf("units.gram")}
                />
              )}
            />
          </div>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("nutrition.moveUp")} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("nutrition.moveDown")} disabled={index === total - 1} onClick={() => onMove(index, index + 1)}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("nutrition.removeMeal")} className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      </div>

      {items.fields.length > 0 && (
        <div className="dt-scroll">
          <table className="dt">
            <thead>
              <tr>
                <th style={{ minWidth: 150 }}>{t("nutrition.category")}</th>
                <th style={{ minWidth: 200 }}>{t("nutrition.food")}</th>
                <th style={{ minWidth: 160 }}>{t("nutrition.primaryFood")}</th>
                <th style={{ minWidth: 180 }}>{t("nutrition.alternatives")}</th>
                <th style={{ width: 88 }}>{tf("fields.protein")}</th>
                <th style={{ width: 88 }}>{tf("fields.carbs")}</th>
                <th style={{ width: 88 }}>{tf("fields.fat")}</th>
                <th style={{ width: 96 }}>{tf("fields.calories")}</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {items.fields.map((row, itemIndex) => {
                const base = `meals.${index}.items.${itemIndex}` as const;
                return (
                  <tr key={row.id}>
                    <td>
                      <Controller
                        control={control}
                        name={`${base}.food_category`}
                        rules={{ required: tv("required", { field: t("nutrition.category") }) }}
                        render={({ field, fieldState }) => (
                          <Combobox
                            options={categoryOptions}
                            value={field.value == null ? null : String(field.value)}
                            onChange={(v) => field.onChange(v === null ? null : Number(v))}
                            placeholder={t("nutrition.category")}
                            aria-invalid={Boolean(fieldState.error)}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <FoodCell mealIndex={index} itemIndex={itemIndex} />
                    </td>
                    <td>
                      <Input
                        aria-label={t("nutrition.primaryFood")}
                        placeholder={t("nutrition.primaryFoodPlaceholder")}
                        {...register(`${base}.primary_food_text`, { required: tv("required", { field: t("nutrition.primaryFood") }) })}
                      />
                    </td>
                    <td>
                      <Input aria-label={t("nutrition.alternatives")} {...register(`${base}.alternatives_text`)} />
                    </td>
                    {MACROS.map((m) => (
                      <td key={m}>
                        <Controller
                          control={control}
                          name={`${base}.${m}`}
                          render={({ field }) => <NumberInput aria-label={macroLabel[m]} min={0} value={field.value} onChange={field.onChange} />}
                        />
                      </td>
                    ))}
                    <td>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={t("nutrition.removeItem")} className="text-destructive hover:text-destructive" onClick={() => items.remove(itemIndex)}>
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => items.append({ ...EMPTY_ITEM })}>
          <Plus /> {t("nutrition.addItem")}
        </Button>
      </div>
    </section>
  );
}

/** Ô chọn thực phẩm của một món: lọc theo nhóm đang chọn; chọn xong điền sẵn nhóm + tên món chính nếu còn trống. */
function FoodCell({ mealIndex, itemIndex }: { mealIndex: number; itemIndex: number }) {
  const { control, setValue, getValues } = useFormContext<PlanFormValues>();
  const base = `meals.${mealIndex}.items.${itemIndex}` as const;
  const [categoryId, foodName] = useWatch({ control, name: [`${base}.food_category`, `${base}.food_item_name`] });
  return (
    <Controller
      control={control}
      name={`${base}.food_item`}
      render={({ field }) => (
        <FoodItemPicker
          value={field.value}
          currentName={foodName}
          categoryId={categoryId}
          onChange={(food) => {
            field.onChange(food?.id ?? null);
            if (!food) return;
            setValue(`${base}.food_item_name`, food.name);
            if (!getValues(`${base}.primary_food_text`).trim()) setValue(`${base}.primary_food_text`, food.name, { shouldDirty: true });
            // Chưa chọn nhóm -> lấy nhóm của thực phẩm vừa chọn
            if (getValues(`${base}.food_category`) == null) {
              foodOptionSources.food(food.id).then((item) => setValue(`${base}.food_category`, item.category, { shouldDirty: true }), () => undefined);
            }
          }}
        />
      )}
    />
  );
}
