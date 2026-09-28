"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyBand, LessonJson } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum, buildRoadmap, mabhasMastery, type QLite } from "@/lib/mhy/engines";
import { Card, SectionHeader, ProgressBar, EmptyState, Btn, SearchField, LoadingBlock, ProgressRing, DenseRow, DenseList, Eyebrow, SegmentedProgress, CheckBadge } from "./ui";
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

  if (view.kind === "regulation-reader") {
    return <RegulationReader mabhas={view.mabhas} onBack={() => setView({ kind: "regulations" })} nav={nav} />;
  }
  if (view.kind === "lesson-reader") {
    return <LessonReader mabhas={view.mabhas} onBack={() => setView({ kind: "lessons" })} nav={nav} />;
  }

  /* ── regulations topics (§14.1) — dense technical library rows ── */
  if (view.kind === "regulations") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <SubHeader title="مباحث مقررات ملی ساختمان" onBack={() => setView({ kind: "root" })} />
        <p className="t-caption mt-1 px-1 leading-6" style={{ color: "var(--muted-foreground)" }}>
          متن واقعی بندها از کتابخانه دستگاه. مبحث‌های دارای متن کامل بند، قابل مطالعه و علامت‌گذاری هستند.
        </p>
        <div className="mt-3 rounded-2xl border px-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <DenseList>
            {mabhasIndex.map((mi) => {
              const hasText = mabhasRegs.includes(mi.mabhas);
              const m = mastery[mi.mabhas];
              return (
                <DenseRow
                  key={mi.mabhas}
                  glyph={
                    <span
                      className="num flex h-10 w-10 items-center justify-center text-[14px] font-extrabold"
                      style={{
                        color: hasText ? "var(--primary)" : "var(--muted-foreground)",
                        borderRight: "1px solid var(--border)",
                        paddingLeft: 8,
                      }}
                    >
                      {faNum(mi.mabhas)}
                    </span>
                  }
                  title={mabhasTitle(mi.mabhas)}
                  desc={
                    <span className="num">
                      {hasText ? "متن بندها · " : ""}
                      {faNum(mi.questions)} سؤال ({faNum(mi.official)} رسمی)
                    </span>
                  }
                  meta={
                    m ? (
                      <span className="num text-[9.5px] font-bold" style={{ color: "var(--primary)" }}>
                        ٪{faNum(m.mastery)} تسلط
                      </span>
                    ) : undefined
                  }
                  onClick={() => (hasText ? setView({ kind: "regulation-reader", mabhas: mi.mabhas }) : nav.startMabhasPractice(mi.mabhas))}
                  right={
                    <span className="flex shrink-0 items-center gap-1.5">
                      {m && (
                        <span className="w-14">
                          <ProgressBar pct={m.mastery} height={4} />
                        </span>
                      )}
                      {hasText && <BookMarked size={16} style={{ color: "var(--primary)", opacity: 0.7 }} />}
                      <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
                    </span>
                  }
                />
              );
            })}
          </DenseList>
        </div>
      </div>
    );
  }

  /* ── lessons list — numbered chapters, dense ── */
  if (view.kind === "lessons") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <SubHeader title="درسنامه‌ها" onBack={() => setView({ kind: "root" })} />
        <p className="num t-caption mt-1 px-1" style={{ color: "var(--muted-foreground)" }}>
          {faNum(bootstrap?.stats.lessons ?? 0)} درسنامه جامع مبحث‌محور
        </p>
        <div className="mt-3 rounded-2xl border px-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <DenseList>
            {[...new Set((bootstrap?.mabhasIndex ?? []).map((m) => m.mabhas))].filter((m) => m <= 22).map((m) => (
              <DenseRow
                key={m}
                glyph={
                  <span className="num flex h-10 w-10 items-center justify-center text-[14px] font-extrabold" style={{ color: "var(--primary)", borderRight: "1px solid var(--border)", paddingLeft: 8 }}>
                    {faNum(m)}
                  </span>
                }
                title={`درسنامه — ${mabhasTitle(m)}`}
                onClick={() => setView({ kind: "lesson-reader", mabhas: m })}
              />
            ))}
          </DenseList>
        </div>
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

  /* ── root — reading-first composition (§14) ── */
  const readPct = bootstrap && mabhasRegs.length ? Math.round((new Set(studiedBands).size / (bootstrap.stats.regulationBandTexts || 1)) * 100) : 0;
  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <header className="pt-4">
        <Eyebrow tone="accent">مطالعه</Eyebrow>
        <h1 className="t-title mt-1">کتابخانه مطالعاتی شما</h1>
        <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          مقررات ملی با متن واقعی بندها + درسنامه‌های مبحث‌محور
        </p>
      </header>

      {/* Continue Reading — the one strong surface */}
      {lastStudy ? (
        <Card
          className="mt-4"
          onClick={() => setView(lastStudy.kind === "lesson" ? { kind: "lesson-reader", mabhas: lastStudy.mabhas } : { kind: "regulation-reader", mabhas: lastStudy.mabhas })}
          elevated
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--grad-hero)", color: "#fff" }}>
              <BookOpen size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="t-meta font-bold" style={{ color: "var(--primary)" }}>
                ادامه مطالعه
              </p>
              <p className="truncate text-[13.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
                {lastStudy.kind === "lesson" ? "درسنامه" : "مقررات"} — {mabhasTitle(lastStudy.mabhas)}
              </p>
              <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                مبحث {faNum(lastStudy.mabhas)}
                {lastStudy.bandId ? " · از آخرین بند" : ""}
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      ) : (
        <Card className="mt-4" onClick={() => setView({ kind: "regulations" })} elevated>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--grad-hero)", color: "#fff" }}>
              <BookOpen size={21} />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
                شروع مطالعه
              </p>
              <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                مباحث مقررات ملی — متن واقعی بندها
              </p>
            </div>
            <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
          </div>
        </Card>
      )}

      <SectionHeader title="فضاهای مطالعه" />
      <div className="rounded-2xl border px-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <DenseList>
          {[
            { icon: Route, title: "نقشه راه", desc: "مسیر آمادگی گام‌به‌گام بر اساس عملکرد شما", onClick: () => setView({ kind: "roadmap" }) },
            { icon: BookMarked, title: "مباحث مقررات ملی", desc: `${faNum(mabhasRegs.length)} مبحث با متن واقعی بندها`, onClick: () => setView({ kind: "regulations" }) },
            { icon: GraduationCap, title: "درسنامه‌ها", desc: `${faNum(bootstrap?.stats.lessons ?? 0)} درسنامه جامع مبحث‌محور`, onClick: () => setView({ kind: "lessons" }) },
          ].map(({ icon: Icon, title, desc, onClick }) => (
            <DenseRow key={title} icon={Icon} title={title} desc={desc} onClick={onClick} />
          ))}
        </DenseList>
      </div>

      <section className="mt-6" aria-label="پیشرفت مطالعه">
        <Eyebrow>پیشرفت مطالعه</Eyebrow>
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
