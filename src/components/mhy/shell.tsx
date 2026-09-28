"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Bootstrap } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy } from "@/lib/mhy/store";
import type { QLite } from "@/lib/mhy/engines";
import Onboarding from "./onboarding";
import Dashboard, { type Nav } from "./dashboard";
import Study from "./study";
import Practice from "./practice";
import Exam from "./exam";
import Settings from "./settings";
import SearchOverlay from "./search-overlay";
import { MhyGlyph } from "./ui";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  ClipboardList,
  Settings as SettingsIcon,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Tab = "dashboard" | "study" | "practice" | "exam" | "settings";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "study", label: "مطالعه", icon: BookOpen },
  { id: "practice", label: "تمرین", icon: PenLine },
  { id: "exam", label: "آزمون", icon: ClipboardList },
  { id: "settings", label: "تنظیمات", icon: SettingsIcon },
];

type StudyView =
  | { kind: "root" }
  | { kind: "roadmap" }
  | { kind: "regulations" }
  | { kind: "regulation-reader"; mabhas: number }
  | { kind: "lessons" }
  | { kind: "lesson-reader"; mabhas: number };

export type PoolItem = QLite & { major: string };

export default function MhyShell() {
  const { theme, setTheme, profile } = useMhy();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [studyView, setStudyView] = useState<StudyView | null>(null);
  const [practicePreset, setPracticePreset] = useState<number | null>(null);
  const [examPreset, setExamPreset] = useState<"official" | "quick" | "comprehensive" | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    api.bootstrap()
      .then(setBootstrap)
      .catch(() => setBootstrap(null));
  }, []);

  // competency-scoped pool (§9.4) — real major codes of all selected competencies, merged
  useEffect(() => {
    let cancelled = false;
    const majors = profile.competencies ?? [];
    const params: Record<string, string> = { limit: "1500" };
    api
      .questionsForMajors(majors, params)
      .then((j) => {
        if (cancelled) return;
        setPool(
          (j.items ?? []).map((q) => ({
            id: q.id,
            mabhas: q.mabhas,
            difficulty: q.difficulty,
            sourceType: q.sourceType,
            topic: q.topic,
            status: q.status,
            major: q.major,
          }))
        );
      })
      .catch(() => !cancelled && setPool([]));
    return () => {
      cancelled = true;
    };
  }, [profile.competencies]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const nav: Nav = useMemo(
    () => ({
      go: (t) => setTab(t),
      openSearch: () => setSearchOpen(true),
      startMabhasStudy: (m) => {
        setStudyView({ kind: "regulation-reader", mabhas: m });
        setTab("study");
      },
      startMabhasPractice: (m) => {
        setPracticePreset(m);
        setTab("practice");
      },
      startQuickExam: () => {
        setExamPreset("quick");
        setTab("exam");
      },
      openOfficialExams: () => {
        setExamPreset("official");
        setTab("exam");
      },
      openComprehensive: () => {
        setExamPreset("comprehensive");
        setTab("exam");
      },
      openRoadmap: () => {
        setStudyView({ kind: "roadmap" });
        setTab("study");
      },
      resumeStudy: () => {
        setStudyView(null);
        setTab("study");
      },
    }),
    []
  );

  const dark = theme === "dark";
  const comps = profile.competencies ?? [];

  const tabContent = (t: Tab) => {
    switch (t) {
      case "dashboard":
        return <Dashboard bootstrap={bootstrap} pool={pool} nav={nav} />;
      case "study":
        return (
          <Study
            bootstrap={bootstrap}
            pool={pool}
            initialView={studyView}
            onViewConsumed={() => setStudyView(null)}
            nav={{ startMabhasPractice: nav.startMabhasPractice, go: (t2) => setTab(t2) }}
          />
        );
      case "practice":
        return (
          <Practice
            bootstrap={bootstrap}
            majors={comps}
            presetMabhas={practicePreset}
            onPresetConsumed={() => setPracticePreset(null)}
          />
        );
      case "exam":
        return (
          <Exam
            bootstrap={bootstrap}
            majors={comps}
            presetKind={examPreset}
            onPresetConsumed={() => setExamPreset(null)}
          />
        );
      case "settings":
        return <Settings bootstrap={bootstrap} dark={dark} onToggleDark={(v) => setTheme(v ? "dark" : "light")} />;
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center gap-10 p-4 lg:p-8 max-lg:p-0"
      style={{
        background: dark
          ? "radial-gradient(1200px 600px at 70% -10%, #0f2438 0%, #070c14 55%)"
          : "radial-gradient(1200px 600px at 70% -10%, #d8e6f2 0%, #edf1f6 55%)",
      }}
    >
      {/* desktop side panel — product identity + trust stats */}
      <aside className="hidden max-w-[400px] flex-col lg:flex" aria-label="درباره مهندس‌یار V2">
        <div className="flex items-center gap-3">
          <img src={`${BASE}/app-icon.webp`} alt="آیکون مهندس‌یار" className="h-14 w-14 rounded-[1rem] shadow-lg" style={{ background: "var(--primary)" }} />
          <div>
            <h1 className="text-[22px] font-extrabold" style={{ color: dark ? "#e5edf6" : "#10202f" }}>
              مهندس‌یار
            </h1>
            <p className="text-[11.5px]" style={{ color: dark ? "#9db2c9" : "#46607a" }}>
              V2 — کابین آمادگی آزمون نظام مهندسی
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5" aria-label="آمار کتابخانه محتوا">
          {[
            [bootstrap ? String(bootstrap.stats.questions) : "—", "سؤال واقعی"],
            [bootstrap ? String(bootstrap.stats.official) : "—", "رسمی با هویت جلسه"],
            [bootstrap ? String(bootstrap.stats.regulationBandTexts) : "—", "بند مقررات با متن"],
            [bootstrap ? String(bootstrap.stats.lessons) : "—", "درسنامه جامع"],
          ].map(([v, l]) => (
            <div
              key={l}
              className="rounded-2xl border p-3.5"
              style={{ background: dark ? "rgba(19,28,46,0.6)" : "rgba(255,255,255,0.75)", borderColor: dark ? "#24344f" : "#dde5ee" }}
            >
              <p className="t-kpi num" style={{ fontSize: 19, color: dark ? "#e5edf6" : "#10202f" }}>
                {v}
              </p>
              <p className="t-meta mt-0.5" style={{ color: dark ? "#9db2c9" : "#46607a" }}>
                {l}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 t-body-sm leading-7" style={{ color: dark ? "#9db2c9" : "#46607a" }}>
          این نسخه، معماری کامل دستور V2 را روی <b style={{ color: dark ? "#e5edf6" : "#10202f" }}>محتوای واقعی APK</b> پیاده می‌کند:
          پنج فضای کاری (داشبورد، مطالعه، تمرین، آزمون، تنظیمات)، انتخاب چند صلاحیت، نقشه راه و برنامه امروز پویا،
          موتور آزمون رسمی/جامع با زمان‌سنج مبتنی بر زمان واقعی، هویت منبع هر سؤال (رسمی/تألیفی + جلسه + شماره)،
          مرورگر مقررات با متن واقعی بندها، اشتباهات و نشانک‌ها، جستجوی سراسری و دارک‌مود کامل.
        </p>
        <p className="mt-4 t-meta leading-5" style={{ color: dark ? "#5b7290" : "#8aa0b5" }}>
          {bootstrap && bootstrap.stats.reviewRequired > 0
            ? `${bootstrap.stats.reviewRequired} محتوا در داده اصلی پرچم «نیازمند بازبینی» دارد و بدون پنهان‌کاری با برچسب نمایش داده می‌شود.`
            : ""}
        </p>
      </aside>

      {/* phone — full-bleed on real mobile, framed on desktop */}
      <div className={dark ? "dark" : ""}>
        <div
          className="relative h-screen w-full overflow-hidden max-lg:rounded-none max-lg:border-0 lg:h-[min(88vh,780px)] lg:w-[400px] lg:max-w-full lg:rounded-[2.4rem] lg:border-[10px]"
          style={{ borderColor: "#10151c", background: "var(--background)", boxShadow: "var(--shadow-float)" }}
          role="region"
          aria-label="اپ مهندس‌یار"
        >
          <div className="absolute left-1/2 top-0 z-30 hidden h-6 w-32 -translate-x-1/2 rounded-b-2xl lg:block" style={{ background: "#10151c" }} aria-hidden />
          <div className="flex h-full flex-col">
            {/* status bar (desktop frame chrome only) */}
            <div className="hidden items-center justify-between px-6 pb-1 pt-3 text-[11px] font-medium text-white select-none lg:flex" style={{ background: "var(--statusbar)" }}>
              <span className="num">۲۱:۴۵</span>
              <span className="opacity-80">MHY V2</span>
            </div>

            {!profile.onboarded ? (
              <div className="flex-1 overflow-hidden max-lg:pt-[env(safe-area-inset-top)]">
                <Onboarding bootstrap={bootstrap} onDone={() => setTab("dashboard")} />
              </div>
            ) : (
              <>
                {/* tab content — fast meaningful transition (§4/§22) */}
                <div className="relative flex-1 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={tab}
                      className="absolute inset-0 flex flex-col"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                      {tabContent(tab)}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* bottom tab bar — animated indicator (§4) */}
                <nav
                  aria-label="ناوبری اصلی"
                  className="shrink-0 border-t backdrop-blur"
                  style={{ background: "var(--tabbar)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
                    {TABS.map(({ id, label, icon: Icon }) => {
                      const active = id === tab;
                      return (
                        <button
                          key={id}
                          onClick={() => setTab(id)}
                          aria-label={label}
                          aria-current={active ? "page" : undefined}
                          className="press relative flex min-h-[54px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2"
                          style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
                        >
                          {active && (
                            <motion.span
                              layoutId="nav-pill"
                              className="absolute inset-0 rounded-xl"
                              style={{ background: "var(--primary-soft)" }}
                              transition={{ type: "spring", stiffness: 500, damping: 38 }}
                              aria-hidden
                            />
                          )}
                          <span className="relative" aria-hidden>
                            <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                            {active && (
                              <motion.span
                                layoutId="nav-dot"
                                className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                                style={{ background: "var(--primary)" }}
                                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                              />
                            )}
                          </span>
                          <span className="relative text-[10px] leading-none" style={{ fontWeight: active ? 800 : 500 }}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </>
            )}

            <SearchOverlay
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              onOpenRegulation={(m) => {
                setSearchOpen(false);
                setStudyView({ kind: "regulation-reader", mabhas: m });
                setTab("study");
              }}
              onOpenQuestionPractice={() => {
                setSearchOpen(false);
                setTab("practice");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
