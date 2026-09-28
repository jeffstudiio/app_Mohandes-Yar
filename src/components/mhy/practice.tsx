"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyQuestion } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum, type QLite } from "@/lib/mhy/engines";
import { Card, SectionHeader, EmptyState, Btn, SourceBadge, DifficultyBadge, MabhasChip } from "./ui";
import { QuestionRunner } from "./question-runner";
import {
  ShieldCheck,
  PenLine,
  BookOpen,
  XCircle,
  Bookmark,
  Zap,
  SlidersHorizontal,
  ChevronLeft,
  Search,
  Play,
} from "lucide-react";

type Filter = {
  mabhas: number | null;
  sourceType: "OFFICIAL_EXAM" | "AUTHORED" | "ALL";
  difficulty: ("easy" | "medium" | "hard")[];
  session: string | null;
  unsolvedOnly: boolean;
};

const DEFAULT_FILTER: Filter = { mabhas: null, sourceType: "ALL", difficulty: [], session: null, unsolvedOnly: false };

type PView =
  | { kind: "root" }
  | { kind: "filter"; preset: Filter; title: string }
  | { kind: "run"; preset: Filter; title: string };

export default function Practice({
  bootstrap,
  major,
  presetMabhas,
  onPresetConsumed,
}: {
  bootstrap: Bootstrap | null;
  major: string | null;
  presetMabhas: number | null;
  onPresetConsumed: () => void;
}) {
  const { answers, mistakes, bookmarks, recordAnswer } = useMhy();
  const [view, setView] = useState<PView>({ kind: "root" });

  useEffect(() => {
    if (presetMabhas == null) return;
    const t = setTimeout(() => {
      setView({ kind: "run", preset: { ...DEFAULT_FILTER, mabhas: presetMabhas }, title: `تمرین مبحث ${faNum(presetMabhas)}` });
      onPresetConsumed();
    }, 0);
    return () => clearTimeout(t);
  }, [presetMabhas]);

  const mabhasList = (bootstrap?.mabhasIndex ?? []).map((m) => m.mabhas);

  const countFor = (sourceType: Filter["sourceType"], mabhas: number | null = null) => {
    let n = bootstrap?.mabhasIndex.reduce((s, m) => s + m.questions, 0) ?? 0;
    if (sourceType === "OFFICIAL_EXAM") n = bootstrap?.stats.official ?? 0;
    else if (sourceType === "AUTHORED") n = bootstrap?.stats.authored ?? 0;
    if (mabhas != null) n = bootstrap?.mabhasIndex.find((m) => m.mabhas === mabhas)?.questions ?? 0;
    return n;
  };

  if (view.kind === "run") {
    return (
      <PracticeRunner
        filter={view.preset}
        title={view.title}
        major={major}
        onExit={() => setView({ kind: "root" })}
      />
    );
  }
  if (view.kind === "filter") {
    return <FilterSheet initial={view.preset} title={view.title} bootstrap={bootstrap} onCancel={() => setView({ kind: "root" })} onApply={(f) => setView({ kind: "run", preset: f, title: view.title })} />;
  }

  const mistakeCount = mistakes.filter((id) => !(answers[id]?.correct === true)).length;

  const entries = [
    { icon: ShieldCheck, title: "سؤالات رسمی", desc: `${faNum(countFor("OFFICIAL_EXAM"))} سؤال با هویت جلسه و شماره`, tint: "var(--primary)", onClick: () => setView({ kind: "filter", preset: { ...DEFAULT_FILTER, sourceType: "OFFICIAL_EXAM" }, title: "سؤالات رسمی" }) },
    { icon: PenLine, title: "سؤالات تألیفی", desc: `${faNum(countFor("AUTHORED"))} سؤال تألیفی کتابخانه`, tint: "var(--warning)", onClick: () => setView({ kind: "filter", preset: { ...DEFAULT_FILTER, sourceType: "AUTHORED" }, title: "سؤالات تألیفی" }) },
    { icon: BookOpen, title: "تمرین مبحثی", desc: "انتخاب مبحث و تمرین اختصاصی", onClick: () => setView({ kind: "filter", preset: DEFAULT_FILTER, title: "تمرین مبحثی" }) },
    { icon: XCircle, title: "اشتباهات من", desc: mistakeCount ? `${faNum(mistakeCount)} سؤال برای مرور` : "هنوز اشتباهی ثبت نشده", tint: "var(--danger)", onClick: () => setView({ kind: "run", preset: { ...DEFAULT_FILTER, ids: undefined }, title: "اشتباهات من" }), ids: mistakeCount ? mistakes.slice(0, 40) : [] },
    { icon: Bookmark, title: "ذخیره‌شده‌ها", desc: bookmarks.length ? `${faNum(bookmarks.length)} سؤال نشان‌گذاری‌شده` : "هنوز سؤالی نشان نکرده‌اید", onClick: () => setView({ kind: "run", preset: { ...DEFAULT_FILTER }, title: "ذخیره‌شده‌ها" }), ids: bookmarks.slice(0, 40) },
  ];

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <h1 className="pt-4 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
        تمرین
      </h1>
      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
        چقدر بلدم؟ — با برچسب شفاف منبع هر سؤال
      </p>

      <div className="mt-4 space-y-2.5">
        {entries.map((e) => (
          <Card key={e.title} onClick={e.onClick} ariaLabel={e.title}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--muted)", color: e.tint ?? "var(--primary)" }}>
                <e.icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                  {e.title}
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                  {e.desc}
                </p>
              </div>
              <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
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
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <Zap size={17} style={{ color: "var(--primary)" }} />
            <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
              {faNum(n)} سؤال
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Filter chip — module-level so it is not re-created during render (React compiler rule) */
function Chip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="min-h-[40px] rounded-full border px-3.5 text-[12px] font-bold transition-colors"
      style={{
        background: on ? "var(--primary)" : "var(--card)",
        color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
        borderColor: on ? "var(--primary)" : "var(--border)",
      }}
    >
      {label}
    </button>
  );
}

/* ═══ Filter sheet (§21) ═══ */
function FilterSheet({
  initial,
  title,
  bootstrap,
  onCancel,
  onApply,
}: {
  initial: Filter;
  title: string;
  bootstrap: Bootstrap | null;
  onCancel: () => void;
  onApply: (f: Filter) => void;
}) {
  const [f, setF] = useState<Filter>(initial);
  const mabhasList = (bootstrap?.mabhasIndex ?? []).map((m) => m.mabhas);
  const toggleDiff = (d: "easy" | "medium" | "hard") =>
    setF((s) => ({ ...s, difficulty: s.difficulty.includes(d) ? s.difficulty.filter((x) => x !== d) : [...s.difficulty, d] }));

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <div className="flex items-center gap-2 pt-4">
        <button onClick={onCancel} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <h1 className="flex-1 text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          {title}
        </h1>
        <SlidersHorizontal size={17} style={{ color: "var(--primary)" }} />
      </div>

      <SectionHeader title="مبحث" />
      <div className="flex flex-wrap gap-2">
        <Chip on={f.mabhas === null} label="همه مباحث" onClick={() => setF((s) => ({ ...s, mabhas: null }))} />
        {mabhasList.map((m) => (
          <Chip key={m} on={f.mabhas === m} label={`مبحث ${faNum(m)}`} onClick={() => setF((s) => ({ ...s, mabhas: m }))} />
        ))}
      </div>

      <SectionHeader title="نوع منبع" />
      <div className="flex flex-wrap gap-2">
        {[
          { v: "ALL" as const, l: "همه" },
          { v: "OFFICIAL_EXAM" as const, l: "فقط رسمی" },
          { v: "AUTHORED" as const, l: "فقط تألیفی" },
        ].map((o) => (
          <Chip key={o.v} on={f.sourceType === o.v} label={o.l} onClick={() => setF((s) => ({ ...s, sourceType: o.v }))} />
        ))}
      </div>

      <SectionHeader title="سطح دشواری" />
      <div className="flex flex-wrap gap-2">
        {(["easy", "medium", "hard"] as const).map((d) => (
          <Chip key={d} on={f.difficulty.includes(d)} label={d === "easy" ? "آسان" : d === "medium" ? "متوسط" : "سخت"} onClick={() => toggleDiff(d)} />
        ))}
      </div>

      <SectionHeader title="وضعیت" />
      <Chip on={f.unsolvedOnly} label="فقط حل‌نشده" onClick={() => setF((s) => ({ ...s, unsolvedOnly: !s.unsolvedOnly }))} />

      <div className="mt-6">
        <Btn full size="lg" onClick={() => onApply(f)}>
          <Play size={17} />
          شروع تمرین با این فیلترها
        </Btn>
      </div>
    </div>
  );
}

