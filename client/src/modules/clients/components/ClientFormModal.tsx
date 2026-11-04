"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection, NumberField, SelectField, TextField, TextareaField } from "@/components/form";
import { statusOptions } from "@/components/common/StatusBadge";
import { CLIENT_STATUS, FITNESS_GOAL, GENDER, toDecimal, toNumber } from "@/constants/fitness";
import { userService } from "@/modules/users/services/user.service";
import type { UserItem } from "@/modules/users/types";
import type { ClientCreateInput, ClientItem } from "../types";

const MEASURES = ["chest_measure", "waist_measure", "hips_measure", "arm_measure", "leg_measure"] as const;
type MeasureKey = (typeof MEASURES)[number];

type ClientFormValues = {
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  coach: number | null;
  height_cm: number | null;
  current_weight: number | null;
  body_fat_percentage: number | null;
  fitness_goal: string;
  activity_level: number | null;
  training_frequency: number | null;
  status: string;
  notes: string;
} & Record<MeasureKey, number | null>;

interface ClientFormModalProps {
  open: boolean;
  editing: ClientItem | null;
  /** Chỉ quản trị viên được chọn / đổi HLV phụ trách */
  canAssignCoach: boolean;
  onCancel: () => void;
  /** Ném lỗi lại: FormDialog gắn lỗi backend vào từng ô nhập */
  onSubmit: (values: ClientCreateInput) => Promise<void>;
}

const EMPTY: ClientFormValues = {
  full_name: "",
  phone: "",
  email: "",
  gender: "",
  date_of_birth: "",
  coach: null,
  height_cm: null,
  current_weight: null,
  body_fat_percentage: null,
  chest_measure: null,
  waist_measure: null,
  hips_measure: null,
  arm_measure: null,
  leg_measure: null,
  fitness_goal: "MAINTAINING",
  activity_level: 1.2,
  training_frequency: null,
  status: "ACTIVE",
  notes: "",
};

const MEASURE_LABEL: Record<MeasureKey, "chest" | "waist" | "hips" | "arm" | "leg"> = {
  chest_measure: "chest",
  waist_measure: "waist",
  hips_measure: "hips",
  arm_measure: "arm",
  leg_measure: "leg",
};

function toValues(c: ClientItem): ClientFormValues {
  return {
    full_name: c.full_name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    gender: c.gender ?? "",
    date_of_birth: c.date_of_birth ?? "",
    coach: c.coach,
    height_cm: toNumber(c.height_cm),
    current_weight: toNumber(c.current_weight),
    body_fat_percentage: toNumber(c.body_fat_percentage),
    chest_measure: toNumber(c.chest_measure),
    waist_measure: toNumber(c.waist_measure),
    hips_measure: toNumber(c.hips_measure),
    arm_measure: toNumber(c.arm_measure),
    leg_measure: toNumber(c.leg_measure),
    fitness_goal: c.fitness_goal,
    activity_level: toNumber(c.activity_level),
    training_frequency: c.training_frequency ?? null,
    status: c.status ?? "ACTIVE",
    notes: c.notes ?? "",
  };
}

