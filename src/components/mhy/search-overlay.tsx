"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { faNum } from "@/lib/mhy/engines";
import { ShieldCheck, PenLine, BookOpen, GraduationCap, X, Search } from "lucide-react";
import { SearchField, OrbitSpinner, MabhasCover } from "./ui";

// ─── Global search overlay (§25/§34) — regulations first, then questions, lessons ───
export default function SearchOverlay({
  open,
  onClose,
  onOpenRegulation,
  onOpenQuestionPractice,
}: {
  open: boolean;
  onClose: () => void;
  onOpenRegulation: (mabhas: number) => void;
  onOpenQuestionPractice: () => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else {
      setQ("");
      setHits(null);
    }
  }, [open]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setHits(null);
      return;
    }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const j = await api.search(q.trim());
        setHits(j.hits ?? []);
      } catch {
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 350); // debounce (§62)
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  if (!open) return null;

  const regs = hits?.filter((h) => h.kind === "regulation") ?? [];
  const qs = hits?.filter((h) => h.kind === "question") ?? [];
  const ls = hits?.filter((h) => h.kind === "lesson") ?? [];

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }} role="dialog" aria-label="جستجوی سراسری">
      <div className="flex items-center gap-2 border-b px-3 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1">
          <SearchField value={q} onChange={setQ} placeholder="جستجو در سؤال‌ها، مقررات و منابع…" ariaLabel="عبارت جستجو" autoFocus />
        </div>
        <button onClick={onClose} aria-label="بستن جستجو" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <X size={20} />
        </button>
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-4 py-3.5">
        {q.trim().length < 2 && (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
              <Search size={26} strokeWidth={1.6} />
            </div>
            <p className="t-body-sm mt-3" style={{ color: "var(--muted-foreground)" }}>
              در مقررات، سؤالات و درسنامه‌ها جستجو کنید — مثلاً «پارکینگ» یا «حریق».
            </p>
          </div>
        )}
        {busy && hits === null && (
          <div className="flex justify-center py-8">
            <OrbitSpinner />
          </div>
        )}
        {!busy && hits !== null && hits.length === 0 && (
          <p className="py-10 text-center t-body-sm" style={{ color: "var(--muted-foreground)" }}>
            نتیجه‌ای برای «{q}» پیدا نشد — عبارت کوتاه‌تری امتحان کنید.
          </p>
        )}

        {regs.length > 0 && (
          <>
            <ResultHeader label="مقررات" count={regs.length} />
            <div className="space-y-2">
              {regs.map((h, i) => {
                if (h.kind !== "regulation") return null;
                return (
                  <button
                    key={`r${i}`}
                    onClick={() => onOpenRegulation(h.mabhas)}
                    className="press flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <MabhasCover mabhas={h.mabhas} variant="thumb" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="num flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: "var(--primary)" }}>
                        <BookOpen size={13} />
                        مبحث {faNum(h.mabhas)} · بند {h.band}
                        {h.page ? ` · ص ${faNum(h.page)}` : ""}
                      </p>
                      {h.title && (
                        <p className="mt-1 truncate text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                          {h.title}
                        </p>
                      )}
                      <p className="t-caption mt-1 line-clamp-2 leading-5" style={{ color: "var(--muted-foreground)" }}>
                        …{h.snippet}…
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {qs.length > 0 && (
          <>
            <ResultHeader label="سؤالات" count={qs.length} />
            <div className="space-y-2">
              {qs.map((h, i) => {
                if (h.kind !== "question") return null;
                return (
                  <button
                    key={`q${i}`}
                    onClick={onOpenQuestionPractice}
                    className="press w-full rounded-2xl border p-3.5 text-right"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <p className="num flex items-center gap-1.5 text-[10.5px] font-bold" style={{ color: h.sourceType === "OFFICIAL_EXAM" ? "var(--primary)" : "var(--warning)" }}>
                      {h.sourceType === "OFFICIAL_EXAM" ? <ShieldCheck size={12} /> : <PenLine size={12} />}
                      {h.sourceType === "OFFICIAL_EXAM" ? `رسمی${h.session ? ` · ${h.session}` : ""}` : "تألیفی"} · {h.topic}
                    </p>
                    <p className="t-body-sm mt-1 line-clamp-2 leading-5" style={{ color: "var(--foreground)" }}>
                      {h.text}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {ls.length > 0 && (
          <>
            <ResultHeader label="درسنامه‌ها" count={ls.length} />
            <div className="space-y-2">
              {ls.map((h, i) => {
                if (h.kind !== "lesson") return null;
                return (
                  <button
                    key={`l${i}`}
                    onClick={() => onOpenRegulation(h.mabhas)}
                    className="press flex w-full items-center gap-2.5 rounded-2xl border p-3.5 text-right"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <GraduationCap size={16} style={{ color: "var(--success)" }} />
                    <span className="flex-1 text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                      {h.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 first:mt-1">
      <p className="text-[12px] font-extrabold" style={{ color: "var(--foreground)" }}>
        {label}
      </p>
      <span className="num rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
        {faNum(count)}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}
