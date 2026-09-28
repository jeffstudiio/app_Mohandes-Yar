"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyQuestion } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum, scoreAttempt, generateComprehensive, remainingSec, type ExamAttempt, type AttemptItem, type QLite } from "@/lib/mhy/engines";
import { Card, SectionHeader, EmptyState, Btn, StatTile, SourceBadge, ReviewFlagBadge, MabhasChip, ProgressBar, SearchField, LoadingBlock, MeterRows, ProgressRing, ListItem, SegmentedControl, TechFrame, Eyebrow, CompareCard } from "./ui";
import { QuestionRunner } from "./question-runner";
import {
  ShieldCheck,
  Zap,
  Layers,
  Timer,
  AlertCircle,
  ChevronLeft,
  Check,
  X,
  Flag,
  ClipboardList,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  History,
} from "lucide-react";

type EView =
  | { kind: "root" }
  | { kind: "official-list" }
  | { kind: "custom" }
  | { kind: "run"; qids: number[]; mode: "OFFICIAL" | "QUICK" | "CUSTOM" | "COMPREHENSIVE"; title: string; durationMin: number }
  | { kind: "result"; attempt: ExamAttempt };

export default function Exam({
  bootstrap,
  majors,
  presetKind,
  onPresetConsumed,
}: {
  bootstrap: Bootstrap | null;
  majors: string[];
  presetKind: "official" | "quick" | "comprehensive" | null;
  onPresetConsumed: () => void;
}) {
  const [view, setView] = useState<EView>({ kind: "root" });

  useEffect(() => {
    if (!presetKind) return;
    const t = setTimeout(() => {
      if (presetKind === "official") setView({ kind: "official-list" });
      else if (presetKind === "quick") {
        api.questionsForMajors(majors, { limit: 10 })
          .then((j) => setView({ kind: "run", qids: (j.items ?? []).map((q: MhyQuestion) => q.id), mode: "QUICK", title: "آزمون سریع", durationMin: 15 }))
          .catch(() => setView({ kind: "root" }));
      } else if (presetKind === "comprehensive") setView({ kind: "custom" });
      onPresetConsumed();
    }, 0);
    return () => clearTimeout(t);
  }, [presetKind]);

  if (view.kind === "run") {
    return <ExamRunner {...view} majors={majors} onExit={() => setView({ kind: "root" })} onFinish={(a) => setView({ kind: "result", attempt: a })} />;
  }
  if (view.kind === "result") {
    return (
      <ExamResult
        attempt={view.attempt}
        onHome={() => setView({ kind: "root" })}
        onReview={() =>
          setView({ kind: "run", qids: view.attempt.items.map((i) => i.qid), mode: view.attempt.kind, title: `مرور ${view.attempt.title}`, durationMin: 0 })
        }
      />
    );
  }
  if (view.kind === "official-list") {
    return <OfficialSessions bootstrap={bootstrap} majors={majors} onBack={() => setView({ kind: "root" })} startRun={(qids, title, min) => setView({ kind: "run", qids, mode: "OFFICIAL", title, durationMin: min })} />;
  }
  if (view.kind === "custom") {
    return <CustomExam bootstrap={bootstrap} majors={majors} onBack={() => setView({ kind: "root" })} onStart={(qids, title, min, mode) => setView({ kind: "run", qids, mode, title, durationMin: min })} />;
  }

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <h1 className="t-title pt-4">آزمون</h1>
      <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
        آیا برای آزمون آماده‌ام؟
      </p>

      <div className="mt-4 space-y-2.5">
        <Card onClick={() => setView({ kind: "official-list" })} ariaLabel="آزمون‌های رسمی" elevated>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--grad-hero)", color: "#fff" }}>
              <ShieldCheck size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                آزمون‌های رسمی
              </p>
              <p className="num mt-0.5 t-caption" style={{ color: "var(--muted-foreground)" }}>
                {faNum(bootstrap?.sessions.length ?? 0)} جلسه واقعی · همان سؤالات، همان ترتیب، همان مدت
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
        <Card onClick={() => setView({ kind: "custom" })} ariaLabel="آزمون جامع و سفارشی">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <Layers size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                آزمون جامع / سفارشی
              </p>
              <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
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
          <QuickCard key={n} n={n} majors={majors} onStart={(qids) => setView({ kind: "run", qids, mode: "QUICK", title: `آزمون سریع ${faNum(n)} سؤالی`, durationMin: Math.max(5, Math.round(n * 1.2)) })} />
        ))}
      </div>

      <SectionHeader title="تاریخچه آزمون‌ها" />
      <AttemptHistory />
    </div>
  );
}

