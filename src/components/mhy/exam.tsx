"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyQuestion } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum, scoreAttempt, generateComprehensive, remainingSec, type ExamAttempt, type AttemptItem, type QLite } from "@/lib/mhy/engines";
import { Card, SectionHeader, EmptyState, Btn, StatTile, SourceBadge, ReviewFlagBadge, MabhasChip, ProgressBar } from "./ui";
import { QuestionRunner } from "./question-runner";
import {
  ShieldCheck,
  Zap,
  Layers,
  SlidersHorizontal,
  Timer,
  AlertCircle,
  ChevronLeft,
  Check,
  X,
  Circle,
  Flag,
  ClipboardList,
  RotateCcw,
  TrendingDown,
} from "lucide-react";

type EView =
  | { kind: "root" }
  | { kind: "official-list" }
  | { kind: "custom" }
  | { kind: "run"; qids: number[]; mode: "OFFICIAL" | "QUICK" | "CUSTOM" | "COMPREHENSIVE"; title: string; durationMin: number }
  | { kind: "result"; attempt: ExamAttempt };

export default function Exam({
  bootstrap,
  major,
  presetKind,
  onPresetConsumed,
}: {
  bootstrap: Bootstrap | null;
  major: string | null;
  presetKind: "official" | "quick" | "comprehensive" | null;
  onPresetConsumed: () => void;
}) {
  const [view, setView] = useState<EView>({ kind: "root" });

  useEffect(() => {
    if (!presetKind) return;
    const t = setTimeout(() => {
      if (presetKind === "official") setView({ kind: "official-list" });
      else if (presetKind === "quick") {
        // start a quick 10-question exam immediately
        api.questions(`${major ? `major=${major}&` : ""}limit=10`)
          .then((j) => setView({ kind: "run", qids: (j.items ?? []).map((q: MhyQuestion) => q.id), mode: "QUICK", title: "آزمون سریع", durationMin: 15 }))
          .catch(() => setView({ kind: "root" }));
      } else if (presetKind === "comprehensive") setView({ kind: "custom" });
      onPresetConsumed();
    }, 0);
    return () => clearTimeout(t);
     
  }, [presetKind]);

  if (view.kind === "run") {
    return <ExamRunner {...view} major={major} onExit={() => setView({ kind: "root" })} onFinish={(a) => setView({ kind: "result", attempt: a })} />;
  }
  if (view.kind === "result") {
    return <ExamResult attempt={view.attempt} onHome={() => setView({ kind: "root" })} onReview={() => setView({ kind: "run", qids: view.attempt.items.map((i) => i.qid), mode: view.attempt.kind, title: `مرور ${view.attempt.title}`, durationMin: 0 })} />;
  }
  if (view.kind === "official-list") {
    return <OfficialSessions bootstrap={bootstrap} major={major} onBack={() => setView({ kind: "root" })} onPick={(session) => { /* handled below */ }} startRun={(qids, title, min) => setView({ kind: "run", qids, mode: "OFFICIAL", title, durationMin: min })} />;
  }
  if (view.kind === "custom") {
    return <CustomExam bootstrap={bootstrap} major={major} onBack={() => setView({ kind: "root" })} onStart={(qids, title, min, mode) => setView({ kind: "run", qids, mode, title, durationMin: min })} />;
  }

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <h1 className="pt-4 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
        آزمون
      </h1>
      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
        آیا برای آزمون آماده‌ام؟
      </p>

      <div className="mt-4 space-y-2.5">
        <Card onClick={() => setView({ kind: "official-list" })} ariaLabel="آزمون‌های رسمی">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                آزمون‌های رسمی
              </p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                {faNum(bootstrap?.sessions.length ?? 0)} جلسه واقعی · همان سؤالات، همان ترتیب، همان مدت
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
        <Card onClick={() => setView({ kind: "custom" })} ariaLabel="آزمون جامع و سفارشی">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <Layers size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                آزمون جامع / سفارشی
              </p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                پوشش متوازن مباحث با مولد قاعده‌محور
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      </div>

      <SectionHeader title="آزمون سریع" />
      <div className="grid grid-cols-3 gap-2.5">
        {[5, 10, 20].map((n) => (
          <QuickCard key={n} n={n} major={major} onStart={(qids) => setView({ kind: "run", qids, mode: "QUICK", title: `آزمون سریع ${faNum(n)} سؤالی`, durationMin: Math.max(5, Math.round(n * 1.2)) })} />
        ))}
      </div>

      <SectionHeader title="تاریخچه آزمون‌ها" />
      <AttemptHistory />
    </div>
  );
}

