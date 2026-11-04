"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bot, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractErrorMessage } from "@/lib/api/errorUtils";
import { cn } from "@/lib/utils";
import { useAskMutation } from "../hooks/useAiCoach";
import type { ChatTurn } from "../types";
import { AiText } from "./AiText";

const SUGGESTION_KEYS = ["preWorkout", "plateau", "sleep"] as const;

/** Hỏi đáp với eFit AI. Lịch sử chỉ giữ trong phiên (không lưu server), gửi kèm 10 lượt gần nhất. */
export function ChatPanel({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("aiCoach.chat");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const ask = useAskMutation();

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || ask.isPending) return;
    setQuestion("");
    const prior = history;
    setHistory([...prior, { role: "user", content: q }]);
    try {
      const res = await ask.mutateAsync({ question: q, history: prior.slice(-10) });
      setHistory((h) => [...h, { role: "assistant", content: res.answer }]);
    } catch (error) {
      setHistory(prior);
      setQuestion(q);
      toast.error(extractErrorMessage(error, t("error")));
    }
  };

  return (
    <section className="dash-panel flex min-h-[480px] flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="dash-panel__title m-0">{t("title")}</h2>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
            <Trash2 />
            {t("clear")}
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto" aria-live="polite">
        {history.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
            <Bot className="size-8 text-muted-foreground" aria-hidden />
            <p className="m-0 max-w-sm text-sm text-muted-foreground">{t("empty")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTION_KEYS.map((key) => (
                <Button key={key} variant="outline" size="sm" disabled={disabled || ask.isPending} onClick={() => send(t(`suggestions.${key}`))}>
                  {t(`suggestions.${key}`)}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          history.map((turn, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2",
                turn.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start border bg-[var(--c-bg-subtle)]",
              )}
            >
              {turn.role === "user" ? <p className="m-0 whitespace-pre-wrap text-sm">{turn.content}</p> : <AiText text={turn.content} />}
            </div>
          ))
        )}
        {ask.isPending && <p className="m-0 self-start text-sm text-muted-foreground">{t("thinking")}</p>}
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
      >
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(question);
            }
          }}
          placeholder={disabled ? t("disabled") : t("placeholder")}
          aria-label={t("placeholder")}
          rows={2}
          maxLength={2000}
          disabled={disabled}
          className="min-h-0 flex-1 resize-none"
        />
        <Button type="submit" size="icon" aria-label={t("send")} disabled={disabled || !question.trim() || ask.isPending}>
          <Send />
        </Button>
      </form>
    </section>
  );
}