export function ClientFormModal({ open, editing, canAssignCoach, onCancel, onSubmit }: ClientFormModalProps) {
  const t = useTranslations("clients");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const tr = useTranslations();
  const form = useForm<ClientFormValues>({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    form.reset(editing ? toValues(editing) : EMPTY);
  }, [open, editing, form]);

  const genderOptions = useMemo(() => statusOptions(GENDER, tr), [tr]);
  const goalOptions = useMemo(() => statusOptions(FITNESS_GOAL, tr), [tr]);
  const clientStatusOptions = useMemo(() => statusOptions(CLIENT_STATUS, tr), [tr]);
  const coachInitial = useMemo(
    () => (editing ? [{ value: String(editing.coach), label: editing.coach_name || String(editing.coach) }] : []),
    [editing],
  );

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="lg"
      title={editing ? t("form.editTitle", { name: editing.full_name }) : t("form.createTitle")}
      form={form}
      submitText={editing ? tc("actions.saveChanges") : t("form.createTitle")}
      onSubmit={async (v) => {
        await onSubmit({
          full_name: v.full_name.trim(),
          phone: v.phone.trim() || null,
          email: v.email.trim() || null,
          gender: (v.gender || null) as ClientCreateInput["gender"],
          date_of_birth: v.date_of_birth || null,
          ...(canAssignCoach && v.coach ? { coach: v.coach } : {}),
          height_cm: toDecimal(v.height_cm),
          current_weight: toDecimal(v.current_weight),
          body_fat_percentage: toDecimal(v.body_fat_percentage),
          chest_measure: toDecimal(v.chest_measure),
          waist_measure: toDecimal(v.waist_measure),
          hips_measure: toDecimal(v.hips_measure),
          arm_measure: toDecimal(v.arm_measure),
          leg_measure: toDecimal(v.leg_measure),
          fitness_goal: v.fitness_goal as ClientCreateInput["fitness_goal"],
          activity_level: toDecimal(v.activity_level),
          training_frequency: v.training_frequency,
          status: v.status as ClientCreateInput["status"],
          notes: v.notes.trim() || null,
        });
      }}
    >
      <FormSection title={t("form.contact")}>
        <TextField<ClientFormValues>
          name="full_name"
          label={t("fields.fullName")}
          rules={{ required: tv("required", { field: t("fields.fullName") }), maxLength: { value: 255, message: tv("maxLength", { max: 255 }) } }}
        />
        <TextField<ClientFormValues> name="phone" label={t("fields.phone")} placeholder="0912 345 678" rules={{ maxLength: { value: 30, message: tv("maxLength", { max: 30 }) } }} />
        <TextField<ClientFormValues> name="email" label={t("fields.email")} type="email" />
        <SelectField<ClientFormValues> name="gender" label={tf("fields.gender")} options={genderOptions} />
        <TextField<ClientFormValues> name="date_of_birth" label={tf("fields.dateOfBirth")} type="date" />
        <SelectField<ClientFormValues> name="status" label={t("fields.status")} options={clientStatusOptions} />
        {canAssignCoach && (
          <EntityComboField<ClientFormValues, UserItem>
            name="coach"
            label={t("fields.coach")}
            hint={t("form.coachHint")}
            queryKey={["users", "coach-options"]}
            fetchPage={(p) => userService.list({ ...p, is_active: true })}
            toOption={(u) => ({ value: String(u.id), label: u.full_name || u.username, code: u.username })}
            initialOptions={coachInitial}
          />
        )}
      </FormSection>
      <FormSection title={t("form.body")}>
        <SelectField<ClientFormValues> name="fitness_goal" label={tf("fields.goal")} options={goalOptions} rules={{ required: tv("required", { field: tf("fields.goal") }) }} />
        <NumberField<ClientFormValues> name="training_frequency" label={tf("fields.trainingFrequency")} suffix={tf("units.perWeek")} min={0} max={14} />
        <NumberField<ClientFormValues> name="height_cm" label={tf("fields.height")} suffix={tf("units.cm")} min={0} />
        <NumberField<ClientFormValues> name="current_weight" label={tf("fields.weight")} suffix={tf("units.kg")} min={0} />
        <NumberField<ClientFormValues> name="body_fat_percentage" label={tf("fields.bodyFat")} suffix={tf("units.percent")} min={0} max={100} />
        <NumberField<ClientFormValues> name="activity_level" label={tf("fields.activityLevel")} hint={tf("fields.activityLevelHint")} min={1.2} max={1.9} />
      </FormSection>
      <FormSection title={t("form.measurements")}>
        {MEASURES.map((key) => (
          <NumberField<ClientFormValues> key={key} name={key} label={tf(`fields.${MEASURE_LABEL[key]}`)} suffix={tf("units.cm")} min={0} />
        ))}
        <TextareaField<ClientFormValues> name="notes" label={t("fields.notes")} maxLength={2000} className="form-section__full" />
      </FormSection>
    </FormDialog>
  );
}
