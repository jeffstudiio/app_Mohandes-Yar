"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/lib/mhy/server";
import { faNum } from "@/lib/mhy/engines";
import { ShieldCheck, PenLine, BookOpen, GraduationCap, X, Search } from "lucide-react";

// ─── Global search overlay (§34/§96) — regulations first, then questions, lessons ───
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
        const r = await fetch(`/api/mhy/search?q=${encodeURIComponent(q.trim())}`);
        const j = await r.json();
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
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجو: پارکینگ، راه پله، حریق، آسانسور…"
            aria-label="عبارت جستجو"
            className="h-12 w-full rounded-2xl border pr-10 pl-3 text-[13px] outline-none focus:ring-2"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>
        <button onClick={onClose} aria-label="بستن جستجو" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <X size={20} />
        </button>
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-4 py-3.5">
        {q.trim().length < 2 && (
          <div className="py-8 text-center">
            <Search size={30} style={{ color: "var(--muted-foreground)" }} className="mx-auto" />
            <p className="mt-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              در مقررات، سؤالات و درسنامه‌ها جستجو کنید — مثلاً «پارکینگ» یا «حریق».
            </p>
          </div>
        )}
        {busy && (
          <p className="py-6 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            در حال جستجو…
          </p>
        )}
        {!busy && hits !== null && hits.length === 0 && (
          <p className="py-8 text-center text-[12.5px]" style={{ color: "var(--muted-foreground)" }}>
            نتیجه‌ای برای «{q}» پیدا نشد — عبارت کوتاه‌تری امتحان کنید.
          </p>
        )}
        {regs.length > 0 && (
          <>
            <p className="mb-2 mt-1 text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
              مقررات ({faNum(regs.length)})
            </p>
            <div className="space-y-2">
              {regs.map((h, i) => {
                if (h.kind !== "regulation") return null;
                return (
                  <button
                    key={`r${i}`}
                    onClick={() => onOpenRegulation(h.mabhas)}
                    className="w-full rounded-2xl border p-3.5 text-right"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <p className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "var(--primary)" }}>
                      <BookOpen size={13} />
                      مبحث {faNum(h.mabhas)} · بند {h.band}
                    </p>
                    {h.title && (
                      <p className="mt-1 truncate text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
                        {h.title}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5" style={{ color: "var(--muted-foreground)" }}>
                      …{h.snippet}…
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {qs.length > 0 && (
          <>
            <p className="mb-2 mt-5 text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
              سؤالات ({faNum(qs.length)})
            </p>
            <div className="space-y-2">
              {qs.map((h, i) => {
                if (h.kind !== "question") return null;
                return (
                  <button
                    key={`q${i}`}
                    onClick={onOpenQuestionPractice}
                    className="w-full rounded-2xl border p-3.5 text-right"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <p className="flex items-center gap-1.5 text-[10.5px] font-bold" style={{ color: h.sourceType === "OFFICIAL_EXAM" ? "var(--primary)" : "var(--warning)" }}>
                      {h.sourceType === "OFFICIAL_EXAM" ? <ShieldCheck size={12} /> : <PenLine size={12} />}
                      {h.sourceType === "OFFICIAL_EXAM" ? `رسمی${h.session ? ` · ${h.session}` : ""}` : "تألیفی"} · {h.topic}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-5" style={{ color: "var(--foreground)" }}>
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
            <p className="mb-2 mt-5 text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
              درسنامه‌ها ({faNum(ls.length)})
            </p>
            <div className="space-y-2">
              {ls.map((h, i) => {
                if (h.kind !== "lesson") return null;
                return (
                  <button
                    key={`l${i}`}
                    onClick={() => onOpenRegulation(h.mabhas)}
                    className="flex w-full items-center gap-2.5 rounded-2xl border p-3.5 text-right"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <GraduationCap size={16} style={{ color: "var(--success)" }} />
                    <span className="flex-1 text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
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
