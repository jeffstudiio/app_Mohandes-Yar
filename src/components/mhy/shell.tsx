"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap } from "@/lib/mhy/server";
import { useMhy } from "@/lib/mhy/store";
import type { QLite } from "@/lib/mhy/engines";
import Onboarding from "./onboarding";
import Dashboard, { type Nav } from "./dashboard";
import Study from "./study";
import Practice from "./practice";
import Exam from "./exam";
import Settings from "./settings";
import SearchOverlay from "./search-overlay";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  ClipboardList,
  Settings as SettingsIcon,
} from "lucide-react";

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

export default function MhyShell() {
  const { theme, setTheme, profile } = useMhy();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [pool, setPool] = useState<QLite[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [studyView, setStudyView] = useState<StudyView | null>(null);
  const [practicePreset, setPracticePreset] = useState<number | null>(null);
  const [examPreset, setExamPreset] = useState<"official" | "quick" | "comprehensive" | null>(null);

  useEffect(() => {
    fetch("/api/mhy/bootstrap")
      .then((r) => r.json())
      .then(setBootstrap)
      .catch(() => setBootstrap(null));
  }, []);

  // discipline-scoped pool (QLite) for engines — default to user's major if set
  useEffect(() => {
    const params = new URLSearchParams();
    if (profile.disciplineCode) params.set("major", profile.disciplineCode);
    params.set("limit", "1500");
    fetch(`/api/mhy/questions?${params}`)
      .then((r) => r.json())
      .then((j) =>
        setPool(
          (j.items ?? []).map((q: { id: number; mabhas: number | null; difficulty: QLite["difficulty"]; sourceType: QLite["sourceType"]; topic: string; status: QLite["status"] }) => ({
            id: q.id, mabhas: q.mabhas, difficulty: q.difficulty, sourceType: q.sourceType, topic: q.topic, status: q.status,
          }))
        )
      )
      .catch(() => setPool([]));
  }, [profile.disciplineCode]);

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
      startQuickExam: (n) => {
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

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center gap-10 p-4 lg:p-8"
      style={{
        background: dark
          ? "radial-gradient(1200px 600px at 70% -10%, #12304f 0%, #0b1220 55%)"
          : "radial-gradient(1200px 600px at 70% -10%, #dce9f5 0%, #eef2f7 55%)",
      }}
    >
      {/* desktop side panel — product identity + trust stats */}
      <aside className="hidden max-w-[400px] flex-col lg:flex" aria-label="درباره مهندس‌یار V2">
        <div className="flex items-center gap-3">
          { }
          <img src="/app-icon.webp" alt="آیکون مهندس‌یار" className="h-14 w-14 rounded-[1rem] shadow-lg" style={{ background: "var(--primary)" }} />
          <div>
            <h1 className="text-[22px] font-extrabold" style={{ color: dark ? "#e5edf6" : "#10202f" }}>
              مهندس‌یار
            </h1>
            <p className="text-[11.5px]" style={{ color: dark ? "#9db2c9" : "#46607a" }}>
              V2 — میزکار آمادگی آزمون نظام مهندسی
            </p>
          </div>
        </div>
        <div
          className="mt-5 grid grid-cols-2 gap-2.5"
          aria-label="آمار کتابخانه محتوا"
        >
          {[
            [bootstrap ? String(bootstrap.stats.questions) : "—", "سؤال واقعی"],
            [bootstrap ? String(bootstrap.stats.official) : "—", "رسمی با هویت جلسه"],
            [bootstrap ? String(bootstrap.stats.regulationBandTexts) : "—", "بند مقررات با متن"],
            [bootstrap ? String(bootstrap.stats.lessons) : "—", "درسنامه جامع"],
          ].map(([v, l]) => (
            <div
              key={l}
              className="rounded-2xl border p-3.5"
              style={{ background: dark ? "rgba(20,32,58,0.6)" : "rgba(255,255,255,0.75)", borderColor: dark ? "#24344f" : "#dde5ee" }}
            >
              <p className="text-[19px] font-extrabold" style={{ color: dark ? "#e5edf6" : "#10202f" }}>
                {v}
              </p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: dark ? "#9db2c9" : "#46607a" }}>
                {l}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] leading-7" style={{ color: dark ? "#9db2c9" : "#46607a" }}>
          این نسخه، معماری کامل دستور V2 را روی <b style={{ color: dark ? "#e5edf6" : "#10202f" }}>محتوای واقعی APK</b> پیاده می‌کند:
          پنج فضای کاری (داشبورد، مطالعه، تمرین، آزمون، تنظیمات)، نقشه راه و برنامه امروز پویا، موتور آزمون رسمی/جامع با زمان‌سنج مبتنی بر زمان واقعی،
          هویت منبع هر سؤال (رسمی/تألیفی + جلسه + شماره)، مرورگر مقررات با متن واقعی بندها، اشتباهات و نشانک‌ها، جستجوی سراسری و دارک‌مود کامل.
        </p>
        <p className="mt-4 text-[10.5px] leading-5" style={{ color: dark ? "#5b7290" : "#8aa0b5" }}>
          {bootstrap && bootstrap.stats.reviewRequired > 0
            ? `${bootstrap.stats.reviewRequired} محتوا در داده اصلی پرچم «نیازمند بازبینی» دارد و بدون پنهان‌کاری با برچسب نمایش داده می‌شود.`
            : ""}
        </p>
      </aside>

      {/* phone */}
      <div className={dark ? "dark" : ""}>
        <div
          className="relative h-[min(88vh,780px)] w-[400px] max-w-full overflow-hidden rounded-[2.4rem] border-[10px] shadow-2xl"
          style={{ borderColor: "#10151c", background: "var(--surface)" }}
          role="region"
          aria-label="اپ مهندس‌یار"
        >
          <div className="absolute left-1/2 top-0 z-30 h-6 w-32 -translate-x-1/2 rounded-b-2xl" style={{ background: "#10151c" }} aria-hidden="true" />
          <div className="flex h-full flex-col">
            {/* status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium text-white select-none" style={{ background: "var(--statusbar)" }}>
              <span>۲۱:۴۵</span>
              <span className="opacity-80">MHY V2</span>
            </div>

            {!profile.onboarded ? (
              <div className="flex-1 overflow-hidden pt-5">
                <Onboarding bootstrap={bootstrap} onDone={() => setTab("dashboard")} />
              </div>
            ) : (
              <>
                {tab === "dashboard" && <Dashboard bootstrap={bootstrap} pool={pool} nav={nav} />}
                {tab === "study" && (
                  <Study
                    bootstrap={bootstrap}
                    pool={pool}
                    initialView={studyView}
                    onViewConsumed={() => setStudyView(null)}
                    nav={{ startMabhasPractice: nav.startMabhasPractice, go: (t) => setTab(t) }}
                  />
                )}
                {tab === "practice" && (
                  <Practice bootstrap={bootstrap} major={profile.disciplineCode} presetMabhas={practicePreset} onPresetConsumed={() => setPracticePreset(null)} />
                )}
                {tab === "exam" && (
                  <Exam bootstrap={bootstrap} major={profile.disciplineCode} presetKind={examPreset} onPresetConsumed={() => setExamPreset(null)} />
                )}
                {tab === "settings" && <Settings bootstrap={bootstrap} dark={dark} onToggleDark={(v) => setTheme(v ? "dark" : "light")} />}

                {/* bottom tab bar (§4) */}
                <nav aria-label="ناوبری اصلی" className="shrink-0 border-t backdrop-blur" style={{ background: "var(--tabbar)" }}>
                  <div className="flex items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
                    {TABS.map(({ id, label, icon: Icon }) => {
                      const active = id === tab;
                      return (
                        <button
                          key={id}
                          onClick={() => setTab(id)}
                          aria-label={label}
                          aria-current={active ? "page" : undefined}
                          className="flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-colors"
                          style={{
                            color: active ? "var(--primary)" : "var(--muted-foreground)",
                            background: active ? "var(--primary-soft)" : "transparent",
                          }}
                        >
                          <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                          <span className="text-[10px] leading-none" style={{ fontWeight: active ? 700 : 500 }}>
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
