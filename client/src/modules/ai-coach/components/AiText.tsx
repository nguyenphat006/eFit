import React from "react";

/**
 * Hiển thị câu trả lời AI (Markdown đơn giản) không cần thư viện: tiêu đề `#`, gạch đầu dòng `-`/`*`, **đậm**.
 * Không render HTML từ AI (chống chèn mã).
 */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function AiText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col gap-1.5 text-sm leading-relaxed">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return null;
        const heading = line.match(/^#{1,6}\s+(.*)$/);
        if (heading) return <p key={i} className="m-0 mt-1 font-semibold">{inline(heading[1])}</p>;
        const bullet = line.match(/^(\s*)[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <p key={i} className="m-0 flex gap-2" style={{ paddingLeft: bullet[1].length * 8 }}>
              <span aria-hidden>•</span>
              <span>{inline(bullet[2])}</span>
            </p>
          );
        }
        return <p key={i} className="m-0">{inline(line)}</p>;
      })}
    </div>
  );
}
