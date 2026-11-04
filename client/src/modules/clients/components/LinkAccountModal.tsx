"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EntityComboField, FormDialog, FormSection } from "@/components/form";
import { userService } from "@/modules/users/services/user.service";
import type { UserItem } from "@/modules/users/types";
import type { ClientItem } from "../types";

interface LinkAccountValues {
  user_id: number | null;
}

interface LinkAccountModalProps {
  open: boolean;
  client: ClientItem;
  onCancel: () => void;
  /** Ném lỗi lại: FormDialog gắn lỗi backend (`user_id`) vào ô chọn */
  onSubmit: (userId: number) => Promise<void>;
}

const EMPTY: LinkAccountValues = { user_id: null };

/** Chọn tài khoản eFit để liên kết với hồ sơ học viên (tìm ở server). */
export function LinkAccountModal({ open, client, onCancel, onSubmit }: LinkAccountModalProps) {
  const t = useTranslations("clients");
  const tv = useTranslations("validation");
  const form = useForm<LinkAccountValues>({ defaultValues: EMPTY });

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  return (
    <FormDialog
      open={open}
      onClose={onCancel}
      size="sm"
      title={t("link.title", { name: client.full_name })}
      form={form}
      submitText={t("link.submit")}
      onSubmit={async (v) => onSubmit(v.user_id as number)}
    >
      <FormSection>
        <EntityComboField<LinkAccountValues, UserItem>
          name="user_id"
          label={t("link.user")}
          hint={t("link.hint")}
          className="form-section__full"
          rules={{ required: tv("required", { field: t("link.user") }) }}
          queryKey={["users", "link-options"]}
          fetchPage={(p) => userService.list({ ...p, is_active: true })}
          toOption={(u) => ({ value: String(u.id), label: u.full_name || u.username, code: u.username, description: u.email })}
        />
      </FormSection>
    </FormDialog>
  );
}