function QuickCard({ n, major, onStart }: { n: number; major: string | null; onStart: (qids: number[]) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          const j = await api.questions(`${major ? `major=${major}&` : ""}limit=${n}`);
          onStart((j.items ?? []).map((q: MhyQuestion) => q.id));
        } finally {
          setBusy(false);
        }
      }}
      className="flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-2xl border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <Zap size={17} style={{ color: "var(--primary)" }} />
      <span className="text-[11px] font-bold" style={{ color: "var(--foreground)" }}>
        {faNum(n)} سؤال
      </span>
    </button>
  );
}

/* ═══ Official sessions — exact real exam sets (§27) ═══ */
function OfficialSessions({
  bootstrap,
  major,
  onBack,
  startRun,
}: {
  bootstrap: Bootstrap | null;
  major: string | null;
  onBack: () => void;
  onPick: (s: string) => void;
  startRun: (qids: number[], title: string, min: number) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MhyQuestion[] | null>(null);
  const sessions = bootstrap?.sessions ?? [];

  const pick = async (s: string) => {
    setSel(s);
    const params = new URLSearchParams();
    if (major) params.set("major", major);
    params.set("sourceType", "OFFICIAL_EXAM");
    params.set("limit", "120");
    const j = await api.questions(params);
    const qs: MhyQuestion[] = (j.items ?? []).filter((q: MhyQuestion) => q.examSession === s);
    // real order by exam_qnum (§27/§91)
    qs.sort((a, b) => (a.examQnum ?? 99) - (b.examQnum ?? 99));
    setQuestions(qs);
  };

  if (questions && sel) {
    const hasUnverified = questions.some((q) => q.status === "REVIEW_REQUIRED");
    const duration = Math.max(10, Math.ceil(questions.length * 1.2));
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <div className="flex items-center gap-2 pt-4">
          <button onClick={() => { setQuestions(null); setSel(null); }} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
            <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
          </button>
          <h1 className="flex-1 text-[15.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
            آزمون {sel}
          </h1>
        </div>
        <Card className="mt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile value={faNum(questions.length)} label="سؤال (همان مجموعه واقعی)" />
            <StatTile value={faNum(duration) + " دقیقه"} label="مدت آزمون" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {questions.slice(0, 3).map((q) => (
              <SourceBadge key={q.id} sourceType={q.sourceType} session={q.examSession} qnum={q.examQnum} />
            ))}
            {questions.length > 3 && <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>…</span>}
          </div>
          {hasUnverified && (
            <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: "var(--warning-soft)" }}>
              <AlertCircle size={15} style={{ color: "var(--warning)" }} className="mt-0.5 shrink-0" />
              <p className="text-[10.5px] leading-5" style={{ color: "var(--warning)" }}>
                برخی سؤالات این جلسه در داده اصلی پرچم «نیازمند بازبینی» دارند و بدون ابراز نظر، علامت‌گذاری می‌شوند.
              </p>
            </div>
          )}
        </Card>
        <div className="mt-4">
          <Btn
            full
            size="lg"
            onClick={() => startRun(questions.map((q) => q.id), `آزمون رسمی ${sel}`, duration)}
            disabled={questions.length === 0}
          >
            شروع آزمون رسمی
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <div className="flex items-center gap-2 pt-4">
        <button onClick={onBack} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <h1 className="flex-1 text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          جلسات رسمی
        </h1>
      </div>
      <p className="mt-2 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
        جلسه را انتخاب کنید — سؤالات با شماره و ترتیب واقعی آزمون ارائه می‌شوند.
      </p>
      <div className="mt-3 space-y-2">
        {sessions.map((s) => (
          <Card key={s.session} onClick={() => pick(s.session)} ariaLabel={`آزمون ${s.session}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <ClipboardList size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                  آزمون {s.session}
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                  {faNum(s.count)} سؤال رسمی در کتابخانه
                </p>
              </div>
              <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══ Custom + Comprehensive (§26/§28) ═══ */
function CustomExam({
  bootstrap,
  major,
  onBack,
  onStart,
}: {
  bootstrap: Bootstrap | null;
  major: string | null;
  onBack: () => void;
  onStart: (qids: number[], title: string, min: number, mode: "CUSTOM" | "COMPREHENSIVE") => void;
}) {
  const [count, setCount] = useState(30);
  const [sourceMix, setSourceMix] = useState<"ALL" | "OFFICIAL_EXAM" | "AUTHORED">("ALL");
  const [mabhasSel, setMabhasSel] = useState<number[]>([]);
  const [pool, setPool] = useState<QLite[] | null>(null);
  const [busy, setBusy] = useState(false);
  const { answers, addAttempt, markSessionSeen } = useMhy();

  useEffect(() => {
    const params = new URLSearchParams();
    if (major) params.set("major", major);
    if (sourceMix !== "ALL") params.set("sourceType", sourceMix);
    params.set("limit", "1500");
    api.questions(params)
      .then((j) => setPool((j.items ?? []).map((q: MhyQuestion) => ({ id: q.id, mabhas: q.mabhas, difficulty: q.difficulty, sourceType: q.sourceType, topic: q.topic, status: q.status }))))
      .catch(() => setPool([]));
  }, [major, sourceMix]);

  const filteredPool = useMemo(() => (pool ?? []).filter((q) => (mabhasSel.length ? q.mabhas != null && mabhasSel.includes(q.mabhas) : true)), [pool, mabhasSel]);

  const startComprehensive = () => {
    if (!pool) return;
    setBusy(true);
    // rule-based generator with coverage (no naive random)
    const ids = generateComprehensive(pool, answers, Math.min(count, pool.length), Date.now() % 100000);
    const min = Math.max(15, Math.round(ids.length * 1.2));
    setTimeout(() => {
      setBusy(false);
      onStart(ids, "آزمون جامع", min, "COMPREHENSIVE");
    }, 50);
  };

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <div className="flex items-center gap-2 pt-4">
        <button onClick={onBack} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <h1 className="flex-1 text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          آزمون جامع / سفارشی
        </h1>
      </div>

      <SectionHeader title="تعداد سؤال" />
      <div className="flex gap-2">
        {[20, 30, 60].map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            aria-pressed={count === n}
            className="min-h-[44px] flex-1 rounded-xl border text-[13px] font-bold"
            style={{
              background: count === n ? "var(--primary)" : "var(--card)",
              color: count === n ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderColor: count === n ? "var(--primary)" : "var(--border)",
            }}
          >
            {faNum(n)}
          </button>
        ))}
      </div>

      <SectionHeader title="ترکیب منبع" />
      <div className="flex flex-wrap gap-2">
        {[
          { v: "ALL" as const, l: "رسمی + تألیفی" },
          { v: "OFFICIAL_EXAM" as const, l: "فقط رسمی" },
          { v: "AUTHORED" as const, l: "فقط تألیفی" },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => { setSourceMix(o.v); setPool(null); }}
            aria-pressed={sourceMix === o.v}
            className="min-h-[40px] rounded-full border px-3.5 text-[12px] font-bold"
            style={{
              background: sourceMix === o.v ? "var(--primary)" : "var(--card)",
              color: sourceMix === o.v ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderColor: sourceMix === o.v ? "var(--primary)" : "var(--border)",
            }}
          >
            {o.l}
          </button>
        ))}
      </div>

      <SectionHeader title="مباحث (خالی = همه مباحث با پوشش متوازن)" />
      <div className="flex flex-wrap gap-2">
        {(bootstrap?.mabhasIndex ?? []).map((m) => {
          const on = mabhasSel.includes(m.mabhas);
          return (
            <button
              key={m.mabhas}
              onClick={() => setMabhasSel((s) => (on ? s.filter((x) => x !== m.mabhas) : [...s, m.mabhas]))}
              aria-pressed={on}
              className="min-h-[40px] rounded-full border px-3.5 text-[12px] font-bold"
              style={{
                background: on ? "var(--primary)" : "var(--card)",
                color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
                borderColor: on ? "var(--primary)" : "var(--border)",
              }}
            >
              مبحث {faNum(m.mabhas)}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        {pool === null ? "در حال آماده‌سازی…" : `${faNum(filteredPool.length)} سؤال در این فیلتر موجود است`}
      </p>

      <div className="mt-4 space-y-2.5">
        <Btn full size="lg" onClick={startComprehensive} disabled={busy || !pool?.length}>
          <Layers size={17} />
          شروع آزمون جامع (پوشش متوازن)
        </Btn>
      </div>
    </div>
  );
}

/* ═══ Exam runner with timestamp-based timer (§89) ═══ */
function ExamRunner({
  qids,
  mode,
  title,
  durationMin,
  major,
  onExit,
  onFinish,
}: {
  qids: number[];
  mode: "OFFICIAL" | "QUICK" | "CUSTOM" | "COMPREHENSIVE";
  title: string;
  durationMin: number;
  major: string | null;
  onExit: () => void;
  onFinish: (a: ExamAttempt) => void;
}) {
  const [questions, setQuestions] = useState<MhyQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [startedAt] = useState(() => Date.now());
  const [left, setLeft] = useState(durationMin * 60);
  const { addAttempt, markSessionSeen } = useMhy();

  useEffect(() => {
    if (!qids.length) {
      const t = setTimeout(() => setQuestions([]), 0);
      return () => clearTimeout(t);
    }
    api.questions(`ids=${qids.join(",")}&limit=${qids.length}`)
      .then((j) => setQuestions(j.items ?? []))
      .catch(() => setQuestions([]));
  }, [qids]);

  // timestamp-derived countdown
  useEffect(() => {
    if (durationMin === 0) return;
    const t = setInterval(() => {
      const rem = remainingSec(startedAt, durationMin * 60);
      setLeft(rem);
      if (rem === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [durationMin, startedAt]);

  if (questions === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          آماده‌سازی آزمون…
        </p>
      </div>
    );
  }
  if (!questions.length) {
    return <EmptyState icon={AlertCircle} title="سؤالی برای این آزمون یافت نشد" desc="فیلترها یا جلسه دیگری را انتخاب کنید." action={{ label: "بازگشت", onClick: onExit }} />;
  }

  const submit = () => {
    const items: AttemptItem[] = questions.map((q) => {
      const choice = selections[q.id] ?? null;
      return { qid: q.id, choice, correct: choice === null ? null : choice === q.answer, flagged: marked.has(q.id) };
    });
    const mabhasOf: Record<number, number | null> = {};
    for (const q of questions) mabhasOf[q.id] = q.mabhas;
    const attempt: ExamAttempt = {
      id: `att-${Date.now()}`,
      kind: mode,
      title,
      startedAt,
      finishedAt: Date.now(),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      items,
      mabhasOf,
    };
    // also record into answers for mastery
    const { recordAnswer } = useMhy.getState();
    for (const it of items) recordAnswer(it.qid, it.choice, it.correct);
    if (mode === "OFFICIAL") {
      const s = questions[0]?.examSession;
      if (s) markSessionSeen(s);
    }
    addAttempt(attempt);
    onFinish(attempt);
  };

  const q = questions[idx];
  const answeredN = Object.keys(selections).length;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const lowTime = left < 120 && durationMin > 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden screen-in">
      {/* exam chrome */}
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button onClick={onExit} aria-label="خروج از آزمون" className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: "var(--danger)" }}>
          <X size={19} />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
            {title}
          </p>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {faNum(answeredN)} از {faNum(questions.length)} پاسخ داده شده
          </p>
        </div>
        {durationMin > 0 ? (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] font-extrabold"
            style={{ background: lowTime ? "var(--danger-soft)" : "var(--primary-soft)", color: lowTime ? "var(--danger)" : "var(--primary)" }}
            aria-label="زمان باقی‌مانده"
          >
            <Timer size={13} />
            {faNum(mm)}:{faNum(ss)}
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* nav grid (§27) */}
      <div className="phone-scroll flex gap-1.5 overflow-x-auto px-4 py-2.5" style={{ background: "var(--card)" }} role="tablist" aria-label="ناوبری سؤالات">
        {questions.map((qq, i) => {
          const answered = selections[qq.id] != null;
          const flagged = marked.has(qq.id);
          const current = i === idx;
          return (
            <button
              key={qq.id}
              onClick={() => setIdx(i)}
              aria-label={`سوال ${i + 1}${answered ? " پاسخ‌داده" : ""}${flagged ? " نشان‌گذاری‌شده" : ""}`}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
              style={{
                background: current ? "var(--primary)" : answered ? "var(--success-soft)" : "var(--muted)",
                color: current ? "var(--primary-foreground)" : answered ? "var(--success)" : "var(--muted-foreground)",
                border: current ? "2px solid var(--primary)" : "1px solid var(--border)",
              }}
            >
              {faNum(i + 1)}
              {flagged && (
                <Flag size={8} className="absolute left-0.5 top-0.5" style={{ color: current ? "#fff" : "var(--warning)" }} fill="currentColor" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        <QuestionRunner
          question={q}
          index={idx}
          total={questions.length}
          mode="official-exam"
          locked
          selected={selections[q.id] ?? null}
          onSelect={(c) => setSelections((s) => ({ ...s, [q.id]: c }))}
          onNext={() => (idx + 1 >= questions.length ? undefined : setIdx((i) => i + 1))}
          onPrev={() => setIdx((i) => Math.max(0, i - 1))}
        />
      </div>

      {/* actions */}
      <div className="flex gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <Btn
          variant="secondary"
          onClick={() => setMarked((s) => { const n = new Set(s); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })}
          ariaLabel="علامت‌گذاری برای بازبینی"
        >
          <Flag size={16} style={{ color: marked.has(q.id) ? "var(--warning)" : undefined, fill: marked.has(q.id) ? "var(--warning)" : "none" }} />
          نشان
        </Btn>
        <div className="flex-1">
          <Btn full onClick={submit}>
            تحویل و مشاهده کارنامه
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══ Result (§30) — reproducible scoring + per-mabhas analysis ═══ */
function ExamResult({ attempt, onHome, onReview }: { attempt: ExamAttempt; onHome: () => void; onReview: () => void }) {
  const s = useMemo(() => scoreAttempt(attempt), [attempt]);
  const pass = s.accuracyPct >= 60;
  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <div className="flex flex-col items-center pt-7 text-center">
        <div
          className="pop-in relative flex h-36 w-36 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${pass ? "var(--success)" : "var(--danger)"} ${s.accuracyPct * 3.6}deg, var(--muted) 0deg)` }}
          role="img"
          aria-label={`نمره: ${faNum(s.accuracyPct)} درصد`}
        >
          <div className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full" style={{ background: "var(--card)" }}>
            <span className="text-[28px] font-extrabold" style={{ color: "var(--foreground)" }}>
              ٪{faNum(s.accuracyPct)}
            </span>
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              دقت پاسخ‌های داده‌شده
            </span>
          </div>
        </div>
        <h1 className="mt-4 text-[17px] font-extrabold" style={{ color: "var(--foreground)" }}>
          {pass ? "آفرین! عملکرد خوبی داشتید" : "تلاش کنید! بار دیگر تمرین کنید"}
        </h1>
        <p className="mt-1 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
          {attempt.title} · {faNum(Math.round(attempt.durationSec / 60))} دقیقه
        </p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        <StatTile value={faNum(s.correct)} label="درست" color="var(--success)" />
        <StatTile value={faNum(s.wrong)} label="نادرست" color="var(--danger)" />
        <StatTile value={faNum(s.unanswered)} label="بی‌پاسخ" color="var(--warning)" />
        <StatTile value={faNum(s.total)} label="کل" />
      </div>

      <SectionHeader title="تحلیل بر اساس مبحث" />
      <div className="space-y-2.5">
        {Object.entries(s.perMabhas)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([m, v]) => {
            const n = v.correct + v.wrong;
            const pct = n ? Math.round((v.correct / n) * 100) : 0;
            return (
              <div key={m} className="rounded-2xl border p-3.5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between text-[12px] font-bold">
                  <span style={{ color: "var(--foreground)" }}>{m === "0" ? "عمومی" : mabhasTitle(Number(m))}</span>
                  <span style={{ color: pct >= 60 ? "var(--success)" : "var(--danger)" }}>٪{faNum(pct)}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar pct={pct} color={pct >= 60 ? "var(--success)" : "var(--danger)"} height={6} />
                </div>
                <p className="mt-1.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                  {faNum(v.correct)} درست · {faNum(v.wrong)} نادرست{v.unanswered ? ` · ${faNum(v.unanswered)} بی‌پاسخ` : ""}
                </p>
              </div>
            );
          })}
      </div>

      <div className="mt-6 space-y-2.5">
        <Btn full onClick={onReview}>
          <RotateCcw size={16} />
          مرور سؤالات این آزمون
        </Btn>
        <Btn full variant="secondary" onClick={onHome}>
          بازگشت به آزمون‌ها
        </Btn>
      </div>
    </div>
  );
}

function AttemptHistory() {
  const { attempts } = useMhy();
  if (!attempts.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="هنوز آزمونی نداده‌اید"
        desc="با یک آزمون سریع شروع کنید یا یکی از جلسات رسمی را شبیه‌سازی کنید."
      />
    );
  }
  return (
    <div className="space-y-2">
      {attempts.slice(0, 5).map((a) => {
        const s = scoreAttempt(a);
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-2xl border p-3.5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold"
              style={{ background: s.accuracyPct >= 60 ? "var(--success-soft)" : "var(--danger-soft)", color: s.accuracyPct >= 60 ? "var(--success)" : "var(--danger)" }}
            >
              ٪{faNum(s.accuracyPct)}
            </div>
            <div className="flex-1">
              <p className="truncate text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                {a.title}
              </p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                {faNum(s.correct)} درست از {faNum(s.total)} · {new Date(a.finishedAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
