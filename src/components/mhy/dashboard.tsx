"use client";

import { useMemo } from "react";
import type { Bootstrap } from "@/lib/mhy/server";
import { useMhy, mabhasTitle, competencyOfCode } from "@/lib/mhy/store";
import {
  faNum,
  daysUntil,
  mabhasMastery,
  readinessPct,
  todayPlan,
  type QLite,
} from "@/lib/mhy/engines";
import {
  Card,
  SectionHeader,
  CountdownRing,
  StatTile,
  ProgressRing,
  Sparkline,
  MeterRows,
  DisciplineGlyph,
  MhyGlyph,
  Skeleton,
} from "./ui";
import type { PoolItem } from "./shell";
import {
  Play,
  Target,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  BookMarked,
  ClipboardList,
  Zap,
  Route,
  Search,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export type Nav = {
  go: (tab: "dashboard" | "study" | "practice" | "exam" | "settings") => void;
  openSearch: () => void;
  startMabhasStudy: (m: number) => void;
  startMabhasPractice: (m: number) => void;
  startQuickExam: (n: number) => void;
  openOfficialExams: () => void;
  openComprehensive: () => void;
  openRoadmap: () => void;
  resumeStudy: () => void;
};

type MajorOf = (qid: number) => string | null;

export default function Dashboard({
  bootstrap,
  pool,
  nav,
}: {
  bootstrap: Bootstrap | null;
  pool: (QLite & { major?: string })[];
  nav: Nav;
}) {
  const { profile, answers, mistakes, lastStudy, attempts } = useMhy();

  const majorOf: MajorOf = useMemo(() => {
    const map = new Map<number, string>();
    for (const q of pool) map.set(q.id, (q as PoolItem).major ?? "");
    return (qid) => map.get(qid) ?? null;
  }, [pool]);

  const mastery = useMemo(() => mabhasMastery(answers, (qid) => pool.find((q) => q.id === qid)?.mabhas ?? null), [answers, pool]);
  const readiness = readinessPct(mastery);
  const plan = useMemo(() => todayPlan(mastery, mistakes, (m) => mabhasTitle(m), 20), [mastery, mistakes]);

  const daysLeft = profile.targetExamDate ? daysUntil(profile.targetExamDate) : null;

  const ranked = Object.entries(mastery)
    .map(([m, v]) => ({ m: Number(m), ...v }))
    .filter((v) => v.attempts >= 3)
    .sort((a, b) => b.accPct - a.accPct);
  const strong = ranked[0];
  const weak = ranked[ranked.length - 1];

  const answeredCount = Object.values(answers).filter((a) => a.choice !== null).length;
  const accuracyAll = useMemo(() => {
    const vals = Object.values(answers).filter((a) => a.correct !== null);
    if (!vals.length) return null;
    return Math.round((vals.filter((a) => a.correct).length / vals.length) * 100);
  }, [answers]);

  // ── per-competency progress (§12) — real accuracy + coverage from pool.major ──
  const competencyRows = useMemo(() => {
    const comps = profile.competencies ?? [];
    if (!comps.length) return [];
    const agg = new Map<string, { c: number; n: number }>();
    for (const [qidStr, a] of Object.entries(answers)) {
      if (a.correct === null) continue;
      const major = majorOf(Number(qidStr));
      if (!major) continue;
      const e = agg.get(major) ?? { c: 0, n: 0 };
      e.n++;
      if (a.correct) e.c++;
      agg.set(major, e);
    }
    return comps.map((code) => {
      const label = competencyOfCode(bootstrap?.disciplines, code);
      const a = agg.get(code);
      const acc = a && a.n ? Math.round((a.c / a.n) * 100) : null;
      const totalQ = bootstrap?.disciplineStats?.[code]?.total ?? 0;
      const coverage = a ? Math.min(100, Math.round((a.n / Math.max(totalQ, 1)) * 100)) : 0;
      return { code, label, acc, coverage, answered: a?.n ?? 0, totalQ };
    });
  }, [profile.competencies, answers, majorOf, bootstrap]);

  // ── 7-day accuracy trend (§13) — real answer timestamps ──
  const trend = useMemo(() => {
    const DAY = 86400000;
    const now = Date.now();
    const buckets: { start: number; c: number; n: number }[] = [];
    for (let i = 6; i >= 0; i--) buckets.push({ start: now - (i + 1) * DAY, c: 0, n: 0 });
    for (const a of Object.values(answers)) {
      if (a.correct === null) continue;
      const age = now - a.at;
      if (age > 7 * DAY) continue;
      const bi = Math.min(6, Math.floor((7 * DAY - age) / DAY));
      buckets[bi].n++;
      if (a.correct) buckets[bi].c++;
    }
    const series = buckets.map((b) => (b.n >= 2 ? Math.round((b.c / b.n) * 100) : -1));
    const valid = series.filter((v) => v >= 0);
    const lastValid = [...series].reverse().find((v) => v >= 0) ?? null;
    // delta: last 3 days vs previous 4 (only when both sides have data)
    const recent = buckets.slice(4).reduce((s, b) => ({ c: s.c + b.c, n: s.n + b.n }), { c: 0, n: 0 });
    const prior = buckets.slice(0, 4).reduce((s, b) => ({ c: s.c + b.c, n: s.n + b.n }), { c: 0, n: 0 });
    let delta: number | null = null;
    if (recent.n >= 3 && prior.n >= 3) {
      const r = Math.round((recent.c / recent.n) * 100);
      const p = Math.round((prior.c / prior.n) * 100);
      delta = r - p;
    }
    return { series: valid.length >= 2 ? series.map((v) => (v < 0 ? lastValid ?? 0 : v)) : [], last: lastValid, delta };
  }, [answers]);

  const todayQs = plan.totalQuestions;
  const doneToday = Math.min(answeredCount, todayQs);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "شب‌زنده‌داری" : hour < 12 ? "صبح بخیر" : hour < 17 ? "بعدازظهر بخیر" : "شب بخیر";
  const comps = profile.competencies ?? [];

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      {/* L0 — greeting/context */}
      <div className="relative pt-5">
        <div className="pointer-events-none absolute -top-6 left-0 opacity-[0.05]" aria-hidden>
          <MhyGlyph size={150} style={{ color: "var(--primary)" }} />
        </div>
        <p className="t-caption font-bold" style={{ color: "var(--muted-foreground)" }}>
          {greeting}{profile.name ? `، ${profile.name}` : ""}
        </p>
        <h1 className="t-title mt-0.5 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          {profile.disciplineTitle ?? "رشته انتخاب نشده"}
          {profile.disciplineGroup && (
            <span style={{ color: "var(--primary)" }}>
              <DisciplineGlyph code={profile.disciplineGroup} size={20} />
            </span>
          )}
        </h1>
        {comps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {comps.map((c) => (
              <span
                key={c}
                className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{
                  background: profile.activeCompetency === c ? "var(--primary)" : "var(--muted)",
                  color: profile.activeCompetency === c ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                {competencyOfCode(bootstrap?.disciplines, c)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* L1 — countdown hero */}
      <div className="mt-3.5">
        <CountdownRing daysLeft={daysLeft} examTitle={profile.targetExam} />
      </div>

      {/* L2 — continue studying: the hero action */}
      <SectionHeader title="ادامه مسیر" />
      {lastStudy ? (
        <Card onClick={nav.resumeStudy} ariaLabel="ادامه مطالعه از آخرین موقعیت" elevated>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "var(--grad-hero)", color: "#fff", boxShadow: "var(--shadow-card)" }}
            >
              <Play size={21} fill="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                ادامه مطالعه
              </p>
              <p className="mt-0.5 t-caption truncate" style={{ color: "var(--muted-foreground)" }}>
                {lastStudy.kind === "lesson" ? "درسنامه" : "مقررات"} — مبحث {faNum(lastStudy.mabhas)} · {mabhasTitle(lastStudy.mabhas)}
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      ) : (
        <Card onClick={() => nav.startMabhasStudy(1)} ariaLabel="شروع مطالعه" elevated>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "var(--grad-hero)", color: "#fff", boxShadow: "var(--shadow-card)" }}
            >
              <Play size={21} fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                شروع مطالعه مقررات
              </p>
              <p className="mt-0.5 t-caption" style={{ color: "var(--muted-foreground)" }}>
                از مبحث ۱ — کلیات و تعاریف
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      )}

      {/* L3 — today's plan (engine-derived, interactive) */}
      <SectionHeader title="امروز" />
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
            <Target size={15} style={{ color: "var(--primary)" }} />
            برنامه امروز
          </div>
          <span
            className="num rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: doneToday >= todayQs ? "var(--success-soft)" : "var(--primary-soft)",
              color: doneToday >= todayQs ? "var(--success)" : "var(--primary)",
            }}
          >
            {doneToday >= todayQs ? "کامل شد ✓" : `${faNum(doneToday)} از ${faNum(todayQs)}`}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {plan.items.map((it, i) => (
            <button
              key={i}
              onClick={() =>
                it.kind === "study" && it.mabhas != null
                  ? nav.startMabhasStudy(it.mabhas)
                  : it.kind === "practice"
                    ? nav.startMabhasPractice(it.mabhas ?? 0)
                    : it.kind === "review"
                      ? nav.go("practice")
                      : nav.go("exam")
              }
              className="press flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-right"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <span
                className="num flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold"
                style={{
                  background: it.kind === "review" ? "var(--warning-soft)" : it.kind === "study" ? "var(--primary-soft)" : "var(--success-soft)",
                  color: it.kind === "review" ? "var(--warning)" : it.kind === "study" ? "var(--primary)" : "var(--success)",
                }}
              >
                {faNum(i + 1)}
              </span>
              <div className="flex-1">
                <p className="text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
                  {it.label}
                  {it.count ? ` · ${faNum(it.count)} سؤال` : ""}
                </p>
                <p className="t-meta" style={{ color: "var(--muted-foreground)" }}>
                  {it.detail}
                </p>
              </div>
              <ChevronLeft size={15} style={{ color: "var(--muted-foreground)" }} />
            </button>
          ))}
        </div>
      </Card>

      {/* L4 — readiness */}
      <SectionHeader title="آمادگی کلی" />
      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing pct={readiness} size={96} label="آمادگی" />
          <div className="flex-1 space-y-2.5">
            {strong && (
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: "var(--success)" }} />
                <p className="t-caption flex-1 truncate font-bold" style={{ color: "var(--foreground)" }}>
                  قوی‌ترین: {mabhasTitle(strong.m)}
                </p>
                <span className="num text-[11px] font-extrabold" style={{ color: "var(--success)" }}>
                  ٪{faNum(strong.accPct)}
                </span>
              </div>
            )}
            {weak && weak.m !== strong?.m && (
              <div className="flex items-center gap-2">
                <TrendingDown size={15} style={{ color: "var(--danger)" }} />
                <p className="t-caption flex-1 truncate font-bold" style={{ color: "var(--foreground)" }}>
                  ضعیف‌ترین: {mabhasTitle(weak.m)}
                </p>
                <span className="num text-[11px] font-extrabold" style={{ color: "var(--danger)" }}>
                  ٪{faNum(weak.accPct)}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <StatTile value={faNum(answeredCount)} label="سؤال پاسخ‌داده" />
              <StatTile value={accuracyAll === null ? "—" : `٪${faNum(accuracyAll)}`} label="دقت کل" />
            </div>
          </div>
        </div>
      </Card>

      {/* L5 — competency progress (§12, multi-select) */}
      {competencyRows.length > 0 && (
        <>
          <SectionHeader title="پیشرفت صلاحیت‌ها" />
          <Card>
            <div className="space-y-3.5">
              {competencyRows.map((r) => (
                <div key={r.code}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                      {r.label}
                    </p>
                    <span className="num t-caption" style={{ color: "var(--muted-foreground)" }}>
                      {r.acc === null ? `${faNum(r.answered)}/${faNum(r.totalQ)} پاسخ‌داده` : `دقت ٪${faNum(r.acc)} · ${faNum(r.answered)}/${faNum(r.totalQ)}`}
                    </span>
                  </div>
                  <MeterRows
                    items={[
                      { label: "پوشش سؤالات", pct: r.coverage, color: "var(--primary)" },
                      ...(r.acc !== null ? [{ label: "دقت پاسخ", pct: r.acc, color: r.acc >= 60 ? "var(--success)" : "var(--warning)" }] : []),
                    ]}
                  />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* L6 — performance trend (§13) */}
      {trend.series.length >= 2 && (
        <>
          <SectionHeader title="عملکرد هفته اخیر" />
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="t-kpi num" style={{ fontSize: 22, color: "var(--foreground)" }}>
                  {trend.last !== null ? `٪${faNum(trend.last)}` : "—"}
                </p>
                <p className="t-meta mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  دقت روزهای اخیر
                </p>
                {trend.delta !== null && (
                  <p
                    className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: trend.delta >= 0 ? "var(--success-soft)" : "var(--danger-soft)",
                      color: trend.delta >= 0 ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {trend.delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {trend.delta >= 0 ? "+" : "−"}
                    {faNum(Math.abs(trend.delta))}٪ نسبت به روزهای قبل
                  </p>
                )}
              </div>
              <Sparkline data={trend.series} ariaLabel="روند دقت هفته اخیر" />
            </div>
          </Card>
        </>
      )}

      {/* L7 — quick actions */}
      <SectionHeader title="اقدامات سریع" />
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "مباحث مقررات", icon: BookMarked, fn: () => nav.startMabhasStudy(1), tint: "var(--primary)" },
          { label: "سؤال سریع", icon: Zap, fn: () => nav.startQuickExam(10), tint: "var(--warning)" },
          { label: "آزمون‌های رسمی", icon: ClipboardList, fn: nav.openOfficialExams, tint: "var(--success)" },
          { label: "نقشه راه", icon: Route, fn: nav.openRoadmap, tint: "var(--primary)" },
          { label: "آزمون جامع", icon: Layers, fn: nav.openComprehensive, tint: "var(--danger)" },
          { label: "جستجو", icon: Search, fn: nav.openSearch, tint: "var(--muted-foreground)" },
        ].map(({ label, icon: Icon, fn, tint }) => (
          <button
            key={label}
            onClick={fn}
            className="press flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${tint} 11%, transparent)`, color: tint }}>
              <Icon size={19} strokeWidth={1.9} />
            </span>
            <span className="text-[10.5px] font-bold" style={{ color: "var(--foreground)" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <p className="t-meta mt-5 flex items-center justify-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
        کتابخانه: {bootstrap ? `${faNum(bootstrap.stats.questions)} سؤال · ${faNum(bootstrap.stats.official)} رسمی · ${faNum(bootstrap.stats.lessons)} درسنامه` : "در حال بارگذاری…"}
      </p>
      {!bootstrap && (
        <div className="mt-3 space-y-2">
          <Skeleton h={64} />
          <Skeleton h={120} />
        </div>
      )}
    </div>
  );
}