/* ═══ Practice runner ═══ */
function PracticeRunner({
  filter,
  title,
  major,
  onExit,
}: {
  filter: Filter;
  title: string;
  major: string | null;
  onExit: () => void;
}) {
  const { answers, recordAnswer, mistakes, bookmarks } = useMhy();
  const [items, setItems] = useState<MhyQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (major) params.set("major", major);
    if (filter.mabhas != null) params.set("mabhas", String(filter.mabhas));
    if (filter.sourceType !== "ALL") params.set("sourceType", filter.sourceType);
    if (filter.difficulty.length) params.set("difficulty", filter.difficulty.join(","));
    params.set("limit", "20");
    api.questions(params)
      .then((j) => {
        let list: MhyQuestion[] = j.items ?? [];
        if (title === "اشتباهات من") {
          const ids = mistakes.slice(0, 20);
          list = list.filter((q) => ids.includes(q.id));
        } else if (title === "ذخیره‌شده‌ها") {
          const ids = bookmarks.slice(0, 20);
          list = list.filter((q) => ids.includes(q.id));
        }
        if (filter.unsolvedOnly) list = list.filter((q) => !(q.id in answers));
        setItems(list);
      })
      .catch(() => setItems([]));
     
  }, []);

  if (items === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          بارگذاری سؤالات…
        </p>
      </div>
    );
  }
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

  const q = items[idx];
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <QuestionRunner
        question={q}
        index={idx}
        total={items.length}
        mode="practice"
        onAnswer={recordAnswer}
        onNext={() => (idx + 1 >= items.length ? onExit() : setIdx((i) => i + 1))}
        onPrev={() => setIdx((i) => Math.max(0, i - 1))}
        onExit={onExit}
      />
    </div>
  );
}
