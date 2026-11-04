"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Link2, Trash2, Unlink } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailPage, type HeroConfig } from "@/components/detail";
import { CLIENT_STATUS, FITNESS_GOAL, GENDER } from "@/constants/fitness";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useNumberFormat } from "@/providers/NumberFormatProvider";
import { ClientFormModal } from "./components/ClientFormModal";
import { LinkAccountModal } from "./components/LinkAccountModal";
import {
  useClientDetail,
  useDeleteClientMutation,
  useLinkClientAccountMutation,
  useUpdateClientMutation,
} from "./hooks/useClientsQuery";
import type { ClientCreateInput, ClientItem } from "./types";

const LIST_HREF = "/clients";
const MEASURES = [
  ["chest_measure", "chest"],
  ["waist_measure", "waist"],
  ["hips_measure", "hips"],
  ["arm_measure", "arm"],
  ["leg_measure", "leg"],
] as const;

function MeasurementsTab({ client }: { client: ClientItem }) {
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const { formatNumber } = useNumberFormat();
  return (
    <dl className="grid max-w-3xl gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {MEASURES.map(([key, label]) => (
        <div key={key} className="rounded-lg bg-[var(--c-bg-subtle)] p-3">
          <dt className="text-xs text-muted-foreground">{tf(`fields.${label}`)}</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums">
            {client[key] == null ? tc("status.empty") : `${formatNumber(client[key], 1)} ${tf("units.cm")}`}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Mùa giải / nhật ký do phân hệ riêng quản lý — tab chỉ dẫn sang màn hình đã lọc theo học viên. */
function LinkedModuleTab({ hint, href, label }: { hint: string; href: string; label: string }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">{hint}</p>
      <Link href={href} className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
        {label}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export interface ClientDetailViewProps {
  clientId: number;
}

export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const router = useRouter();
  const t = useTranslations("clients");
  const tf = useTranslations("fitness");
  const tc = useTranslations("common");
  const { can, isSuperUser } = usePermission();
  const { formatNumber } = useNumberFormat();
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const query = useClientDetail(clientId);
  const updateMutation = useUpdateClientMutation();
  const deleteMutation = useDeleteClientMutation();
  const linkMutation = useLinkClientAccountMutation();

  const canUpdate = can(PERMISSIONS.CLIENT.UPDATE);
  // Chọn tài khoản cần đọc danh sách người dùng
  const canLink = canUpdate && can(PERMISSIONS.USER.READ);

  const hero = useCallback(
    (c: ClientItem): HeroConfig => {
      const unit = (value: string | null | undefined, suffix: string) => (value == null ? null : `${formatNumber(value, 1)} ${suffix}`);
      return {
        title: c.full_name,
        badges: [
          <StatusBadge key="status" map={CLIENT_STATUS} value={c.status} />,
          <StatusBadge key="goal" map={FITNESS_GOAL} value={c.fitness_goal} />,
        ],
        subtitle: [c.phone, c.email].filter(Boolean),
        updatedAt: c.updated_at,
        updatedBy: c.updated_by_name,
        fields: [
          { label: t("fields.coach"), value: c.coach_name },
          { label: tf("fields.gender"), value: c.gender ? <StatusBadge map={GENDER} value={c.gender} /> : null },
          { label: tf("fields.dateOfBirth"), value: c.date_of_birth },
          { label: tf("fields.height"), value: unit(c.height_cm, tf("units.cm")) },
          { label: tf("fields.weight"), value: unit(c.current_weight, tf("units.kg")) },
          { label: tf("fields.bodyFat"), value: unit(c.body_fat_percentage, tf("units.percent")) },
          { label: tf("fields.activityLevel"), value: c.activity_level == null ? null : formatNumber(c.activity_level, 3) },
          { label: tf("fields.trainingFrequency"), value: c.training_frequency == null ? null : `${c.training_frequency} ${tf("units.perWeek")}` },
          { label: t("fields.account"), value: c.user_username ? `@${c.user_username}` : t("fields.noAccount") },
          { label: t("fields.notes"), value: c.notes, wide: true },
        ],
      };
    },
    [t, tf, formatNumber],
  );

  const handleEditSubmit = async (values: ClientCreateInput) => {
    await updateMutation.mutateAsync({ id: clientId, data: values });
    toast.success(tc("messages.updated", { entity: t("entity") }));
    setEditOpen(false);
  };

  const handleLink = async (userId: number) => {
    await linkMutation.mutateAsync({ id: clientId, userId });
    toast.success(t("link.linked"));
    setLinkOpen(false);
  };

  return (
    <DetailPage<ClientItem>
      query={query}
      backHref={LIST_HREF}
      entityLabel={t("entity")}
      hero={hero}
      onEdit={canUpdate ? () => setEditOpen(true) : undefined}
      moreActions={(c) => [
        {
          key: "link",
          label: t("link.action"),
          icon: <Link2 />,
          onClick: canLink && !c.user ? () => setLinkOpen(true) : undefined,
        },
        {
          key: "unlink",
          label: t("link.unlink"),
          icon: <Unlink />,
          confirm: { title: t("link.unlinkConfirm", { username: c.user_username ?? "" }), okText: t("link.unlink") },
          onClick:
            canUpdate && c.user
              ? async () => {
                  await linkMutation.mutateAsync({ id: c.id, userId: null });
                  toast.success(t("link.unlinked"));
                }
              : undefined,
        },
        {
          key: "delete",
          label: tc("actions.delete"),
          icon: <Trash2 />,
          danger: true,
          confirm: {
            title: tc("messages.deleteTitle", { entity: t("entity"), name: c.full_name }),
            content: tc("messages.deleteIrreversible"),
            okText: tc("actions.delete"),
          },
          onClick: can(PERMISSIONS.CLIENT.DELETE)
            ? async () => {
                await deleteMutation.mutateAsync(c.id);
                toast.success(tc("messages.deleted", { entity: t("entity") }));
                router.push(LIST_HREF);
              }
            : undefined,
        },
      ]}
      tabs={(c) => [
        { key: "measurements", label: t("tabs.measurements"), children: <MeasurementsTab client={c} /> },
        {
          key: "seasons",
          label: t("tabs.seasons"),
          children: <LinkedModuleTab hint={t("detail.seasonsHint")} href={`/seasons?client=${c.id}`} label={t("detail.openSeasons")} />,
        },
        {
          key: "logs",
          label: t("tabs.logs"),
          children: <LinkedModuleTab hint={t("detail.logsHint")} href={`/daily-logs?client=${c.id}`} label={t("detail.openLogs")} />,
        },
      ]}
      attachments={{ entityType: "Client", entityId: clientId, readonly: !canUpdate }}
      audit={{ model: "clients.client", objectId: clientId }}
    >
      {query.data && (
        <>
          <ClientFormModal
            open={editOpen}
            editing={query.data}
            canAssignCoach={isSuperUser}
            onCancel={() => setEditOpen(false)}
            onSubmit={handleEditSubmit}
          />
          <LinkAccountModal open={linkOpen} client={query.data} onCancel={() => setLinkOpen(false)} onSubmit={handleLink} />
        </>
      )}
    </DetailPage>
  );
}

export default ClientDetailView;
