"use client";

import React, { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { FormDialog, FormSection, SwitchField, TextField, TextareaField } from "@/components/form";
import { asStringList, getInstructionSteps, parseList, setInstructionSteps } from "../exerciseUtils";
import type { ExerciseCreateInput, ExerciseItem } from "../types";

interface ExerciseFormValues {
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  target: string;
  muscle_group: string;
  secondary_muscles: string;
  instructions: string;
  image_url: string;
  video_url: string;
  description: string;
  is_active: boolean;
}

interface ExerciseFormModalProps {
  open: boolean;
  editing: ExerciseItem | null;
  onCancel: () => void;
  /** Ném lỗi lại: FormDialog gắn lỗi backend vào từng ô nhập */
  onSubmit: (values: ExerciseCreateInput) => Promise<void>;
}

const EMPTY: ExerciseFormValues = {
  name: "",
  category: "",
  body_part: "",
  equipment: "",
  target: "",
  muscle_group: "",
  secondary_muscles: "",
  instructions: "",
  image_url: "",
  video_url: "",
  description: "",
  is_active: true,
};

const blank = (v: string) => v.trim() || null;

export function ExerciseFormModal({ open, editing, onCancel, onSubmit }: ExerciseFormModalProps) {
  const t = useTranslations("exercises");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const form = useForm<ExerciseFormValues>({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? {
            name: editing.name,
            category: editing.category ?? "",
            body_part: editing.body_part ?? "",
            equipment: editing.equipment ?? "",
            target: editing.target ?? "",
            muscle_group: editing.muscle_group ?? "",
            secondary_muscles: asStringList(editing.secondary_muscles).join(", "),
            instructions: getInstructionSteps(editing.instructions, locale).join("\n"),
            image_url: editing.image_url ?? "",
            video_url: editing.video_url ?? "",
            description: editing.description ?? "",
            is_active: editing.is_active ?? true,
          }
        : EMPTY,
    );
  }, [open, editing, form, locale]);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="lg"
      title={editing ? t("form.editTitle", { name: editing.name }) : t("form.createTitle")}
      form={form}
      submitText={editing ? tc("actions.saveChanges") : t("form.createTitle")}
      onSubmit={async (v) => {
        await onSubmit({
          name: v.name.trim(),
          category: blank(v.category),
          body_part: blank(v.body_part),
          equipment: blank(v.equipment),
          target: blank(v.target),
          muscle_group: blank(v.muscle_group),
          secondary_muscles: parseList(v.secondary_muscles),
          instructions: setInstructionSteps(editing?.instructions ?? null, locale, v.instructions.split(/\r?\n/)),
          image_url: blank(v.image_url),
          video_url: blank(v.video_url),
          description: v.description.trim() || null,
          is_active: v.is_active,
        });
      }}
    >
      <FormSection>
        <TextField<ExerciseFormValues>
          name="name"
          label={t("fields.name")}
          className="form-section__full"
          rules={{ required: tv("required", { field: t("fields.name") }), maxLength: { value: 255, message: tv("maxLength", { max: 255 }) } }}
        />
        <TextField<ExerciseFormValues> name="category" label={t("fields.category")} />
        <TextField<ExerciseFormValues> name="body_part" label={t("fields.bodyPart")} />
        <TextField<ExerciseFormValues> name="equipment" label={t("fields.equipment")} />
        <TextField<ExerciseFormValues> name="target" label={t("fields.target")} />
        <TextField<ExerciseFormValues> name="muscle_group" label={t("fields.muscleGroup")} />
        <TextField<ExerciseFormValues> name="secondary_muscles" label={t("fields.secondaryMuscles")} hint={t("fields.secondaryMusclesHint")} />
        <TextareaField<ExerciseFormValues>
          name="instructions"
          label={t("fields.instructions")}
          hint={t("fields.instructionsHint")}
          rows={6}
          className="form-section__full"
        />
        <TextField<ExerciseFormValues> name="image_url" label={t("fields.imageUrl")} placeholder="https://" />
        <TextField<ExerciseFormValues> name="video_url" label={t("fields.videoUrl")} placeholder="https://" />
        <TextareaField<ExerciseFormValues> name="description" label={tc("fields.description")} maxLength={500} className="form-section__full" />
        <SwitchField<ExerciseFormValues> name="is_active" label={tc("fields.status")} onText={tc("status.active")} offText={tc("status.inactive")} />
      </FormSection>
    </FormDialog>
  );
}
