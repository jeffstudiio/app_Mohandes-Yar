"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyBand, LessonJson } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle, mabhasEdition } from "@/lib/mhy/store";
import { faNum, buildRoadmap, mabhasMastery, type QLite } from "@/lib/mhy/engines";
import { SectionHeader, ProgressBar, EmptyState, Btn, SearchField, LoadingBlock, ProgressRing, DenseRow, DenseList, Eyebrow, SegmentedProgress, CheckBadge, MabhasCover, SnapRail } from "./ui";
import {
  Route,
  BookOpen,
  BookMarked,
  GraduationCap,
  Check,
  CheckCheck,
  X,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

type StudyView =
  | { kind: "root" }
  | { kind: "roadmap" }
  | { kind: "regulations" }
  | { kind: "regulation-reader"; mabhas: number }
  | { kind: "lessons" }
  | { kind: "lesson-reader"; mabhas: number };

export default function Study({
  bootstrap,
  pool,
  initialView,
  onViewConsumed,
  nav,
}: {
  bootstrap: Bootstrap | null;
  pool: QLite[];
  initialView: StudyView | null;
  onViewConsumed: () => void;
  nav: { startMabhasPractice: (m: number) => void; go: (t: "dashboard" | "study" | "practice" | "exam" | "settings") => void };
}) {
  const { lastStudy, studiedBands, officialSessionsSeen, mistakes, answers } = useMhy();
  const [view, setView] = useState<StudyView>(initialView ?? { kind: "root" });

  useEffect(() => {
    if (!initialView) return;
    const t = setTimeout(() => {
      setView(initialView);
      onViewConsumed();
    }, 0);
    return () => clearTimeout(t);
  }, [initialView]);

  const mabhasRegs = bootstrap?.mabhasWithRegulation ?? [];
  const mabhasIndex = bootstrap?.mabhasIndex ?? [];
  const mastery = useMemo(
    () => mabhasMastery(answers, (qid) => pool.find((q) => q.id === qid)?.mabhas ?? null),
    [answers, pool]
  );
  const [lessons, setLessons] = useState<{ mabhas: number; title: string; topics: number }[]>([]);
  useEffect(() => {
    api.lessons().then((j) => setLessons(j.lessons)).catch(() => setLessons([]));
  }, []);
  // data-driven state per mabhas (directive §53) — REVIEW_REQUIRED questions from the real pool
  const reviewByMabhas = useMemo(() => {
    const map = new Map<number, number>();
    for (const q of pool) {
      if (q.status === "REVIEW_REQUIRED" && q.mabhas != null)
        map.set(q.mabhas, (map.get(q.mabhas) ?? 0) + 1);
    }
    return map;
  }, [pool]);
  const reviewBadge = (m: number) =>
    reviewByMabhas.get(m) ? (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
        style={{ background: "rgba(227,178,94,0.92)", color: "#241a05" }}
        aria-label={`${faNum(reviewByMabhas.get(m) ?? 0)} محتوای نیازمند بازبینی`}
      >
        <AlertTriangle size={10} />
        {faNum(reviewByMabhas.get(m) ?? 0)}
      </span>
    ) : undefined;
  const lessonShortTitle = (t: string) => (t.includes("–") ? (t.split("–").pop() ?? t).trim() : t);

  if (view.kind === "regulation-reader") {
    return <RegulationReader mabhas={view.mabhas} onBack={() => setView({ kind: "regulations" })} nav={nav} />;
  }
  if (view.kind === "lesson-reader") {
    return <LessonReader mabhas={view.mabhas} onBack={() => setView({ kind: "lessons" })} nav={nav} />;
  }

  /* ── regulations — Premium Technical Library (§15/§19–§21) ── */
  if (view.kind === "regulations") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto pb-8 screen-in">
        <SubHeader title="مباحث مقررات ملی ساختمان" onBack={() => setView({ kind: "root" })} />

        {/* library masthead — real content stats, not decoration */}
        <div className="px-5 pt-2">
          <Eyebrow tone="accent">کتابخانه مقررات</Eyebrow>
          <p className="num t-caption mt-1 leading-6" style={{ color: "var(--muted-foreground)" }}>
            {faNum(mabhasIndex.length)} مبحث · {faNum(mabhasRegs.length)} مبحث با متن کامل بند ·{" "}
            {faNum(bootstrap?.stats.regulationBandTexts ?? 0)} بند واقعی
          </p>
        </div>

        {/* readable-first rail — مباحثی که متن کامل بندها را دارند */}
        {mabhasRegs.length > 0 && (
          <section className="mt-5" aria-label="مباحث با متن کامل">
            <div className="px-5">
              <Eyebrow>متن کامل بندها</Eyebrow>
            </div>
            <div className="mt-3">
              <SnapRail ariaLabel="مباحث دارای متن کامل — مرور افقی" fade={false}>
                {mabhasRegs.map((m) => {
                  const mi = mabhasIndex.find((x) => x.mabhas === m);
                  const mk = mastery[m];
                  return (
                    <div className="rail-item" key={m}>
                      <MabhasCover
                        mabhas={m}
                        variant="rail"
                        onClick={() => setView({ kind: "regulation-reader", mabhas: m })}
                        badge={reviewBadge(m)}
                        title={mabhasTitle(m)}
                        meta={mi ? `${faNum(mi.questions)} سؤال · قابل مطالعه` : "قابل مطالعه"}
                        progress={mk?.mastery ?? null}
                      />
                    </div>
                  );
                })}
              </SnapRail>
            </div>
          </section>
        )}

        {/* full catalog — visual rows, one per mabhas (§20) */}
        <section className="mt-6 px-4" aria-label="فهرست کامل مباحث">
          <div className="construction mb-2" />
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {mabhasIndex.map((mi) => {
              const hasText = mabhasRegs.includes(mi.mabhas);
              const m = mastery[mi.mabhas];
              const rv = reviewByMabhas.get(mi.mabhas);
              return (
                <button
                  key={mi.mabhas}
                  onClick={() => (hasText ? setView({ kind: "regulation-reader", mabhas: mi.mabhas }) : nav.startMabhasPractice(mi.mabhas))}
                  className="press flex min-h-[76px] w-full items-center gap-3 py-3 text-right"
                  aria-label={`مبحث ${faNum(mi.mabhas)} — ${mabhasTitle(mi.mabhas)}`}
                >
                  <MabhasCover mabhas={mi.mabhas} variant="thumb" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                        {mabhasTitle(mi.mabhas)}
                      </p>
                      {hasText && <BookMarked size={13} style={{ color: "var(--primary)", flexShrink: 0 }} aria-label="متن بندها موجود" />}
                    </div>
                    <p className="num t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {mabhasEdition(mi.mabhas) && <span style={{ color: "var(--primary)", opacity: 0.85 }}>{mabhasEdition(mi.mabhas)} · </span>}
                      {hasText ? "متن بندها · " : ""}
                      {faNum(mi.questions)} سؤال ({faNum(mi.official)} رسمی)
                      {m ? ` · ٪${faNum(m.mastery)} تسلط` : ""}
                    </p>
                    {rv ? (
                      <span
                        className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
                      >
                        <AlertTriangle size={9} />
                        {faNum(rv)} نیازمند بازبینی
                      </span>
                    ) : null}
                  </div>
                  {m && (
                    <span className="w-14 shrink-0">
                      <ProgressBar pct={m.mastery} height={4} />
                    </span>
                  )}
                  <ChevronLeft size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  /* ── lessons list — chapters of a premium technical book (§23) ── */
  if (view.kind === "lessons") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto pb-8 screen-in">
        <SubHeader title="درسنامه‌ها" onBack={() => setView({ kind: "root" })} />
        <div className="px-5 pt-2">
          <Eyebrow tone="accent">درسنامه‌های جامع</Eyebrow>
          <p className="num t-caption mt-1 leading-6" style={{ color: "var(--muted-foreground)" }}>
            {faNum(lessons.length || (bootstrap?.stats.lessons ?? 0))} درسنامه مبحث‌محور · {faNum(lessons.reduce((s, l) => s + l.topics, 0))} موضوع آموزشی
          </p>
        </div>
        <section className="mt-4 px-4" aria-label="فهرست درسنامه‌ها">
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {(lessons.length
              ? lessons
              : [...new Set((bootstrap?.mabhasIndex ?? []).map((m) => m.mabhas))].filter((m) => m <= 22).map((m) => ({ mabhas: m, title: `درسنامه جامع مبحث ${faNum(m)}`, topics: 0 }))
            ).map((l) => (
              <button
                key={l.mabhas}
                onClick={() => setView({ kind: "lesson-reader", mabhas: l.mabhas })}
                className="press flex min-h-[76px] w-full items-center gap-3 py-3 text-right"
                aria-label={`درسنامه مبحث ${faNum(l.mabhas)}`}
              >
                <MabhasCover mabhas={l.mabhas} variant="thumb" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                    {lessonShortTitle(l.title)}
                  </p>
                  <p className="num t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    درسنامه جامع مبحث {faNum(l.mabhas)}
                    {l.topics ? ` · ${faNum(l.topics)} موضوع` : ""}
                  </p>
                </div>
                <ChevronLeft size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── roadmap — checkpoint/timeline language (§7) ── */
  if (view.kind === "roadmap") {
    const steps = buildRoadmap(mabhasIndex.map((m) => m.mabhas), mistakes.length > 0, officialSessionsSeen.length);
    const doneCount = steps.filter((s) => s.done).length;
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <SubHeader title="نقشه راه آمادگی" onBack={() => setView({ kind: "root" })} />
        <p className="t-caption mt-1 px-1 leading-6" style={{ color: "var(--muted-foreground)" }}>
          مسیر پیشنهادی بر اساس رشته، صلاحیت و عملکرد شما — با پیشرفت شما به‌روز می‌شود.
        </p>
        <div className="mt-4 px-1">
          <div className="mb-1.5 flex items-center justify-between">
            <Eyebrow tone="accent">مسیر شما</Eyebrow>
            <span className="num t-caption" style={{ color: "var(--muted-foreground)" }}>
              {faNum(doneCount)} از {faNum(steps.length)} مرحله
            </span>
          </div>
          <SegmentedProgress value={doneCount} total={steps.length} ariaLabel="پیشرفت نقشه راه" />
        </div>
        <div className="mt-4">
          {steps.map((s, i) => (
            <div key={s.id} className="relative flex gap-3 pb-5">
              {i < steps.length - 1 && <div className="absolute right-[17px] top-10 h-full w-px" style={{ background: "var(--border-strong)" }} />}
              <div
                className="num z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                style={{
                  background: s.done ? "var(--primary)" : "var(--surface)",
                  border: s.done ? "none" : "2px solid var(--border-strong)",
                  color: s.done ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                {s.done ? <Check size={16} strokeWidth={2.6} /> : faNum(s.phase)}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-[13.5px] font-bold" style={{ color: s.done ? "var(--muted-foreground)" : "var(--foreground)" }}>
                  {s.title}
                </p>
                <p className="t-caption mt-1 leading-5" style={{ color: "var(--muted-foreground)" }}>
                  {s.desc}
                </p>
                <button
                  className="press mt-2 inline-flex min-h-[36px] items-center gap-1 text-[12px] font-bold"
                  style={{ color: "var(--primary)" }}
                  onClick={() => {
                    if (s.action.kind === "study-mabhas" && s.action.mabhas) setView({ kind: "regulation-reader", mabhas: s.action.mabhas });
                    else if (s.action.kind === "official-exams") nav.go("exam");
                    else if (s.action.kind === "comprehensive") nav.go("exam");
                    else nav.go("practice");
                  }}
                >
                  {s.done ? "مرور دوباره" : "شروع مرحله"}
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── root — Premium Digital Technical Library (§16/§22/§58-1) ── */
  const readPct = bootstrap && mabhasRegs.length ? Math.round((new Set(studiedBands).size / (bootstrap.stats.regulationBandTexts || 1)) * 100) : 0;
  const heroM = lastStudy ?? { mabhas: mabhasRegs[0] ?? mabhasIndex[0]?.mabhas ?? 1, kind: "regulation" as const, bandId: null, at: 0 };
  const heroMastery = mastery[heroM.mabhas];
  const heroIsLast = Boolean(lastStudy);
  const lessonsRail = lessons.slice(0, 14);

  return (
    <div className="phone-scroll flex-1 overflow-y-auto pb-8 screen-in">
      {/* masthead — library, not a list (§16) */}
      <header
        className="blueprint-grid relative px-5 pb-4 pt-5"
        style={{ maskImage: "linear-gradient(180deg, black 62%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, black 62%, transparent 100%)" }}
      >
        <Eyebrow tone="accent">مطالعه</Eyebrow>
        <h1 className="t-title mt-1" style={{ color: "var(--foreground)" }}>
          کتابخانه فنی
        </h1>
        <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          مقررات ملی با متن واقعی بندها + درسنامه‌های مبحث‌محور
        </p>
      </header>

      {/* HERO — continue reading as a reading object, not a row (§16/§22) */}
      <div className="px-5">
        <MabhasCover
          mabhas={heroM.mabhas}
          variant="hero"
          onClick={() =>
            setView(heroM.kind === "lesson" ? { kind: "lesson-reader", mabhas: heroM.mabhas } : { kind: "regulation-reader", mabhas: heroM.mabhas })
          }
          badge={
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold"
              style={{
                background: heroIsLast ? "var(--primary)" : "rgba(255,255,255,0.9)",
                color: heroIsLast ? "var(--primary-foreground)" : "#10141b",
              }}
            >
              <BookOpen size={11} />
              {heroIsLast ? "ادامه مطالعه" : "شروع مطالعه"}
            </span>
          }
          title={mabhasTitle(heroM.mabhas)}
          meta={
            <>
              {heroM.kind === "lesson" ? "درسنامه جامع" : "متن بندها"}
              {" · مبحث "}
              {faNum(heroM.mabhas)}
              {heroMastery ? ` · ٪${faNum(heroMastery.mastery)} تسلط` : ""}
            </>
          }
          progress={heroMastery?.mastery ?? null}
        />
      </div>

      {/* RAIL 1 — مباحث مقررات (featured regulations with real band text) */}
      <SectionHeader
        title="مباحث مقررات ملی"
        action="همه"
        onAction={() => setView({ kind: "regulations" })}
      />
      <SnapRail ariaLabel="مباحث مقررات ملی — مرور افقی">
        {mabhasIndex.map((mi) => {
          const m = mastery[mi.mabhas];
          const hasText = mabhasRegs.includes(mi.mabhas);
          return (
            <div className="rail-item" key={mi.mabhas}>
              <MabhasCover
                mabhas={mi.mabhas}
                variant="rail"
                onClick={() =>
                  hasText
                    ? setView({ kind: "regulation-reader", mabhas: mi.mabhas })
                    : nav.startMabhasPractice(mi.mabhas)
                }
                badge={reviewBadge(mi.mabhas)}
                title={mabhasTitle(mi.mabhas)}
                meta={
                  hasText
                    ? `متن بندها · ${faNum(mi.questions)} سؤال`
                    : `${faNum(mi.questions)} سؤال`
                }
                progress={m?.mastery ?? null}
              />
            </div>
          );
        })}
        {/* end-cap — keep browsing */}
        <div className="rail-item flex items-center">
          <button
            onClick={() => setView({ kind: "regulations" })}
            className="press flex h-[224px] w-[112px] flex-col items-center justify-center gap-2 rounded-[1.25rem] border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            aria-label="مشاهده همه مباحث"
          >
            <BookMarked size={20} style={{ color: "var(--primary)" }} />
            <span className="num text-[10.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
              همه {faNum(mabhasIndex.length)} مبحث
            </span>
          </button>
        </div>
      </SnapRail>

      {/* RAIL 2 — درسنامه‌ها (chapters of a technical book, §23) */}
      <SectionHeader
        title="درسنامه‌ها"
        action="همه"
        onAction={() => setView({ kind: "lessons" })}
      />
      <SnapRail ariaLabel="درسنامه‌ها — مرور افقی">
        {lessonsRail.map((l) => (
          <div className="rail-item" key={l.mabhas}>
            <MabhasCover
              mabhas={l.mabhas}
              variant="rail"
              onClick={() => setView({ kind: "lesson-reader", mabhas: l.mabhas })}
              badge={
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)" }}
                >
                  <GraduationCap size={10} />
                  درسنامه
                </span>
              }
              title={lessonShortTitle(l.title)}
              meta={`${faNum(l.topics)} موضوع آموزشی`}
            />
          </div>
        ))}
        {lessonsRail.length === 0 && (
          <div className="rail-item flex items-center">
            <div className="skeleton h-[224px] w-[168px]" aria-hidden />
          </div>
        )}
        {lessons.length > lessonsRail.length && (
          <div className="rail-item flex items-center">
            <button
              onClick={() => setView({ kind: "lessons" })}
              className="press flex h-[224px] w-[112px] flex-col items-center justify-center gap-2 rounded-[1.25rem] border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              aria-label="مشاهده همه درسنامه‌ها"
            >
              <GraduationCap size={20} style={{ color: "var(--primary)" }} />
              <span className="num text-[10.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
                همه {faNum(lessons.length)}
              </span>
            </button>
          </div>
        )}
      </SnapRail>

      {/* roadmap — the one navigation row that remains (§28 keep functionality) */}
      <div className="mt-6 px-4">
        <div className="rounded-2xl border px-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <DenseList>
            <DenseRow
              icon={Route}
              title="نقشه راه آمادگی"
              desc="مسیر پیشنهادی بر اساس رشته، صلاحیت و عملکرد شما"
              onClick={() => setView({ kind: "roadmap" })}
            />
          </DenseList>
        </div>
      </div>

      {/* progress — editorial visualization (§16) */}
      <section className="mt-6 px-4" aria-label="پیشرفت مطالعه">
        <div className="construction mb-4" />
        <Eyebrow>پیشرفت کتابخانه</Eyebrow>
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing pct={readPct} size={84} strokeWidth={8} label="بندها" />
          <div className="min-w-0 flex-1">
            <p className="num text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
              {faNum(new Set(studiedBands).size)} بند از {faNum(bootstrap?.stats.regulationBandTexts ?? 0)} بند موجود
            </p>
            <p className="t-caption mt-1 leading-5" style={{ color: "var(--muted-foreground)" }}>
              با علامت‌گذاری هر بند در حالت مطالعه، پیشرفت اینجا ثبت می‌شود.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-4">
      <button onClick={onBack} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
        <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
        {title}
      </h1>
    </div>
  );
}

/* ═══ Regulation Reader — chapter navigation + clean reading surface (§14.2/§15) ═══ */
function RegulationReader({ mabhas, onBack, nav }: { mabhas: number; onBack: () => void; nav: { startMabhasPractice: (m: number) => void } }) {
  const [data, setData] = useState<{ mabhas: number; bands: MhyBand[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [chapterNav, setChapterNav] = useState(false);
  const { studiedBands, toggleStudiedBand, setLastStudy } = useMhy();

  useEffect(() => {
    api.regulations(mabhas)
      .then(setData)
      .catch(() => setError("متن مقررات این مبحث در کتابخانه دستگاه موجود نیست."));
    setLastStudy({ mabhas, bandId: null, kind: "regulation", at: Date.now() });
  }, [mabhas, setLastStudy]);

  const bands = useMemo(
    () =>
      (data?.bands ?? []).filter(
        (b) => !query.trim() || (b.title ?? "").includes(query) || b.band.includes(query) || (b.text ?? "").includes(query)
      ),
    [data, query]
  );

  const studiedInMabhas = useMemo(() => {
    const ids = new Set((data?.bands ?? []).map((b) => b.id));
    return studiedBands.filter((id) => ids.has(id)).length;
  }, [data, studiedBands]);
  const mabhasPct = data?.bands.length ? Math.round((studiedInMabhas / data.bands.length) * 100) : 0;

  const jumpTo = (bandId: number) => {
    setChapterNav(false);
    const t = setTimeout(() => {
      document.getElementById(`band-${bandId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      clearTimeout(t);
    }, 60);
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col screen-in">
        <SubHeader title={`مبحث ${faNum(mabhas)}`} onBack={onBack} />
        <EmptyState
          icon={BookOpen}
          title="متن مقررات موجود نیست"
          desc={error}
          action={{ label: "تمرین سؤالات این مبحث", onClick: () => nav.startMabhasPractice(mabhas) }}
        />
      </div>
    );
  }
  if (!data) return <LoadingBlock label="بارگذاری متن مقررات…" />;

  return (
    <div className="flex flex-1 flex-col screen-in">
      {/* reader top bar */}
      <div className="flex items-center gap-1.5 border-b px-3 pb-2.5 pt-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button onClick={onBack} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
            {mabhasTitle(mabhas)}
          </h1>
          <p className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
            مبحث {faNum(mabhas)} · {faNum(data.bands.length)} بند · ٪{faNum(mabhasPct)} مطالعه‌شده
          </p>
        </div>
        <button
          onClick={() => setChapterNav(true)}
          aria-label="فهرست بندها"
          className="press flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ color: "var(--primary)", background: "var(--primary-soft)" }}
        >
          <BookMarked size={18} />
        </button>
        <button
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="جستجو در بندها"
          aria-expanded={searchOpen}
          className="press flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ color: "var(--muted-foreground)" }}
        >
          {searchOpen ? <X size={18} /> : <Bookmark size={0} className="hidden" />}
          {!searchOpen && <SearchIcon />}
        </button>
      </div>

      {/* reading progress */}
      <div className="px-4 pt-2.5">
        <ProgressBar pct={mabhasPct} height={4} gradient />
      </div>

      {searchOpen && (
        <div className="fade-in px-4 pt-2.5">
          <SearchField value={query} onChange={setQuery} placeholder="جستجو در بندهای این مبحث…" ariaLabel="جستجو در بندها" autoFocus />
        </div>
      )}

      {/* reading surface — focus by subtraction: typographic bands, no boxes (§14.2) */}
      <div className="phone-scroll flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-[560px]">
          {/* chapter opener — the content object itself (§21/§24) */}
          <MabhasCover
            mabhas={mabhas}
            variant="banner"
            className="mb-5"
            title={mabhasTitle(mabhas)}
            meta={`${faNum(data.bands.length)} بند · ٪${faNum(mabhasPct)} مطالعه‌شده`}
            progress={mabhasPct}
          />
          {bands.map((b, bi) => {
            const studied = studiedBands.includes(b.id);
            return (
              <section
                key={b.id}
                id={`band-${b.id}`}
                aria-label={`بند ${b.band}`}
                style={{ transition: "opacity 0.25s ease" }}
              >
                {bi > 0 && <div className="construction my-5" />}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="num inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-extrabold" style={{ background: studied ? "var(--success-soft)" : "var(--primary-soft)", color: studied ? "var(--success)" : "var(--primary)" }}>
                      بند {b.band}
                    </span>
                    {b.page ? (
                      <span className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
                        ص {faNum(b.page)}
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => toggleStudiedBand(b.id)}
                    aria-pressed={studied}
                    aria-label={studied ? "حذف از مطالعه‌شده" : "علامت‌گذاری مطالعه‌شده"}
                    className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      color: studied ? "var(--success)" : "var(--muted-foreground)",
                      background: studied ? "var(--success-soft)" : "transparent",
                    }}
                  >
                    {studied ? <CheckCircle2 size={19} /> : <CheckCheck size={19} />}
                  </button>
                </div>
                {b.title && (
                  <h2 className="mt-2.5 text-[14.5px] font-bold leading-7" style={{ color: "var(--foreground)" }}>
                    {b.title}
                  </h2>
                )}
                {b.text && (
                  <p className="reader-body mt-2" style={{ color: "var(--foreground)", opacity: studied ? 0.62 : 1 }}>
                    {b.text}
                  </p>
                )}
                <button
                  onClick={() => {
                    setLastStudy({ mabhas, bandId: b.id, kind: "regulation", at: Date.now() });
                    nav.startMabhasPractice(mabhas);
                  }}
                  className="press mt-3 text-[11px] font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  سؤالات مرتبط با این مبحث ←
                </button>
              </section>
            );
          })}
          {bands.length === 0 && (
            <p className="py-10 text-center t-body-sm" style={{ color: "var(--muted-foreground)" }}>
              بندی با این عبارت پیدا نشد.
            </p>
          )}
        </div>
      </div>

      {/* chapter navigation sheet (§15) */}
      {chapterNav && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="فهرست بندها">
          <div className="fade-in absolute inset-0" style={{ background: "var(--scrim)" }} onClick={() => setChapterNav(false)} aria-hidden />
          <div className="sheet-up relative flex max-h-[75%] flex-col rounded-t-3xl border-t" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="t-section">فهرست بندها</h2>
              <button onClick={() => setChapterNav(false)} aria-label="بستن" className="press flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
                <X size={18} />
              </button>
            </div>
            <p className="num px-5 t-caption" style={{ color: "var(--muted-foreground)" }}>
              {faNum(studiedInMabhas)} از {faNum(data.bands.length)} بند مطالعه‌شده
            </p>
            <div className="phone-scroll flex-1 overflow-y-auto px-4 py-3">
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.bands.map((b) => {
                  const studied = studiedBands.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => jumpTo(b.id)}
                      className="press flex min-h-[46px] w-full items-center gap-3 py-2 text-right"
                    >
                      <CheckBadge on={studied} />
                      <span className="num text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
                        بند {b.band}
                      </span>
                      <span className="t-caption min-w-0 flex-1 truncate" style={{ color: "var(--muted-foreground)" }}>
                        {b.title ?? b.text?.slice(0, 44) ?? ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/* ═══ Lesson Reader — real structured lesson JSON (§9) ═══ */
function LessonReader({ mabhas, onBack, nav }: { mabhas: number; onBack: () => void; nav: { startMabhasPractice: (m: number) => void } }) {
  const [lesson, setLesson] = useState<{ mabhas: number; title: string; json: LessonJson | null } | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const { setLastStudy } = useMhy();

  useEffect(() => {
    api.lesson(mabhas)
      .then((j) => setLesson(j.lesson))
      .catch(() => setLesson(null));
    setLastStudy({ mabhas, bandId: null, kind: "lesson", at: Date.now() });
  }, [mabhas, setLastStudy]);

  if (!lesson) {
    return (
      <div className="flex flex-1 flex-col">
        <SubHeader title={`درسنامه مبحث ${faNum(mabhas)}`} onBack={onBack} />
        <EmptyState icon={GraduationCap} title="درسنامه موجود نیست" desc="درسنامه این مبحث در کتابخانه دستگاه یافت نشد." />
      </div>
    );
  }
  const topics = lesson.json?.topics ?? [];
  return (
    <div className="flex flex-1 flex-col screen-in">
      <div className="flex items-center gap-1.5 border-b px-3 pb-2.5 pt-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button onClick={onBack} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
            {lesson.title}
          </h1>
          <p className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
            {faNum(topics.length)} موضوع آموزشی
          </p>
        </div>
        <button onClick={() => nav.startMabhasPractice(mabhas)} className="press min-h-[38px] rounded-xl px-3 text-[11.5px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          سؤالات
        </button>
      </div>
      <div className="phone-scroll flex-1 overflow-y-auto px-4 py-3.5">
        <div className="mx-auto max-w-[560px]">
          {/* chapter opener — lesson as a chapter of a technical book (§23) */}
          <MabhasCover
            mabhas={mabhas}
            variant="banner"
            className="mb-5"
            title={lesson.title}
            meta={`${faNum(topics.length)} موضوع آموزشی · درسنامه جامع`}
          />
        </div>
        <div className="space-y-2.5">
          {topics.map((t) => {
            const open = openTopic === t.topic_id;
            return (
              <div key={t.topic_id} className="rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <button onClick={() => setOpenTopic(open ? null : t.topic_id)} className="press flex min-h-[52px] w-full items-center gap-2.5 p-3.5 text-right" aria-expanded={open}>
                  <span className="flex-1 text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                    {t.title}
                  </span>
                  <ChevronLeft size={16} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }} />
                </button>
                {open && (
                  <div className="fade-in px-4 pb-4">
                    {t.content && <p className="reader-body" style={{ color: "var(--foreground)" }}>{t.content}</p>}
                    {t.key_points && t.key_points.length > 0 && (
                      <ul className="mt-2.5 space-y-1.5">
                        {t.key_points.map((k, i) => (
                          <li key={i} className="t-body-sm flex gap-2 leading-6" style={{ color: "var(--foreground)" }}>
                            <span style={{ color: "var(--primary)" }}>•</span>
                            {k}
                          </li>
                        ))}
                      </ul>
                    )}
                    {t.common_mistakes && t.common_mistakes.length > 0 && (
                      <div className="mt-3 rounded-xl p-3" style={{ background: "var(--danger-soft)" }}>
                        <p className="text-[11px] font-bold" style={{ color: "var(--danger)" }}>
                          اشتباهات رایج
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {t.common_mistakes.map((k, i) => (
                            <li key={i} className="text-[11px] leading-5" style={{ color: "var(--danger)" }}>
                              — {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {t.regulation_refs && t.regulation_refs.length > 0 && (
                      <p className="num t-caption mt-2.5" style={{ color: "var(--muted-foreground)" }}>
                        ارجاع مقررات:{" "}
                        {t.regulation_refs.map((r) => `مبحث ${faNum(r.mabhas)}${r.band ? ` بند ${r.band}` : ""}`).join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
