"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyQuestion } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum, type QLite } from "@/lib/mhy/engines";
import { Card, SectionHeader, EmptyState, Btn, BottomSheet, Chip, LoadingBlock, SegmentedControl } from "./ui";
import { QuestionRunner } from "./question-runner";
import {
  ShieldCheck,
  PenLine,
  BookOpen,
  XCircle,
  Bookmark,
  Zap,
  SlidersHorizontal,
  Search,
  Play,
} from "lucide-react";

type Filter = {
  mabhas: number | null;
  sourceType: "OFFICIAL_EXAM" | "AUTHORED" | "ALL";
  difficulty: ("easy" | "medium" | "hard")[];
  session: string | null;
  unsolvedOnly: boolean;
  ids?: number[];
};

const DEFAULT_FILTER: Filter = { mabhas: null, sourceType: "ALL", difficulty: [], session: null, unsolvedOnly: false };

type PView =
  | { kind: "root" }
  | { kind: "filter"; preset: Filter; title: string }
  | { kind: "run"; preset: Filter; title: string };

export default function Practice({
  bootstrap,
  majors,
  presetMabhas,
  onPresetConsumed,
}: {
  bootstrap: Bootstrap | null;
  majors: string[];
  presetMabhas: number | null;
  onPresetConsumed: () => void;
}) {
  const { answers, mistakes, bookmarks } = useMhy();
  const [view, setView] = useState<PView>({ kind: "root" });

  useEffect(() => {
    if (presetMabhas == null) return;
    const t = setTimeout(() => {
      setView({ kind: "run", preset: { ...DEFAULT_FILTER, mabhas: presetMabhas }, title: `تمرین مبحث ${faNum(presetMabhas)}` });
      onPresetConsumed();
    }, 0);
    return () => clearTimeout(t);
  }, [presetMabhas]);

  const countFor = (sourceType: Filter["sourceType"]) => {
    if (sourceType === "OFFICIAL_EXAM") return bootstrap?.stats.official ?? 0;
    if (sourceType === "AUTHORED") return bootstrap?.stats.authored ?? 0;
    return bootstrap?.stats.questions ?? 0;
  };

  if (view.kind === "run") {
    return <PracticeRunner filter={view.preset} title={view.title} majors={majors} onExit={() => setView({ kind: "root" })} />;
  }
  if (view.kind === "filter") {
    return (
      <FilterSheet
        initial={view.preset}
        title={view.title}
        bootstrap={bootstrap}
        majors={majors}
        onCancel={() => setView({ kind: "root" })}
        onApply={(f) => setView({ kind: "run", preset: f, title: view.title })}
      />
    );
  }

  const mistakeCount = mistakes.filter((id) => !(answers[id]?.correct === true)).length;
  const openMistakes = mistakes.slice(0, 40);
  const openBookmarks = bookmarks.slice(0, 40);

  const entries = [
    { icon: ShieldCheck, title: "سؤالات رسمی", desc: `${faNum(countFor("OFFICIAL_EXAM"))} سؤال با هویت جلسه و شماره`, tint: "var(--primary)", onClick: () => setView({ kind: "filter", preset: { ...DEFAULT_FILTER, sourceType: "OFFICIAL_EXAM" }, title: "سؤالات رسمی" }) },
    { icon: PenLine, title: "سؤالات تألیفی", desc: `${faNum(countFor("AUTHORED"))} سؤال تألیفی کتابخانه`, tint: "var(--warning)", onClick: () => setView({ kind: "filter", preset: { ...DEFAULT_FILTER, sourceType: "AUTHORED" }, title: "سؤالات تألیفی" }) },
    { icon: BookOpen, title: "تمرین مبحثی", desc: "انتخاب مبحث و تمرین اختصاصی", tint: "var(--success)", onClick: () => setView({ kind: "filter", preset: DEFAULT_FILTER, title: "تمرین مبحثی" }) },
    {
      icon: XCircle,
      title: "اشتباهات من",
      desc: mistakeCount ? `${faNum(mistakeCount)} سؤال برای مرور` : "هنوز اشتباهی ثبت نشده",
      tint: "var(--danger)",
      onClick: () => setView({ kind: "run", preset: { ...DEFAULT_FILTER, ids: openMistakes }, title: "اشتباهات من" }),
    },
    {
      icon: Bookmark,
      title: "ذخیره‌شده‌ها",
      desc: bookmarks.length ? `${faNum(bookmarks.length)} سؤال نشان‌گذاری‌شده` : "هنوز سؤالی نشان نکرده‌اید",
      tint: "var(--primary)",
      onClick: () => setView({ kind: "run", preset: { ...DEFAULT_FILTER, ids: openBookmarks }, title: "ذخیره‌شده‌ها" }),
    },
  ];

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <h1 className="t-title pt-4">تمرین</h1>
      <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
        با هویت شفاف منبع هر سؤال — رسمی یا تألیفی
      </p>

      <div className="mt-4 space-y-2.5">
        {entries.map((e) => (
          <Card key={e.title} onClick={e.onClick} ariaLabel={e.title}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${e.tint} 12%, transparent)`, color: e.tint }}
              >
                <e.icon size={20} strokeWidth={1.9} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                  {e.title}
                </p>
                <p className="num mt-0.5 t-caption" style={{ color: "var(--muted-foreground)" }}>
                  {e.desc}
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--muted)" }}>
                <Play size={13} style={{ color: "var(--muted-foreground)" }} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <SectionHeader title="تمرین سریع" />
      <div className="grid grid-cols-3 gap-2.5">
        {[5, 10, 20].map((n) => (
          <button
            key={n}
            onClick={() => setView({ kind: "run", preset: { ...DEFAULT_FILTER }, title: `تمرین سریع ${faNum(n)} سؤالی` })}
            className="press flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <Zap size={17} style={{ color: "var(--primary)" }} />
            <span className="num text-[11.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
              {faNum(n)} سؤال
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══ Filter sheet — bottom sheet with live result count (§17) ═══ */
function FilterSheet({
  initial,
  title,
  bootstrap,
  majors,
  onCancel,
  onApply,
}: {
  initial: Filter;
  title: string;
  bootstrap: Bootstrap | null;
  majors: string[];
  onCancel: () => void;
  onApply: (f: Filter) => void;
}) {
  const [f, setF] = useState<Filter>(initial);
  const [liveTotal, setLiveTotal] = useState<number | null>(null);
  const mabhasList = (bootstrap?.mabhasIndex ?? []).map((m) => m.mabhas);
  const toggleDiff = (d: "easy" | "medium" | "hard") =>
    setF((s) => ({ ...s, difficulty: s.difficulty.includes(d) ? s.difficulty.filter((x) => x !== d) : [...s.difficulty, d] }));

  // live count — debounced real query with limit=1 → total
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const params: Record<string, string> = { limit: "1" };
        if (f.mabhas != null) params.mabhas = String(f.mabhas);
        if (f.sourceType !== "ALL") params.sourceType = f.sourceType;
        if (f.difficulty.length) params.difficulty = f.difficulty.join(",");
        const j = await api.questionsForMajors(majors, params);
        if (!cancelled) setLiveTotal(f.unsolvedOnly ? j.total : j.total);
      } catch {
        if (!cancelled) setLiveTotal(null);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [f.mabhas, f.sourceType, f.difficulty, majors]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden screen-in">
      <div className="flex items-center gap-2 px-4 pt-4">
        <button onClick={onCancel} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <SlidersHorizontal size={18} style={{ color: "var(--primary)" }} />
        </button>
        <h1 className="flex-1 text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          {title}
        </h1>
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-4">
        <SectionHeader title="مبحث" />
        <div className="flex flex-wrap gap-2">
          <Chip on={f.mabhas === null} label="همه مباحث" onClick={() => setF((s) => ({ ...s, mabhas: null }))} />
          {mabhasList.map((m) => (
            <Chip key={m} on={f.mabhas === m} label={`مبحث ${faNum(m)}`} onClick={() => setF((s) => ({ ...s, mabhas: m }))} />
          ))}
        </div>

        <SectionHeader title="نوع منبع" />
        <SegmentedControl
          ariaLabel="نوع منبع"
          value={f.sourceType}
          onChange={(v) => setF((s) => ({ ...s, sourceType: v }))}
          options={[
            { value: "ALL" as const, label: "همه" },
            { value: "OFFICIAL_EXAM" as const, label: "رسمی" },
            { value: "AUTHORED" as const, label: "تألیفی" },
          ]}
        />

        <SectionHeader title="سطح دشواری (چندگزینه‌ای)" />
        <div className="flex flex-wrap gap-2">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <Chip key={d} on={f.difficulty.includes(d)} label={d === "easy" ? "آسان" : d === "medium" ? "متوسط" : "سخت"} onClick={() => toggleDiff(d)} />
          ))}
        </div>

        <SectionHeader title="وضعیت" />
        <Chip on={f.unsolvedOnly} label="فقط حل‌نشده" onClick={() => setF((s) => ({ ...s, unsolvedOnly: !s.unsolvedOnly }))} />
      </div>

      {/* sticky result + CTA (§17) */}
      <div className="border-t px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="t-caption" style={{ color: "var(--muted-foreground)" }}>
            نتیجه فیلتر
          </span>
          <span className="num text-[15px] font-extrabold" style={{ color: "var(--primary)" }}>
            {liveTotal === null ? "…" : `${faNum(liveTotal)} سؤال`}
          </span>
        </div>
        <Btn full size="lg" onClick={() => onApply(f)}>
          <Play size={17} />
          شروع تمرین
        </Btn>
      </div>
    </div>
  );
}

/* ═══ Practice runner — ids-driven for mistakes/bookmarks (real fix) ═══ */
function PracticeRunner({
  filter,
  title,
  majors,
  onExit,
}: {
  filter: Filter;
  title: string;
  majors: string[];
  onExit: () => void;
}) {
  const { answers, recordAnswer } = useMhy();
  const [items, setItems] = useState<MhyQuestion[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (filter.ids?.length) {
          // mistakes / bookmarks — fetch the exact real ids (server supports ids param)
          const ids = filter.ids.slice(0, 20);
          const j = await api.questions({ ids, limit: ids.length });
          if (!cancelled) setItems(applyLocal(j.items ?? [], filter, answers));
          return;
        }
        const j = await api.questionsForMajors(majors, {
          mabhas: filter.mabhas ?? undefined,
          sourceType: filter.sourceType !== "ALL" ? filter.sourceType : undefined,
          difficulty: filter.difficulty.length ? filter.difficulty : undefined,
          limit: 20,
        });
        if (!cancelled) setItems(applyLocal(j.items ?? [], filter, answers));
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null) return <LoadingBlock label="بارگذاری سؤالات…" />;
  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col">
        <EmptyState
          icon={Search}
          title="هیچ سؤالی با این فیلتر پیدا نشد."
          desc="فیلترها را تغییر دهید یا مبحث دیگری را انتخاب کنید."
          action={{ label: "بازگشت به تمرین", onClick: onExit }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <RunnerWithIndex items={items} title={title} onExit={onExit} recordAnswer={recordAnswer} answers={answers} />
    </div>
  );
}

function applyLocal(list: MhyQuestion[], filter: Filter, answers: Record<number, { choice: number | null }>): MhyQuestion[] {
  let out = list;
  if (filter.unsolvedOnly) out = out.filter((q) => !(q.id in answers));
  return out;
}

function RunnerWithIndex({
  items,
  title,
  onExit,
  recordAnswer,
  answers,
}: {
  items: MhyQuestion[];
  title: string;
  onExit: () => void;
  recordAnswer: (qid: number, choice: number | null, correct: boolean | null) => void;
  answers: Record<number, { choice: number | null; correct: boolean | null; at: number }>;
}) {
  const [idx, setIdx] = useState(0);
  const q = items[idx];
  if (!q) return null;
  return (
    <QuestionRunner
      question={q}
      index={idx}
      total={items.length}
      mode="practice"
      onAnswer={recordAnswer}
      onNext={() => (idx + 1 >= items.length ? onExit() : setIdx((i) => i + 1))}
      onPrev={() => setIdx((i) => Math.max(0, i - 1))}
      onExit={onExit}
      title={title}
    />
  );
}
