"use client";

import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge, defineStatusMap } from "@/components/common/StatusBadge";
import { useConfirm } from "@/components/feedback/confirm";
import { applyServerErrors } from "@/lib/api/formErrors";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { usePhaseNutritionPlan, useUpsertDailyLogMutation } from "../hooks/useDailyLogsQuery";
import type { DailyLogItem } from "../types";
import { DayFormFields } from "./DayFormFields";
import { DaySummary } from "./DaySummary";
import { EMPTY_DAY, toDayValues, toUpsertPayload, type DayFormValues } from "./dayFormUtils";

const LOG_STATE = defineStatusMap({
  LOGGED: { label: "dailyLogs.sheet.logged", tone: "success" },
  EMPTY: { label: "dailyLogs.sheet.notLogged", tone: "warning" },
});

interface DayDetailSheetProps {
  open: boolean;
  onClose: () => void;
  /** "yyyy-MM-dd" */
  dateStr: string | null;
  log: DailyLogItem | null;
  /** Học viên đang xem (null = nhật ký của chính mình) */
  clientId?: number | null;
  /** Không có quyền tạo / sửa -> chỉ xem */
  readOnly?: boolean;
}

/** Panel bên phải: xem + ghi nhanh nhật ký 1 ngày (upsert theo ngày). */
export function DayDetailSheet({ open, onClose, dateStr, log, clientId, readOnly }: DayDetailSheetProps) {
  const t = useTranslations("dailyLogs.sheet");
  const locale = useLocale();
  const confirm = useConfirm();
  const form = useForm<DayFormValues>({ defaultValues: EMPTY_DAY });
  const { isDirty } = form.formState;
  const upsert = useUpsertDailyLogMutation();
  const planQuery = usePhaseNutritionPlan(log?.phase, open);
  const plan = planQuery.data ?? null;

  useEffect(() => {
    if (open) form.reset(toDayValues(log));
  }, [open, log, form]);

  const requestClose = async () => {
    if (isDirty && !readOnly) {
      const ok = await confirm({ title: t("discardTitle"), description: t("discardDescription"), confirmText: t("discard"), danger: true });
      if (!ok) return;
    }
    onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!dateStr) return;
    try {
      const saved = await upsert.mutateAsync(
        toUpsertPayload(values, { logDate: dateStr, clientId, hasPlan: Boolean(plan?.meals.length) }),
      );
      form.reset(toDayValues(saved));
      toast.success(t("saved"));
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) toast.error(extractErrorMessage(error, t("saveError")));
    }
  });

  if (!dateStr) return null;
  const date = parseISO(dateStr);
  const dateLocale = locale === "en" ? enUS : vi;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && requestClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <StatusBadge map={LOG_STATE} value={log ? "LOGGED" : "EMPTY"} />
          </div>
          <SheetTitle className="text-lg capitalize">{format(date, "EEEE, dd/MM/yyyy", { locale: dateLocale })}</SheetTitle>
          <SheetDescription>{log?.client_name ? t("forClient", { name: log.client_name }) : t("description")}</SheetDescription>
        </SheetHeader>

        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              {log && <DaySummary log={log} />}
              <DayFormFields plan={plan} readOnly={readOnly} />
            </div>
            {!readOnly && (
              <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-3">
                <Button type="button" variant="outline" onClick={requestClose}>{t("cancel")}</Button>
                <Button type="submit" disabled={upsert.isPending}>{upsert.isPending ? t("saving") : t("save")}</Button>
              </SheetFooter>
            )}
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
