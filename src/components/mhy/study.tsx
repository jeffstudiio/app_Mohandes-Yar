"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bootstrap, MhyBand, LessonJson } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle, mabhasEdition, SPECIAL_BOOKS } from "@/lib/mhy/store";
import { faNum, type QLite } from "@/lib/mhy/engines";
import { SectionHeader, ProgressBar, EmptyState, Btn, SearchField, LoadingBlock, ProgressRing, Eyebrow, CheckBadge, MabhasCover, BookCover, SnapRail } from "./ui";
import {
  BookOpen,
  BookMarked,
  GraduationCap,
  Check,
  CheckCheck,
  X,
  CheckCircle2,
  ChevronLeft,
  LibraryBig,
} from "lucide-react";

type StudyView =
  | { kind: "root" }
  | { kind: "regulations" }
  | { kind: "regulation-reader"; mabhas: number }
  | { kind: "lesson-reader"; mabhas: number }
  | { kind: "special-books" }
  | { kind: "special-book"; bookId: string };

export default function Study({
  bootstrap,
  initialView,
  onViewConsumed,
}: {
  bootstrap: Bootstrap | null;
  pool: QLite[];
  initialView: StudyView | null;
  onViewConsumed: () => void;
  nav: { startMabhasPractice: (m: number) => void; go: (t: "dashboard" | "study" | "practice" | "exam" | "shop" | "settings") => void };
}) {
  const { lastStudy, studiedBands } = useMhy();
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
  const [lessons, setLessons] = useState<{ mabhas: number; title: string; topics: number }[]>([]);
  useEffect(() => {
    api.lessons().then((j) => setLessons(j.lessons)).catch(() => setLessons([]));
  }, []);
  const lessonSet = useMemo(() => new Set(lessons.map((l) => l.mabhas)), [lessons]);

  if (view.kind === "regulation-reader") {
    return (
      <RegulationReader
        mabhas={view.mabhas}
        onBack={() => setView({ kind: "root" })}
        hasLesson={lessonSet.has(view.mabhas)}
        onOpenLesson={() => setView({ kind: "lesson-reader", mabhas: view.mabhas })}
      />
    );
  }
  if (view.kind === "lesson-reader") {
    return <LessonReader mabhas={view.mabhas} onBack={() => setView({ kind: "regulation-reader", mabhas: view.mabhas })} />;
  }
  if (view.kind === "special-book") {
    const b = SPECIAL_BOOKS.find((x) => x.id === view.bookId);
    return b ? <SpecialBookReader book={b} onBack={() => setView({ kind: "root" })} /> : null;
  }

  /* ── special-books — «همه»: same original-size wall, vertical scroll (user spec) ── */
  if (view.kind === "special-books") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto pb-8 screen-in">
        <SubHeader title="کتاب‌های تخصصی" onBack={() => setView({ kind: "root" })} />
        <div className="px-5 pt-2">
          <Eyebrow tone="accent">قفسه تخصصی</Eyebrow>
          <p className="num t-caption mt-1 leading-6" style={{ color: "var(--muted-foreground)" }}>
            {faNum(SPECIAL_BOOKS.length)} کتاب مرجع — استانداردها، دستورالعمل‌ها و منابع اختصاصی آزمون
          </p>
        </div>
        <section className="mt-5 px-4" aria-label="فهرست کامل کتاب‌های تخصصی">
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {SPECIAL_BOOKS.map((b) => (
              <BookCover
                key={b.id}
                book={b}
                variant="rail"
                className="mx-auto"
                onClick={() => setView({ kind: "special-book", bookId: b.id })}
                title={b.title}
                meta={b.meta ?? undefined}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── regulations — «همه»: full wall of original-size covers, vertical scroll (user spec) ── */
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

        {/* wall — same original size as the home rail, scrolls up/down (user spec) */}
        <section className="mt-5 px-4" aria-label="فهرست کامل مباحث">
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {mabhasIndex.map((mi) => {
              const hasText = mabhasRegs.includes(mi.mabhas);
              return (
                <MabhasCover
                  key={mi.mabhas}
                  mabhas={mi.mabhas}
                  variant="rail"
                  onClick={() => setView({ kind: "regulation-reader", mabhas: mi.mabhas })}
                  title={mabhasTitle(mi.mabhas)}
                  meta={hasText ? `متن کامل · ${faNum(mi.bands)} بند` : "در انتظار متن کامل"}
                  className="mx-auto"
                />
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  /* ── root — the technical library: books only, zero question noise (user spec) ── */
  const readPct = bootstrap && mabhasRegs.length ? Math.round((new Set(studiedBands).size / (bootstrap.stats.regulationBandTexts || 1)) * 100) : 0;
  const heroM = lastStudy ?? { mabhas: mabhasRegs[0] ?? mabhasIndex[0]?.mabhas ?? 1, kind: "regulation" as const, bandId: null, at: 0 };
  const heroIsLast = Boolean(lastStudy);

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
          مقررات ملی ساختمان مثل کتاب — فهرست، فصل‌ها و بندها
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
            </>
          }
        />
      </div>

      {/* RAIL 1 — مباحث مقررات ملی: compact bookshelf, 4 cards per view, bidirectional (user spec) */}
      <SectionHeader
        title="مباحث مقررات ملی"
        action="همه"
        onAction={() => setView({ kind: "regulations" })}
      />
      <SnapRail ariaLabel="مباحث مقررات ملی — مرور افقی دوطرفه" arrows>
        {mabhasIndex.map((mi) => (
          <div className="rail-item" key={mi.mabhas}>
            <MabhasCover
              mabhas={mi.mabhas}
              variant="mini"
              onClick={() => setView({ kind: "regulation-reader", mabhas: mi.mabhas })}
              ariaLabel={`مبحث ${faNum(mi.mabhas)} — ${mabhasTitle(mi.mabhas)}`}
            />
            <p
              className="mt-1.5 w-[78px] truncate text-[10px] font-bold leading-4"
              style={{ color: "var(--foreground)" }}
              title={mabhasTitle(mi.mabhas)}
            >
              {mabhasTitle(mi.mabhas)}
            </p>
          </div>
        ))}
        {/* end-cap — keep browsing */}
        <div className="rail-item flex items-center">
          <button
            onClick={() => setView({ kind: "regulations" })}
            className="press flex h-[104px] w-[78px] flex-col items-center justify-center gap-1.5 rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            aria-label="مشاهده همه مباحث"
          >
            <BookMarked size={17} style={{ color: "var(--primary)" }} />
            <span className="num text-[9.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
              همه
            </span>
          </button>
        </div>
      </SnapRail>

      {/* RAIL 2 — کتاب‌های تخصصی: same rail behavior as مباحث (user spec) — 7 real books */}
      <SectionHeader
        title="کتاب‌های تخصصی"
        action="همه"
        onAction={() => setView({ kind: "special-books" })}
      />
      <SnapRail ariaLabel="کتاب‌های تخصصی — مرور افقی دوطرفه" arrows>
        {SPECIAL_BOOKS.map((b) => (
          <div className="rail-item" key={b.id}>
            <BookCover
              book={b}
              variant="mini"
              onClick={() => setView({ kind: "special-book", bookId: b.id })}
              ariaLabel={b.title}
            />
            <p
              className="mt-1.5 line-clamp-2 w-[78px] text-[10px] font-bold leading-4"
              style={{ color: "var(--foreground)" }}
              title={b.title}
            >
              {b.title}
            </p>
          </div>
        ))}
        {/* end-cap — keep browsing */}
        <div className="rail-item flex items-center">
          <button
            onClick={() => setView({ kind: "special-books" })}
            className="press flex h-[104px] w-[78px] flex-col items-center justify-center gap-1.5 rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            aria-label="مشاهده همه کتاب‌های تخصصی"
          >
            <LibraryBig size={17} style={{ color: "var(--primary)" }} />
            <span className="num text-[9.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
              همه
            </span>
          </button>
        </div>
      </SnapRail>

      {/* progress — editorial visualization (§16) */}
      <section className="mt-7 px-4" aria-label="پیشرفت مطالعه">
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

/* ═══ Book Reader — هر مبحث مثل یک کتاب: فهرست، کلیات، فصل‌ها، بندها (user spec) ═══ */

type BookChapter = { key: string; num: string; title: string | null; bands: MhyBand[] };

/** real chapter structure from the regulations' own band numbering: "3-4-2" → chapter "3-4" */
function buildChapters(bands: MhyBand[]): BookChapter[] {
  const out: BookChapter[] = [];
  const byKey = new Map<string, BookChapter>();
  for (const b of bands) {
    const parts = (b.band || "").split("-");
    if (parts.length < 2) continue;
    const key = `${parts[0]}-${parts[1]}`;
    let ch = byKey.get(key);
    if (!ch) {
      ch = { key, num: parts[1], title: null, bands: [] };
      byKey.set(key, ch);
      out.push(ch);
    }
    if (ch.title == null && b.title) ch.title = b.title;
    ch.bands.push(b);
  }
  // the printed book numbers chapters sequentially — present them in book order, not scan order
  out.sort((a, b) => (parseInt(a.num, 10) || 999) - (parseInt(b.num, 10) || 999));
  return out;
}

const cleanChapterTitle = (t: string | null) => {
  if (!t) return null;
  const cut = t.replace(/^مبحث\s+[^:：]+[:：]?\s*/, "").trim();
  return (cut.length > 64 ? cut.slice(0, 62).trim() + "…" : cut) || null;
};

function RegulationReader({
  mabhas,
  onBack,
  hasLesson,
  onOpenLesson,
}: {
  mabhas: number;
  onBack: () => void;
  hasLesson: boolean;
  onOpenLesson: () => void;
}) {
  const [data, setData] = useState<{ mabhas: number; bands: MhyBand[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [chapterNav, setChapterNav] = useState(false);
  const { studiedBands, toggleStudiedBand, setLastStudy } = useMhy();

  useEffect(() => {
    api.regulations(mabhas)
      .then(setData)
      .catch(() => setError("متن کامل این مبحث در کتابخانه فعلی موجود نیست."));
    setLastStudy({ mabhas, bandId: null, kind: "regulation", at: Date.now() });
  }, [mabhas, setLastStudy]);

  const chapters = useMemo(() => buildChapters(data?.bands ?? []), [data]);

  const bands = useMemo(
    () =>
      (data?.bands ?? []).filter(
        (b) => !query.trim() || (b.title ?? "").includes(query) || b.band.includes(query) || (b.text ?? "").includes(query)
      ),
    [data, query]
  );

  // continuous reading follows the book's chapter order (data order inside each chapter)
  const orderedBands = useMemo(() => {
    if (query.trim()) return bands;
    return chapters.flatMap((c) => c.bands);
  }, [chapters, bands, query]);

  const studiedInMabhas = useMemo(() => {
    const ids = new Set((data?.bands ?? []).map((b) => b.id));
    return studiedBands.filter((id) => ids.has(id)).length;
  }, [data, studiedBands]);
  const mabhasPct = data?.bands.length ? Math.round((studiedInMabhas / data.bands.length) * 100) : 0;

  const jumpTo = (id: string) => {
    setChapterNav(false);
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      clearTimeout(t);
    }, 60);
  };

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col screen-in">
        <SubHeader title={`مبحث ${faNum(mabhas)}`} onBack={onBack} />
        <div className="phone-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[420px]">
            <MabhasCover mabhas={mabhas} variant="hero" className="mx-5 mt-2" title={mabhasTitle(mabhas)} meta={mabhasEdition(mabhas) ?? undefined} />
          </div>
          <EmptyState
            icon={BookOpen}
            title="متن کامل این مبحث هنوز موجود نیست"
            desc="کلید فصل‌ها و بندهای این مبحث به‌محض افزودن متن رسمی، همین‌جا مثل یک کتاب نمایش داده می‌شود."
            action={hasLesson ? { label: "مطالعه درسنامه آموزشی این مبحث", onClick: onOpenLesson } : undefined}
          />
        </div>
      </div>
    );
  }
  if (!data) return <LoadingBlock label="بارگذاری کتاب…" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col screen-in">
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
            مبحث {faNum(mabhas)} · {faNum(chapters.length)} فصل · {faNum(data.bands.length)} بند · ٪{faNum(mabhasPct)} مطالعه‌شده
          </p>
        </div>
        <button
          onClick={() => setChapterNav(true)}
          aria-label="فهرست کتاب"
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
          {searchOpen ? <X size={18} /> : <SearchIcon />}
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

      {/* reading surface — the book itself: cover, فهرست, فصل‌ها, بندها */}
      <div className="phone-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-[560px]">
          {/* chapter opener — the content object itself (§21/§24) */}
          <MabhasCover
            mabhas={mabhas}
            variant="banner"
            className="mb-4"
            title={mabhasTitle(mabhas)}
            meta={`${faNum(chapters.length)} فصل · ${faNum(data.bands.length)} بند · ٪${faNum(mabhasPct)} مطالعه‌شده`}
            progress={mabhasPct}
          />

          {/* فهرست کتاب — every entry jumps to its place in the flow (user spec) */}
          {!query.trim() && (
            <section aria-label="فهرست کتاب" className="mb-6">
              <div className="construction mb-3" />
              <div className="mb-2 flex items-baseline justify-between">
                <Eyebrow tone="accent">فهرست کتاب</Eyebrow>
                <span className="t-meta" style={{ color: "var(--muted-foreground)" }}>
                  مطالعه پیوسته: از پایین ادامه دهید
                </span>
              </div>
              <div className="divide-y rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                {chapters.map((ch, ci) => {
                  const chStudied = ch.bands.filter((b) => studiedBands.includes(b.id)).length;
                  return (
                    <button
                      key={ch.key}
                      onClick={() => jumpTo(`chapter-${ch.key}`)}
                      className="press flex min-h-[52px] w-full items-center gap-3 px-3.5 py-2.5 text-right"
                      aria-label={`پرش به فصل ${faNum(ch.num)}`}
                    >
                      <span
                        className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold"
                        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                      >
                        {faNum(ch.num)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                          فصل {faNum(ch.num)}{cleanChapterTitle(ch.title) ? ` — ${cleanChapterTitle(ch.title)}` : ""}
                        </span>
                        <span className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
                          {faNum(ch.bands.length)} بند{chStudied ? ` · ${faNum(chStudied)} مطالعه‌شده` : ""}
                        </span>
                      </span>
                      <ChevronLeft size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                    </button>
                  );
                })}
                {hasLesson && (
                  <button
                    onClick={onOpenLesson}
                    className="press flex min-h-[52px] w-full items-center gap-3 px-3.5 py-2.5 text-right"
                    aria-label="درسنامه آموزشی این مبحث"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "var(--success-soft)", color: "var(--success)" }}
                    >
                      <GraduationCap size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                        درسنامه آموزشی مبحث {faNum(mabhas)}
                      </span>
                      <span className="t-meta" style={{ color: "var(--muted-foreground)" }}>
                        جمع‌بندی آموزشی — پیوست کتاب
                      </span>
                    </span>
                    <ChevronLeft size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  </button>
                )}
              </div>
            </section>
          )}

          {/* continuous flow — bands of the whole book with real chapter markers */}
          {orderedBands.map((b) => {
            const studied = studiedBands.includes(b.id);
            const parts = (b.band || "").split("-");
            const chKey = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : null;
            const isFirstOfChapter = chKey ? chapters.find((c) => c.key === chKey)?.bands[0]?.id === b.id : false;
            const chapter = chKey ? chapters.find((c) => c.key === chKey) : null;
            return (
              <section key={b.id} id={`band-${b.id}`} aria-label={`بند ${b.band}`} style={{ transition: "opacity 0.25s ease" }}>
                {isFirstOfChapter && chapter && !query.trim() ? (
                  <div id={`chapter-${chapter.key}`} className="mb-4 mt-7 scroll-mt-4 first:mt-0">
                    <div className="construction mb-3" />
                    <div className="flex items-baseline gap-2">
                      <span className="num text-[11px] font-extrabold tracking-[0.1em]" style={{ color: "var(--primary)" }}>
                        فصل {faNum(chapter.num)}
                      </span>
                      {cleanChapterTitle(chapter.title) && (
                        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                          {cleanChapterTitle(chapter.title)}
                        </h2>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="construction my-5" />
                )}
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
                    onClick={() => {
                      toggleStudiedBand(b.id);
                      if (!studied) setLastStudy({ mabhas, bandId: b.id, kind: "regulation", at: Date.now() });
                    }}
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
                  <h3 className="mt-2.5 text-[14.5px] font-bold leading-7" style={{ color: "var(--foreground)" }}>
                    {b.title}
                  </h3>
                )}
                {b.text && (
                  <p className="reader-body mt-2" style={{ color: "var(--foreground)", opacity: studied ? 0.62 : 1 }}>
                    {b.text}
                  </p>
                )}
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

      {/* فهرست sheet — grouped by real chapters (user spec) */}
      {chapterNav && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="فهرست کتاب">
          <div className="fade-in absolute inset-0" style={{ background: "var(--scrim)" }} onClick={() => setChapterNav(false)} aria-hidden />
          <div className="sheet-up relative flex max-h-[75%] flex-col rounded-t-3xl border-t" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="t-section">فهرست کتاب</h2>
              <button onClick={() => setChapterNav(false)} aria-label="بستن" className="press flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
                <X size={18} />
              </button>
            </div>
            <p className="num px-5 t-caption" style={{ color: "var(--muted-foreground)" }}>
              {faNum(studiedInMabhas)} از {faNum(data.bands.length)} بند مطالعه‌شده · {faNum(chapters.length)} فصل
            </p>
            <div className="phone-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {chapters.map((ch) => (
                <div key={ch.key} className="mb-2">
                  <button
                    onClick={() => jumpTo(`chapter-${ch.key}`)}
                    className="press flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-right"
                    style={{ background: "var(--surface)" }}
                    aria-label={`پرش به فصل ${faNum(ch.num)}`}
                  >
                    <span className="num text-[11px] font-extrabold" style={{ color: "var(--primary)" }}>
                      فصل {faNum(ch.num)}
                    </span>
                    <span className="t-caption min-w-0 flex-1 truncate" style={{ color: "var(--muted-foreground)" }}>
                      {cleanChapterTitle(ch.title) ?? `${faNum(ch.bands.length)} بند`}
                    </span>
                    <ChevronLeft size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  </button>
                  <div className="mt-1 divide-y" style={{ borderColor: "var(--border)" }}>
                    {ch.bands.map((b) => {
                      const studied = studiedBands.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => jumpTo(`band-${b.id}`)}
                          className="press flex min-h-[44px] w-full items-center gap-3 py-2 pl-2 pr-4 text-right"
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
              ))}
              {hasLesson && (
                <button
                  onClick={() => {
                    setChapterNav(false);
                    onOpenLesson();
                  }}
                  className="press mt-2 flex min-h-[48px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right"
                  style={{ background: "var(--success-soft)" }}
                  aria-label="درسنامه آموزشی این مبحث"
                >
                  <GraduationCap size={16} style={{ color: "var(--success)" }} />
                  <span className="text-[12.5px] font-bold" style={{ color: "var(--success)" }}>
                    درسنامه آموزشی مبحث {faNum(mabhas)}
                  </span>
                </button>
              )}
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
function LessonReader({ mabhas, onBack }: { mabhas: number; onBack: () => void }) {
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
      <div className="flex min-h-0 flex-1 flex-col">
        <SubHeader title={`درسنامه مبحث ${faNum(mabhas)}`} onBack={onBack} />
        <div className="phone-scroll min-h-0 flex-1 overflow-y-auto">
          <EmptyState icon={GraduationCap} title="درسنامه موجود نیست" desc="درسنامه این مبحث در کتابخانه دستگاه یافت نشد." />
        </div>
      </div>
    );
  }
  const topics = lesson.json?.topics ?? [];
  return (
    <div className="flex min-h-0 flex-1 flex-col screen-in">
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
      </div>
      <div className="phone-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
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

/* ═══ Special Book Reader — کتاب‌های تخصصی (covers + honest detail until reading content lands) ═══ */
function SpecialBookReader({ book, onBack }: { book: (typeof SPECIAL_BOOKS)[number]; onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col screen-in">
      <div className="flex items-center gap-1.5 border-b px-3 pb-2.5 pt-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button onClick={onBack} aria-label="بازگشت" className="press flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14.5px] font-extrabold" style={{ color: "var(--foreground)" }}>
            {book.title}
          </h1>
          <p className="t-meta" style={{ color: "var(--muted-foreground)" }}>
            {book.meta ?? "کتاب تخصصی"}
          </p>
        </div>
      </div>
      <div className="phone-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-[560px]">
          <BookCover book={book} variant="banner" title={book.title} meta={book.meta ?? undefined} />
          <p className="t-body mt-4 leading-8" style={{ color: "var(--foreground)" }}>
            {book.desc}
          </p>
          <div className="construction my-5" />
          <EmptyState
            icon={BookOpen}
            title="محتوای مطالعه این کتاب به‌زودی تکمیل می‌شود"
            desc="مثل مباحث مقررات ملی، متن این کتاب با فهرست، فصل‌ها و بندها به کتابخانه اضافه خواهد شد."
          />
        </div>
      </div>
    </div>
  );
}