function QuickCard({ n, majors, onStart }: { n: number; majors: string[]; onStart: (qids: number[]) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          const j = await api.questionsForMajors(majors, { limit: n });
          onStart((j.items ?? []).map((q: MhyQuestion) => q.id));
        } finally {
          setBusy(false);
        }
      }}
      className="press flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-2xl border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <Zap size={17} style={{ color: "var(--primary)" }} />
      <span className="num text-[11.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
        {faNum(n)} سؤال
      </span>
    </button>
  );
}

/* ═══ Official sessions — exact real exam sets, searchable (§10/§27) ═══ */
function OfficialSessions({
  bootstrap,
  majors,
  onBack,
  startRun,
}: {
  bootstrap: Bootstrap | null;
  majors: string[];
  onBack: () => void;
  startRun: (qids: number[], title: string, min: number) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MhyQuestion[] | null>(null);
  const [q, setQ] = useState("");
  const sessions = bootstrap?.sessions ?? [];
  const filtered = q.trim() ? sessions.filter((s) => s.session.includes(q.trim())) : sessions;

  const pick = async (s: string) => {
    setSel(s);
    setLoading(true);
    try {
      const j = await api.questionsForMajors(majors, { sourceType: "OFFICIAL_EXAM", limit: 200 });
      const qs: MhyQuestion[] = (j.items ?? []).filter((x: MhyQuestion) => x.examSession === s);
      // real order by exam_qnum (§27/§91)
      qs.sort((a, b) => (a.examQnum ?? 99) - (b.examQnum ?? 99));
      setQuestions(qs);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingBlock label="آماده‌سازی جلسه…" />;

  if (questions && sel) {
    const hasUnverified = questions.some((q2) => q2.status === "REVIEW_REQUIRED");
    const duration = Math.max(10, Math.ceil(questions.length * 1.2));
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <div className="flex items-center gap-2 pt-4">
          <button onClick={() => { setQuestions(null); setSel(null); }} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
            <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
          </button>
          <h1 className="flex-1 text-[15.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
            آزمون {sel}
          </h1>
        </div>
        <Card className="mt-3" elevated>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile value={faNum(questions.length)} label="سؤال (همان مجموعه واقعی)" />
            <StatTile value={faNum(duration) + " دقیقه"} label="مدت آزمون" icon={Timer} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {questions.slice(0, 3).map((q2) => (
              <SourceBadge key={q2.id} sourceType={q2.sourceType} session={q2.examSession} qnum={q2.examQnum} />
            ))}
            {questions.length > 3 && <span className="t-meta self-center">…</span>}
          </div>
          {hasUnverified && (
            <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: "var(--warning-soft)" }}>
              <AlertCircle size={15} style={{ color: "var(--warning)" }} className="mt-0.5 shrink-0" />
              <p className="t-caption leading-5" style={{ color: "var(--warning)" }}>
                برخی سؤالات این جلسه در داده اصلی پرچم «نیازمند بازبینی» دارند و بدون ابراز نظر، علامت‌گذاری می‌شوند.
              </p>
            </div>
          )}
        </Card>
        <div className="mt-4">
          <Btn full size="lg" onClick={() => startRun(questions.map((q2) => q2.id), `آزمون رسمی ${sel}`, duration)} disabled={questions.length === 0}>
            شروع آزمون رسمی
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <div className="flex items-center gap-2 px-1 pt-4">
        <button onClick={onBack} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <h1 className="flex-1 text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          جلسات رسمی
        </h1>
      </div>
      <p className="t-caption mt-1 px-1" style={{ color: "var(--muted-foreground)" }}>
        جلسه را انتخاب کنید — سؤالات با شماره و ترتیب واقعی آزمون ارائه می‌شوند.
      </p>
      <div className="mt-3">
        <SearchField value={q} onChange={setQ} placeholder="جستجوی جلسه…" ariaLabel="جستجوی جلسه" />
      </div>
      <div className="mt-3 space-y-2">
        {filtered.map((s) => (
          <Card key={s.session} onClick={() => pick(s.session)} ariaLabel={`آزمون ${s.session}`}>
            <div className="flex items-center gap-3">
              <div className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <ClipboardList size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                  {s.session}
                </p>
                <p className="num mt-0.5 t-caption" style={{ color: "var(--muted-foreground)" }}>
                  {faNum(s.count)} سؤال رسمی · {faNum(s.majors)} رشته
                </p>
              </div>
              <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
            </div>
          </Card>
        ))}
        {!filtered.length && (
          <p className="py-8 text-center t-body-sm" style={{ color: "var(--muted-foreground)" }}>
            جلسه‌ای با این عبارت پیدا نشد.
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══ Custom + Comprehensive (§26/§28) ═══ */
function CustomExam({
  bootstrap,
  majors,
  onBack,
  onStart,
}: {
  bootstrap: Bootstrap | null;
  majors: string[];
  onBack: () => void;
  onStart: (qids: number[], title: string, min: number, mode: "CUSTOM" | "COMPREHENSIVE") => void;
}) {
  const [count, setCount] = useState(30);
  const [sourceMix, setSourceMix] = useState<"ALL" | "OFFICIAL_EXAM" | "AUTHORED">("ALL");
  const [mabhasSel, setMabhasSel] = useState<number[]>([]);
  const [pool, setPool] = useState<QLite[] | null>(null);
  const [busy, setBusy] = useState(false);
  const { answers } = useMhy();

  useEffect(() => {
    let cancelled = false;
    api.questionsForMajors(majors, { sourceType: sourceMix !== "ALL" ? sourceMix : undefined, limit: 1500 })
      .then((j) => {
        if (!cancelled)
          setPool((j.items ?? []).map((q: MhyQuestion) => ({ id: q.id, mabhas: q.mabhas, difficulty: q.difficulty, sourceType: q.sourceType, topic: q.topic, status: q.status })));
      })
      .catch(() => !cancelled && setPool([]));
    return () => {
      cancelled = true;
    };
  }, [majors, sourceMix]);

  const filteredPool = useMemo(() => (pool ?? []).filter((q) => (mabhasSel.length ? q.mabhas != null && mabhasSel.includes(q.mabhas) : true)), [pool, mabhasSel]);

  const startComprehensive = () => {
    if (!pool) return;
    setBusy(true);
    // rule-based generator with coverage (no naive random)
    const ids = generateComprehensive(filteredPool, answers, Math.min(count, filteredPool.length), Date.now() % 100000);
    const min = Math.max(15, Math.round(ids.length * 1.2));
    setTimeout(() => {
      setBusy(false);
      onStart(ids, "آزمون جامع", min, "COMPREHENSIVE");
    }, 50);
  };

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <div className="flex items-center gap-2 pt-4">
        <button onClick={onBack} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <h1 className="flex-1 text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
          آزمون جامع / سفارشی
        </h1>
      </div>

      <SectionHeader title="تعداد سؤال" />
      <SegmentedControl
        ariaLabel="تعداد سؤال"
        value={String(count)}
        onChange={(v) => setCount(Number(v))}
        options={[
          { value: "20", label: "۲۰" },
          { value: "30", label: "۳۰" },
          { value: "60", label: "۶۰" },
        ]}
      />

      <SectionHeader title="ترکیب منبع" />
      <SegmentedControl
        ariaLabel="ترکیب منبع"
        value={sourceMix}
        onChange={(v) => {
          setSourceMix(v);
          setPool(null);
        }}
        options={[
          { value: "ALL" as const, label: "رسمی + تألیفی" },
          { value: "OFFICIAL_EXAM" as const, label: "رسمی" },
          { value: "AUTHORED" as const, label: "تألیفی" },
        ]}
      />

      <SectionHeader title="مباحث (خالی = همه با پوشش متوازن)" />
      <div className="flex flex-wrap gap-2">
        {(bootstrap?.mabhasIndex ?? []).map((m) => {
          const on = mabhasSel.includes(m.mabhas);
          return (
            <button
              key={m.mabhas}
              onClick={() => setMabhasSel((s) => (on ? s.filter((x) => x !== m.mabhas) : [...s, m.mabhas]))}
              aria-pressed={on}
              className="press min-h-[40px] rounded-full border px-3.5 text-[12px] font-bold"
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

      <p className="num mt-4 text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        {pool === null ? "در حال آماده‌سازی…" : `${faNum(filteredPool.length)} سؤال در این فیلتر موجود است`}
      </p>

      <div className="mt-4 space-y-2.5">
        <Btn full size="lg" onClick={startComprehensive} loading={busy} disabled={!pool?.length}>
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
  majors,
  onExit,
  onFinish,
}: {
  qids: number[];
  mode: "OFFICIAL" | "QUICK" | "CUSTOM" | "COMPREHENSIVE";
  title: string;
  durationMin: number;
  majors: string[];
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
    api.questions({ ids: qids, limit: qids.length })
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

  if (questions === null) return <LoadingBlock label="آماده‌سازی آزمون…" />;
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
      {/* exam chrome — focused, minimal (§18) */}
      <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button onClick={onExit} aria-label="خروج از آزمون" className="press flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: "var(--danger)" }}>
          <X size={19} />
        </button>
        <div className="min-w-0 text-center">
          <p className="num truncate text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
            {faNum(idx + 1)} / {faNum(questions.length)}
          </p>
          <p className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
            {faNum(answeredN)} پاسخ داده شده
          </p>
        </div>
        {durationMin > 0 ? (
          <div
            className={`num flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] font-extrabold ${lowTime ? "pulse-soft" : ""}`}
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

      {/* question grid nav */}
      <div className="phone-scroll no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5" style={{ background: "var(--card)" }} role="tablist" aria-label="ناوبری سؤالات">
        {questions.map((qq, i) => {
          const answered = selections[qq.id] != null;
          const flagged = marked.has(qq.id);
          const current = i === idx;
          return (
            <button
              key={qq.id}
              onClick={() => setIdx(i)}
              aria-label={`سوال ${i + 1}${answered ? " پاسخ‌داده" : ""}${flagged ? " نشان‌گذاری‌شده" : ""}`}
              className="num relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
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
      <div className="flex gap-2 border-t px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
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

/* ═══ Result — WOW#3: score reveals itself (ring draw + count-up via animated pct) ═══ */
function ExamResult({ attempt, onHome, onReview }: { attempt: ExamAttempt; onHome: () => void; onReview: () => void }) {
  const { attempts } = useMhy();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(t);
  }, []);
  const s = useMemo(() => scoreAttempt(attempt), [attempt]);

  // comparison vs previous attempt of the same kind (real history, no fake deltas)
  const prev = useMemo(() => {
    const sameKind = attempts.filter((a) => a.kind === attempt.kind && a.id !== attempt.id);
    return sameKind[0] ? scoreAttempt(sameKind[0]) : null;
  }, [attempts, attempt]);
  const delta = prev ? s.accuracyPct - prev.accuracyPct : null;

  const pass = s.accuracyPct >= 60;
  const durMin = Math.max(1, Math.round(attempt.durationSec / 60));

  const perMabhasRows = useMemo(
    () =>
      Object.entries(s.perMabhas)
        .map(([m, v]) => {
          const n = v.correct + v.wrong;
          const pct = n ? Math.round((v.correct / n) * 100) : 0;
          return { m: Number(m), pct, ...v };
        })
        .sort((a, b) => a.pct - b.pct),
    [s]
  );
  const weakAreas = perMabhasRows.filter((r) => r.pct < 60 && r.correct + r.wrong > 0).slice(0, 3);

  return (
    <div className="phone-scroll flex-1 overflow-y-auto pb-6 screen-in">
      {/* score reveal — composition surface, not a card stack */}
      <TechFrame
        className="tech-glow blueprint-grid mx-4 mt-4 overflow-hidden rounded-3xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center px-4 pb-5 pt-5 text-center">
          <Eyebrow tone={pass ? "accent" : "muted"}>کارنامه آزمون</Eyebrow>
          <div className="pop-in mt-3">
            <ProgressRing
              pct={revealed ? s.accuracyPct : 0}
              size={150}
              strokeWidth={12}
              label="دقت پاسخ‌ها"
              color={pass ? "var(--primary)" : "var(--danger)"}
            />
          </div>
          <h1 className="t-title mt-3">{pass ? "آفرین! عملکرد حرفه‌ای بود" : "پایه‌ها را محکم‌تر کنید"}</h1>
          <p className="num t-caption mt-1" style={{ color: "var(--muted-foreground)" }}>
            {attempt.title} · {faNum(durMin)} دقیقه · {new Date(attempt.finishedAt).toLocaleDateString("fa-IR")}
          </p>
          {delta !== null && (
            <span
              className="num mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold"
              style={{
                background: delta >= 0 ? "var(--success-soft)" : "var(--danger-soft)",
                color: delta >= 0 ? "var(--success)" : "var(--danger)",
              }}
            >
              {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {delta >= 0 ? "+" : "−"}
              {faNum(Math.abs(delta))}٪ نسبت به آزمون قبلی
            </span>
          )}
        </div>
      </TechFrame>

      {/* four KPIs — one strong surface, hairline-divided columns */}
      <div className="mx-4 mt-3 flex items-stretch rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }} role="group" aria-label="خلاصه نتیجه">
        {[
          { v: faNum(s.correct), l: "درست", c: "var(--primary)" },
          { v: faNum(s.wrong), l: "نادرست", c: "var(--danger)" },
          { v: faNum(s.unanswered), l: "بی‌پاسخ", c: "var(--warning)" },
          { v: faNum(s.total), l: "کل", c: "var(--foreground)" },
        ].map((x, i) => (
          <div key={x.l} className={`flex-1 py-3 text-center ${i > 0 ? "border-r" : ""}`} style={{ borderColor: "var(--border)" }}>
            <p className="t-kpi num" style={{ fontSize: 18, color: x.c }}>
              {x.v}
            </p>
            <p className="t-meta mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {x.l}
            </p>
          </div>
        ))}
      </div>

      {/* comparison vs previous attempt — slanted divider, winner emphasis */}
      {prev && (
        <section className="mx-4 mt-5" aria-label="مقایسه با آزمون قبلی">
          <Eyebrow>روند عملکرد</Eyebrow>
          <CompareCard
            ariaLabel="مقایسه دقت این آزمون با آزمون قبلی"
            items={[
              { label: "آزمون قبلی", value: `٪${faNum(prev.accuracyPct)}` },
              { label: "این آزمون", value: `٪${faNum(s.accuracyPct)}`, winner: s.accuracyPct >= prev.accuracyPct, hint: delta !== null ? (delta >= 0 ? `${faNum(delta)}٪ رشد` : `${faNum(Math.abs(delta))}٪ افت`) : undefined },
            ]}
          />
        </section>
      )}

      {/* per-mabhas analysis — dense bars, no card */}
      <section className="mx-4 mt-5" aria-label="تحلیل بر اساس مبحث">
        <Eyebrow>تحلیل بر اساس مبحث</Eyebrow>
        <div className="mt-3">
          <MeterRows
            items={perMabhasRows.map((r) => ({
              label: r.m === 0 ? "عمومی" : mabhasTitle(r.m),
              pct: r.pct,
              color: r.pct >= 60 ? "var(--primary)" : "var(--danger)",
              meta: `${faNum(r.correct)} درست · ${faNum(r.wrong)} نادرست${r.unanswered ? ` · ${faNum(r.unanswered)} بی‌پاسخ` : ""}`,
            }))}
          />
        </div>
      </section>

      {/* weak areas → targeted action */}
      {weakAreas.length > 0 && (
        <section className="mx-4 mt-6" aria-label="نیاز به مرور">
          <Eyebrow tone="copper">نیاز به مرور</Eyebrow>
          <div className="mt-2 divide-y" style={{ borderColor: "var(--border)" }}>
            {weakAreas.map((r) => (
              <div key={r.m} className="flex items-center gap-2.5 py-2.5">
                <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10.5px] font-extrabold" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
                  ٪{faNum(r.pct)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                    {mabhasTitle(r.m)}
                  </p>
                  <p className="t-meta" style={{ color: "var(--muted-foreground)" }}>
                    {faNum(r.correct)} درست از {faNum(r.correct + r.wrong)} پاسخ
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="t-caption mt-2" style={{ color: "var(--muted-foreground)" }}>
            مرور اشتباهات همین آزمون، سریع‌ترین راه ترمیم این مباحث است.
          </p>
        </section>
      )}

      <div className="mx-4 mt-6 space-y-2.5">
        <Btn full size="lg" onClick={onReview}>
          <RotateCcw size={16} />
          مرور اشتباهات
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
        icon={History}
        title="هنوز آزمونی نداده‌اید"
        desc="با یک آزمون سریع شروع کنید یا یکی از جلسات رسمی را شبیه‌سازی کنید."
      />
    );
  }
  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {attempts.slice(0, 5).map((a) => {
        const s = scoreAttempt(a);
        return (
          <div key={a.id} className="flex items-center gap-3 py-3">
            <div
              className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold"
              style={{
                background: s.accuracyPct >= 60 ? "var(--success-soft)" : "var(--danger-soft)",
                color: s.accuracyPct >= 60 ? "var(--success)" : "var(--danger)",
              }}
            >
              ٪{faNum(s.accuracyPct)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                {a.title}
              </p>
              <p className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
                {faNum(s.correct)} درست از {faNum(s.total)} · {new Date(a.finishedAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
            <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
          </div>
        );
      })}
    </div>
  );
}
