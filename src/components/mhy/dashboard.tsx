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
  SectionHeader,
  CountdownRing,
  ProgressRing,
  TrendChart,
  WeekStrip,
  SegmentedProgress,
  Eyebrow,
  DisciplineGlyph,
  Skeleton,
  MabhasCover,
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

const REGULATION_MABHAS_TOTAL = 22;

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

  // ── per-competency progress — real accuracy + coverage from pool.major ──
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

  // ── 7-day accuracy trend — real answer timestamps ──
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

  // ── week adherence — real study days from answer timestamps (Jalali via Intl) ──
  const week = useMemo(() => {
    const DAY = 86400000;
    const now = Date.now();
    const fmtDay = new Intl.DateTimeFormat("fa-IR", { day: "numeric" });
    // single-letter weekday labels — RTL week starts Saturday
    const wdShort = ["ی", "د", "س", "چ", "پ", "ج", "ش"]; // getDay(): 0=Sunday … 6=Saturday
    const done = new Array<boolean>(7).fill(false);
    for (const a of Object.values(answers)) {
      if (a.choice === null) continue;
      const age = now - a.at;
      if (age > 7 * DAY) continue;
      const bi = Math.min(6, Math.floor((7 * DAY - age) / DAY));
      done[bi] = true;
    }
    const out: { label: string; dateLabel: string; done: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      out.push({ label: wdShort[d.getDay()], dateLabel: fmtDay.format(d), done: done[6 - i] });
    }
    return out;
  }, [answers]);

  // streak — consecutive active days ending today (today itself optional)
  const streak = useMemo(() => {
    const DAY = 86400000;
    const days = new Set<number>();
    for (const a of Object.values(answers)) if (a.choice !== null) days.add(Math.floor(a.at / DAY));
    const today = Math.floor(Date.now() / DAY);
    let s = 0;
    let d = days.has(today) ? today : today - 1;
    while (days.has(d)) {
      s++;
      d--;
    }
    return s;
  }, [answers]);

  const todayQs = plan.totalQuestions;
  const doneToday = Math.min(answeredCount, todayQs);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "شب‌زنده‌داری" : hour < 12 ? "صبح بخیر" : hour < 17 ? "بعدازظهر بخیر" : "شب بخیر";
  const comps = profile.competencies ?? [];
  const dateLabel = useMemo(() => new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);
  const doneDays = week.filter((d) => d.done).length;

  const trendMax = trend.series.length ? Math.max(...trend.series) : 0;
  const trendMaxIdx = trend.series.indexOf(trendMax);

  return (
    <div className="phone-scroll flex-1 overflow-y-auto pb-6 screen-in">
      {/* ── L0 · greeting — composition head, not a card ── */}
      <header
        className="blueprint-grid relative px-5 pb-4 pt-5"
        style={{ maskImage: "linear-gradient(180deg, black 55%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, black 55%, transparent 100%)" }}
      >
        <Eyebrow tone="accent">{dateLabel}</Eyebrow>
        <p className="mt-2 t-caption font-bold" style={{ color: "var(--muted-foreground)" }}>
          {greeting}
          {profile.name ? `، ${profile.name}` : ""}
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
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {comps.map((c) => {
              const active = profile.activeCompetency === c;
              return (
                <span
                  key={c}
                  className="rounded-full border px-2.5 py-1 text-[10px] font-bold"
                  style={
                    active
                      ? { borderColor: "var(--primary)", background: "var(--primary-soft)", color: "var(--primary)" }
                      : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                  }
                >
                  {competencyOfCode(bootstrap?.disciplines, c)}
                </span>
              );
            })}
          </div>
        )}
      </header>

      <div className="px-4">
        {/* ── L2 · WOW#1 — target exam countdown (copper composition) ── */}
        <CountdownRing daysLeft={daysLeft} examTitle={profile.targetExam} />

        {/* ── L3 · readiness state — inline composition, no card ── */}
        <section className="mt-5" aria-label="وضعیت آمادگی">
          <div className="flex items-center justify-between">
            <Eyebrow>وضعیت آمادگی</Eyebrow>
            <span className="t-meta num" style={{ color: "var(--muted-foreground)" }}>
              {faNum(answeredCount)} پاسخ ثبت‌شده
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <ProgressRing pct={readiness} size={92} strokeWidth={8} label="آمادگی" />
            <div className="min-w-0 flex-1 space-y-2">
              {strong && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} style={{ color: "var(--primary)" }} />
                  <p className="t-caption flex-1 truncate font-bold" style={{ color: "var(--foreground)" }}>
                    {mabhasTitle(strong.m)}
                  </p>
                  <span className="num text-[11px] font-extrabold" style={{ color: "var(--primary)" }}>
                    ٪{faNum(strong.accPct)}
                  </span>
                </div>
              )}
              {weak && weak.m !== strong?.m && (
                <div className="flex items-center gap-2">
                  <TrendingDown size={15} style={{ color: "var(--danger)" }} />
                  <p className="t-caption flex-1 truncate font-bold" style={{ color: "var(--foreground)" }}>
                    {mabhasTitle(weak.m)}
                  </p>
                  <span className="num text-[11px] font-extrabold" style={{ color: "var(--danger)" }}>
                    ٪{faNum(weak.accPct)}
                  </span>
                </div>
              )}
              <div className="construction !border-solid" />
              <div className="flex items-stretch">
                {[
                  { v: accuracyAll === null ? "—" : `٪${faNum(accuracyAll)}`, l: "دقت کل" },
                  { v: faNum(answeredCount), l: "پاسخ" },
                  { v: faNum(streak), l: "روز پیوسته" },
                ].map((x, i) => (
                  <div key={x.l} className={`flex-1 text-center ${i > 0 ? "border-r" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <p className="t-kpi num" style={{ fontSize: 16, color: "var(--foreground)" }}>
                      {x.v}
                    </p>
                    <p className="t-meta mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {x.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── L4 · week adherence ── */}
        <section className="mt-5" aria-label="پیوستگی مطالعه هفته">
          <div className="flex items-center justify-between">
            <Eyebrow>پیوستگی هفته</Eyebrow>
            <span className="t-meta num" style={{ color: doneDays >= 5 ? "var(--primary)" : "var(--muted-foreground)" }}>
              {faNum(doneDays)} روز از ۷ روز
            </span>
          </div>
          <div className="mt-2.5">
            <WeekStrip days={week} selected={6} />
          </div>
        </section>

        {/* ── L5 · continue studying — the reading object itself (§21/§26) ── */}
        {lastStudy ? (
          <MabhasCover
            mabhas={lastStudy.mabhas}
            variant="hero"
            className="mt-1"
            onClick={nav.resumeStudy}
            ariaLabel={`ادامه مطالعه مبحث ${faNum(lastStudy.mabhas)} — ${mabhasTitle(lastStudy.mabhas)}`}
            badge={
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <Play size={11} />
                ادامه مطالعه
              </span>
            }
            title={mabhasTitle(lastStudy.mabhas)}
            meta={
              <>
                {lastStudy.kind === "lesson" ? "درسنامه جامع" : "متن بندها"}
                {" · مبحث "}
                {faNum(lastStudy.mabhas)}
                {mastery[lastStudy.mabhas] ? ` · ٪${faNum(mastery[lastStudy.mabhas].mastery)} تسلط` : ""}
              </>
            }
            progress={mastery[lastStudy.mabhas]?.mastery ?? null}
          />
        ) : (
          <MabhasCover
            mabhas={1}
            variant="hero"
            className="mt-1"
            onClick={() => nav.startMabhasStudy(1)}
            ariaLabel="شروع مطالعه مقررات از مبحث ۱"
            badge={
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold"
                style={{ background: "rgba(255,255,255,0.9)", color: "#10141b" }}
              >
                <Play size={11} />
                شروع مطالعه
              </span>
            }
            title={mabhasTitle(1)}
            meta={
              <>
                متن بندها · {faNum(bootstrap?.mabhasIndex.find((x) => x.mabhas === 1)?.questions ?? 0)} سؤال واقعی
              </>
            }
          />
        )}

        {/* ── L6 · today — dense rows, no card ── */}
        <section className="mt-6" aria-label="برنامه امروز">
          <div className="mb-1.5 flex items-center justify-between">
            <Eyebrow>برنامه امروز</Eyebrow>
            <span
              className="num inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{
                background: doneToday >= todayQs ? "var(--success-soft)" : "var(--primary-soft)",
                color: doneToday >= todayQs ? "var(--success)" : "var(--primary)",
              }}
            >
              <Target size={11} />
              {doneToday >= todayQs ? "کامل شد" : `${faNum(doneToday)} از ${faNum(todayQs)}`}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
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
                className="press flex min-h-[52px] w-full items-center gap-2.5 py-2.5 text-right"
              >
                <span
                  className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                  style={{
                    background: it.kind === "review" ? "var(--warning-soft)" : it.kind === "study" ? "var(--primary-soft)" : "var(--muted)",
                    color: it.kind === "review" ? "var(--warning)" : it.kind === "study" ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  {faNum(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                    {it.label}
                    {it.count ? ` · ${faNum(it.count)} سؤال` : ""}
                  </p>
                  <p className="t-meta truncate" style={{ color: "var(--muted-foreground)" }}>
                    {it.detail}
                  </p>
                </div>
                <ChevronLeft size={15} style={{ color: "var(--muted-foreground)" }} />
              </button>
            ))}
          </div>
        </section>

        {/* ── L7 · performance insight — chart with a message ── */}
        {trend.series.length >= 2 && (
          <section className="mt-6" aria-label="روند عملکرد">
            <Eyebrow>عملکرد هفته اخیر</Eyebrow>
            <div className="mt-2">
              <TrendChart
                data={trend.series}
                ariaLabel="روند دقت هفته اخیر"
                callout={{ index: trendMaxIdx, label: `٪${faNum(trendMax)}` }}
              />
            </div>
            <p className="t-body-sm mt-1.5" style={{ color: "var(--foreground)" }}>
              {trend.delta !== null ? (
                <>
                  {trend.delta >= 0 ? "این هفته دقتت بهتر شده" : "دقت هفته اخیر کمی افت کرده"} —{" "}
                  <b className="num" style={{ color: trend.delta >= 0 ? "var(--primary)" : "var(--danger)" }}>
                    {trend.delta >= 0 ? "+" : "−"}
                    {faNum(Math.abs(trend.delta))}٪
                  </b>{" "}
                  نسبت به روزهای قبل.
                </>
              ) : (
                <>
                  دقت روزهای اخیر{" "}
                  <b className="num" style={{ color: "var(--primary)" }}>
                    ٪{faNum(trend.last ?? 0)}
                  </b>{" "}
                  است؛ با ادامه برنامه امروز، روند کامل رسم می‌شود.
                </>
              )}
            </p>
          </section>
        )}

        {/* ── L8 · competency progress — dense blocks with construction dividers ── */}
        {competencyRows.length > 0 && (
          <section className="mt-6" aria-label="پیشرفت صلاحیت‌ها">
            <Eyebrow>پیشرفت صلاحیت‌ها</Eyebrow>
            <div className="mt-1 divide-y" style={{ borderColor: "var(--border)" }}>
              {competencyRows.map((r) => (
                <div key={r.code} className="py-3.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                      {r.label}
                    </p>
                    <span className="num t-caption shrink-0" style={{ color: r.acc !== null && r.acc >= 60 ? "var(--primary)" : "var(--muted-foreground)" }}>
                      {r.acc === null ? `${faNum(r.answered)}/${faNum(r.totalQ)}` : `دقت ٪${faNum(r.acc)}`}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${r.coverage}%`,
                        background: "var(--primary)",
                        transition: "width 0.6s cubic-bezier(0.2,0.8,0.2,1)",
                      }}
                    />
                  </div>
                  <p className="t-meta mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                    پوشش {faNum(r.coverage)}٪ از {faNum(r.totalQ)} سؤال این صلاحیت
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── L9 · quick actions — quiet tiles ── */}
        <SectionHeader title="اقدامات سریع" />
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "کتابخانه فنی", icon: BookMarked, fn: () => nav.startMabhasStudy(1) },
            { label: "سؤال سریع", icon: Zap, fn: () => nav.startQuickExam(10) },
            { label: "آزمون‌های رسمی", icon: ClipboardList, fn: nav.openOfficialExams },
            { label: "آزمون جامع", icon: Layers, fn: nav.openComprehensive },
            { label: "جستجو", icon: Search, fn: nav.openSearch },
          ].map(({ label, icon: Icon, fn }) => (
            <button
              key={label}
              onClick={fn}
              className="press flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <span className="text-[10.5px] font-bold" style={{ color: "var(--foreground)" }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* footer — library trust line */}
        <div className="construction mt-6" />
        <p className="t-meta mt-3 flex items-center justify-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
          کتابخانه: {bootstrap ? `${faNum(bootstrap.stats.questions)} سؤال · ${faNum(bootstrap.stats.official)} رسمی · ${faNum(bootstrap.stats.lessons)} درسنامه` : "در حال بارگذاری…"}
        </p>
        {!bootstrap && (
          <div className="mt-3 space-y-2">
            <Skeleton h={64} />
            <Skeleton h={120} />
          </div>
        )}
      </div>
    </div>
  );
}
