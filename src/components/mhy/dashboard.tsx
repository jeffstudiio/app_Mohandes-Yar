"use client";

import { useMemo } from "react";
import type { Bootstrap, MhyQuestion } from "@/lib/mhy/server";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import {
  faNum,
  daysUntil,
  mabhasMastery,
  readinessPct,
  todayPlan,
  type QLite,
} from "@/lib/mhy/engines";
import { Card, SectionHeader, Countdown, ProgressBar, StatTile, ProgressRing, Btn, SourceBadge } from "./ui";
import {
  Target,
  Play,
  Route,
  BookMarked,
  ClipboardList,
  Zap,
  Search,
  Library,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
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

export default function Dashboard({
  bootstrap,
  pool,
  nav,
}: {
  bootstrap: Bootstrap | null;
  pool: QLite[];
  nav: Nav;
}) {
  const { profile, answers, mistakes, lastStudy, attempts, setLastStudy } = useMhy();

  const mastery = useMemo(() => mabhasMastery(answers, (qid) => pool.find((q) => q.id === qid)?.mabhas ?? null), [answers, pool]);
  const readiness = readinessPct(mastery);
  const plan = useMemo(
    () =>
      todayPlan(
        mastery,
        mistakes,
        (m) => mabhasTitle(m),
        20
      ),
    [mastery, mistakes]
  );

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

  const todayQs = plan.totalQuestions;
  const doneToday = answeredCount % Math.max(todayQs, 20);

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      {/* L1 — immediate context (§5) */}
      <div className="pt-4">
        <p className="text-[11.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
          {profile.disciplineTitle ?? "رشته انتخاب نشده"}
        </p>
        <h1 className="mt-0.5 text-[18px] font-extrabold" style={{ color: "var(--foreground)" }}>
          داشبورد آمادگی
        </h1>
      </div>
      <div className="mt-3">
        <Countdown daysLeft={daysLeft} />
      </div>

      {/* L2 — continue (real last position) */}
      <SectionHeader title="ادامه مسیر" />
      {lastStudy ? (
        <Card onClick={nav.resumeStudy} ariaLabel="ادامه مطالعه از آخرین موقعیت">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <Play size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                {lastStudy.kind === "lesson" ? "درسنامه" : "مقررات"} — مبحث {faNum(lastStudy.mabhas)}
              </p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                از همان‌جا ادامه بده
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      ) : (
        <Card onClick={() => nav.startMabhasStudy(1)} ariaLabel="شروع مطالعه">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <Play size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                شروع مطالعه مقررات
              </p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                از مبحث ۱ — کلیات و تعاریف
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      )}

      {/* L3 — today's plan (engine-derived) */}
      <SectionHeader title="امروز" />
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
            <Target size={15} style={{ color: "var(--primary)" }} />
            برنامه امروز
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: doneToday >= todayQs ? "var(--success-soft)" : "var(--primary-soft)", color: doneToday >= todayQs ? "var(--success)" : "var(--primary)" }}>
            {doneToday >= todayQs ? "کامل شد" : `${faNum(answeredCount)} انجام‌شده`}
          </span>
        </div>
        <div className="mt-3 space-y-2.5">
          {plan.items.map((it, i) => (
            <button
              key={i}
              onClick={() => (it.kind === "study" && it.mabhas != null ? nav.startMabhasStudy(it.mabhas) : it.kind === "practice" ? nav.startMabhasPractice(it.mabhas ?? 0) : it.kind === "review" ? nav.go("practice") : nav.go("exam"))}
              className="flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-right"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold"
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
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
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
          <ProgressRing pct={readiness} size={92} label="آمادگی" />
          <div className="flex-1 space-y-2.5">
            {strong && (
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: "var(--success)" }} />
                <p className="flex-1 text-[11.5px]" style={{ color: "var(--foreground)" }}>
                  قوی‌ترین: {mabhasTitle(strong.m)}
                </p>
                <span className="text-[11px] font-bold" style={{ color: "var(--success)" }}>
                  ٪{faNum(strong.accPct)}
                </span>
              </div>
            )}
            {weak && weak.m !== strong?.m && (
              <div className="flex items-center gap-2">
                <TrendingDown size={15} style={{ color: "var(--danger)" }} />
                <p className="flex-1 text-[11.5px]" style={{ color: "var(--foreground)" }}>
                  ضعیف‌ترین: {mabhasTitle(weak.m)}
                </p>
                <span className="text-[11px] font-bold" style={{ color: "var(--danger)" }}>
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

      {/* L5 — quick actions (§69 hierarchy) */}
      <SectionHeader title="اقدامات سریع" />
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "مباحث مقررات", icon: BookMarked, fn: () => nav.startMabhasStudy(1) },
          { label: "سؤال سریع", icon: Zap, fn: () => nav.startQuickExam(10) },
          { label: "آزمون‌های رسمی", icon: ClipboardList, fn: nav.openOfficialExams },
        ].map(({ label, icon: Icon, fn }) => (
          <button
            key={label}
            onClick={fn}
            className="flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <Icon size={20} style={{ color: "var(--primary)" }} />
            <span className="text-[10.5px] font-bold" style={{ color: "var(--foreground)" }}>
              {label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {[
          { label: "نقشه راه", icon: Route, fn: nav.openRoadmap },
          { label: "آزمون جامع", icon: ClipboardList, fn: nav.openComprehensive },
          { label: "جستجو", icon: Search, fn: nav.openSearch },
        ].map(({ label, icon: Icon, fn }) => (
          <button
            key={label}
            onClick={fn}
            className="flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <Icon size={20} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-[10.5px] font-bold" style={{ color: "var(--foreground)" }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        <Library size={12} />
        کتابخانه: {bootstrap ? `${faNum(bootstrap.stats.questions)} سؤال · ${faNum(bootstrap.stats.official)} رسمی · ${faNum(bootstrap.stats.lessons)} درسنامه` : "در حال بارگذاری…"}
      </p>
    </div>
  );
}
