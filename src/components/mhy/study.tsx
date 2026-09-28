"use client";

import { useEffect, useState } from "react";
import type { Bootstrap, MhyBand, LessonJson } from "@/lib/mhy/server";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum, buildRoadmap, mabhasMastery, type QLite } from "@/lib/mhy/engines";
import { Card, SectionHeader, ProgressBar, EmptyState, Btn } from "./ui";
import {
  Route,
  BookOpen,
  BookMarked,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck,
  ClipboardList,
  X,
  Search,
  CheckCircle2,
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
  const { lastStudy, setLastStudy, studiedBands, toggleStudiedBand, officialSessionsSeen, mistakes, answers } = useMhy();
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
  const mastery = mabhasMastery(
    answers,
    (qid) => pool.find((q) => q.id === qid)?.mabhas ?? null
  );

  /* ── regulation reader ── */
  if (view.kind === "regulation-reader") {
    return <RegulationReader mabhas={view.mabhas} onBack={() => setView({ kind: "regulations" })} nav={nav} />;
  }

  /* ── lesson reader ── */
  if (view.kind === "lesson-reader") {
    return <LessonReader mabhas={view.mabhas} onBack={() => setView({ kind: "lessons" })} nav={nav} />;
  }

  /* ── regulations list ── */
  if (view.kind === "regulations") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <SubHeader title="مباحث مقررات ملی ساختمان" onBack={() => setView({ kind: "root" })} />
        <p className="text-[11.5px] leading-6" style={{ color: "var(--muted-foreground)" }}>
          متن واقعی بندها از کتابخانه دستگاه. مبحث‌های دارای متن کامل بند، قابل مطالعه و نشان‌گذاری هستند.
        </p>
        <div className="mt-3 space-y-2">
          {mabhasIndex.map((mi) => {
            const hasText = mabhasRegs.includes(mi.mabhas);
            return (
              <Card
                key={mi.mabhas}
                onClick={() => (hasText ? setView({ kind: "regulation-reader", mabhas: mi.mabhas }) : nav.startMabhasPractice(mi.mabhas))}
                ariaLabel={`مبحث ${mi.mabhas}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold"
                    style={{ background: hasText ? "var(--primary-soft)" : "var(--muted)", color: hasText ? "var(--primary)" : "var(--muted-foreground)" }}
                  >
                    {faNum(mi.mabhas)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                      مبحث {faNum(mi.mabhas)} — {mabhasTitle(mi.mabhas)}
                    </p>
                    <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {hasText ? "متن بندها + " : ""}
                      {faNum(mi.questions)} سؤال ({faNum(mi.official)} رسمی)
                    </p>
                    {mastery[mi.mabhas] && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
                          <div className="h-full rounded-full" style={{ width: `${mastery[mi.mabhas].mastery}%`, background: "var(--primary)" }} />
                        </div>
                        <span className="text-[9.5px] font-bold" style={{ color: "var(--primary)" }}>
                          تسلط ٪{faNum(mastery[mi.mabhas].mastery)}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── lessons list ── */
  if (view.kind === "lessons") {
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <SubHeader title="درسنامه‌ها" onBack={() => setView({ kind: "root" })} />
        <p className="text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
          {faNum(bootstrap?.stats.lessons ?? 0)} درسنامه جامع مبحث‌محور
        </p>
        <div className="mt-3 space-y-2">
          {[...new Set((bootstrap?.mabhasIndex ?? []).map((m) => m.mabhas))].filter((m) => m <= 22).map((m) => (
            <Card key={m} onClick={() => setView({ kind: "lesson-reader", mabhas: m })} ariaLabel={`درسنامه مبحث ${m}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
                  <GraduationCap size={19} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                    درسنامه مبحث {faNum(m)} — {mabhasTitle(m)}
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

  /* ── roadmap ── */
  if (view.kind === "roadmap") {
    const steps = buildRoadmap(mabhasIndex.map((m) => m.mabhas), mistakes.length > 0, officialSessionsSeen.length);
    return (
      <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
        <SubHeader title="نقشه راه آمادگی" onBack={() => setView({ kind: "root" })} />
        <p className="text-[11.5px] leading-6" style={{ color: "var(--muted-foreground)" }}>
          مسیر پیشنهادی بر اساس رشته، صلاحیت و عملکرد شما — با پیشرفت شما به‌روز می‌شود.
        </p>
        <div className="mt-4 space-y-0">
          {steps.map((s, i) => (
            <div key={s.id} className="relative flex gap-3 pb-5">
              {i < steps.length - 1 && <div className="absolute right-[17px] top-10 h-full w-0.5" style={{ background: "var(--border)" }} />}
              <div
                className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                style={{
                  background: s.done ? "var(--success)" : "var(--card)",
                  border: s.done ? "none" : "2px solid var(--border)",
                  color: s.done ? "#fff" : "var(--muted-foreground)",
                }}
              >
                {s.done ? <Check size={16} /> : faNum(s.phase)}
              </div>
              <div className="flex-1 rounded-2xl border p-3.5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                  {s.title}
                </p>
                <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--muted-foreground)" }}>
                  {s.desc}
                </p>
                <div className="mt-2.5">
                  <Btn
                    size="sm"
                    variant={s.done ? "secondary" : "primary"}
                    onClick={() => {
                      if (s.action.kind === "study-mabhas" && s.action.mabhas) setView({ kind: "regulation-reader", mabhas: s.action.mabhas });
                      else if (s.action.kind === "official-exams") nav.go("exam");
                      else if (s.action.kind === "comprehensive") nav.go("exam");
                      else nav.go("practice");
                    }}
                  >
                    {s.done ? "مرور دوباره" : "شروع مرحله"}
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── root ── */
  const readPct = bootstrap && mabhasRegs.length ? Math.round((new Set(studiedBands).size / (bootstrap.stats.regulationBandTexts || 1)) * 100) : 0;
  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <h1 className="pt-4 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
        مطالعه
      </h1>
      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
        چه چیزی باید یاد بگیرم؟
      </p>

      {/* resume card */}
      {lastStudy && (
        <div className="mt-4">
          <Card onClick={() => setView(lastStudy.kind === "lesson" ? { kind: "lesson-reader", mabhas: lastStudy.mabhas } : { kind: "regulation-reader", mabhas: lastStudy.mabhas })}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <BookOpen size={19} />
              </div>
              <div className="flex-1">
                <p className="text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                  ادامه از آخرین مطالعه
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                  {lastStudy.kind === "lesson" ? "درسنامه" : "مقررات"} — مبحث {faNum(lastStudy.mabhas)}
                </p>
              </div>
              <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
            </div>
          </Card>
        </div>
      )}

      <SectionHeader title="فضاهای مطالعه" />
      <div className="space-y-2.5">
        {[
          { icon: Route, title: "نقشه راه", desc: "مسیر آمادگی گام‌به‌گام بر اساس عملکرد شما", onClick: () => setView({ kind: "roadmap" }) },
          { icon: BookMarked, title: "مباحث مقررات ملی", desc: `${faNum(mabhasRegs.length)} مبحث با متن واقعی بندها — قابل جستجو و نشان‌گذاری`, onClick: () => setView({ kind: "regulations" }) },
          { icon: GraduationCap, title: "درسنامه‌ها", desc: `${faNum(bootstrap?.stats.lessons ?? 0)} درسنامه جامع مبحث‌محور`, onClick: () => setView({ kind: "lessons" }) },
        ].map(({ icon: Icon, title, desc, onClick }) => (
          <Card key={title} onClick={onClick} ariaLabel={title}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                  {title}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-4" style={{ color: "var(--muted-foreground)" }}>
                  {desc}
                </p>
              </div>
              <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />
            </div>
          </Card>
        ))}
      </div>

      <SectionHeader title="پیشرفت مطالعه" />
      <Card>
        <div className="flex items-center justify-between text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
          <span>بندهای مطالعه‌شده</span>
          <span style={{ color: "var(--primary)" }}>٪{faNum(readPct)}</span>
        </div>
        <div className="mt-2.5">
          <ProgressBar pct={readPct} />
        </div>
        <p className="mt-2 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
          {faNum(new Set(studiedBands).size)} بند از {faNum(bootstrap?.stats.regulationBandTexts ?? 0)} بند موجود
        </p>
      </Card>
    </div>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 pt-4">
      <button onClick={onBack} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
        <ChevronRight size={20} />
      </button>
      <h1 className="text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
        {title}
      </h1>
    </div>
  );
}

/* ═══ Regulation Reader — real band text, resume, mark-studied (§13/§14) ═══ */
function RegulationReader({ mabhas, onBack, nav }: { mabhas: number; onBack: () => void; nav: { startMabhasPractice: (m: number) => void } }) {
  const [data, setData] = useState<{ mabhas: number; bands: MhyBand[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { studiedBands, toggleStudiedBand, setLastStudy } = useMhy();

  useEffect(() => {
    fetch(`/api/mhy/regulations?mabhas=${mabhas}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no text"))))
      .then(setData)
      .catch(() => setError("متن مقررات این مبحث در کتابخانه دستگاه موجود نیست."));
    setLastStudy({ mabhas, bandId: null, kind: "regulation", at: Date.now() });
  }, [mabhas, setLastStudy]);

  const bands = (data?.bands ?? []).filter(
    (b) => !query.trim() || (b.title ?? "").includes(query) || b.band.includes(query) || (b.text ?? "").includes(query)
  );

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
  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          بارگذاری…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col screen-in">
      <div className="flex items-center gap-2 border-b px-4 pt-4 pb-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronRight size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-extrabold" style={{ color: "var(--foreground)" }}>
            مبحث {faNum(mabhas)} — {mabhasTitle(mabhas)}
          </h1>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {faNum(data.bands.length)} بند · متن واقعی از کتابخانه
          </p>
        </div>
        <button onClick={() => nav.startMabhasPractice(mabhas)} className="min-h-[40px] rounded-xl px-3 text-[11.5px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          سؤالات
        </button>
      </div>
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در بندهای این مبحث…"
            aria-label="جستجو در بندها"
            className="h-11 w-full rounded-2xl border pr-9 pl-3 text-[12.5px] outline-none focus:ring-2"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>
      </div>
      <div className="phone-scroll flex-1 overflow-y-auto px-4 py-3.5">
        <div className="space-y-3">
          {bands.map((b) => {
            const studied = studiedBands.includes(b.id);
            return (
              <div key={b.id} className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: studied ? "var(--success)" : "var(--border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-extrabold" style={{ color: "var(--primary)" }}>
                      بند {b.band}
                      {b.page ? ` · ص ${faNum(b.page)}` : ""}
                    </p>
                    {b.title && (
                      <p className="mt-1 text-[12.5px] font-bold leading-6" style={{ color: "var(--foreground)" }}>
                        {b.title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleStudiedBand(b.id)}
                    aria-pressed={studied}
                    aria-label={studied ? "حذف از مطالعه‌شده" : "علامت‌گذاری مطالعه‌شده"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ color: studied ? "var(--success)" : "var(--muted-foreground)" }}
                  >
                    {studied ? <CheckCircle2 size={19} /> : <CheckCheck size={19} />}
                  </button>
                </div>
                {b.text && (
                  <p className="mt-2 text-[12.5px] leading-8" style={{ color: "var(--foreground)", opacity: studied ? 0.75 : 1 }}>
                    {b.text}
                  </p>
                )}
                <button
                  onClick={() => {
                    setLastStudy({ mabhas, bandId: b.id, kind: "regulation", at: Date.now() });
                    nav.startMabhasPractice(mabhas);
                  }}
                  className="mt-2.5 text-[11px] font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  سؤالات مرتبط با این مبحث ←
                </button>
              </div>
            );
          })}
          {bands.length === 0 && (
            <p className="py-10 text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
              بندی با این عبارت پیدا نشد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Lesson Reader — real structured lesson JSON (§9) ═══ */
function LessonReader({ mabhas, onBack, nav }: { mabhas: number; onBack: () => void; nav: { startMabhasPractice: (m: number) => void } }) {
  const [lesson, setLesson] = useState<{ mabhas: number; title: string; json: LessonJson | null } | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const { setLastStudy } = useMhy();

  useEffect(() => {
    fetch(`/api/mhy/lesson?mabhas=${mabhas}`)
      .then((r) => r.json())
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
      <div className="flex items-center gap-2 border-b px-4 pt-4 pb-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} aria-label="بازگشت" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
          <ChevronRight size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-extrabold" style={{ color: "var(--foreground)" }}>
            {lesson.title}
          </h1>
          <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {faNum(topics.length)} موضوع آموزشی
          </p>
        </div>
        <button onClick={() => nav.startMabhasPractice(mabhas)} className="min-h-[40px] rounded-xl px-3 text-[11.5px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          سؤالات
        </button>
      </div>
      <div className="phone-scroll flex-1 overflow-y-auto px-4 py-3.5">
        <div className="space-y-2.5">
          {topics.map((t) => {
            const open = openTopic === t.topic_id;
            return (
              <div key={t.topic_id} className="rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <button onClick={() => setOpenTopic(open ? null : t.topic_id)} className="flex min-h-[52px] w-full items-center gap-2.5 p-3.5 text-right" aria-expanded={open}>
                  <span className="flex-1 text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
                    {t.title}
                  </span>
                  <ChevronLeft size={16} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(90deg)" : "none" }} />
                </button>
                {open && (
                  <div className="px-4 pb-4">
                    {t.content && (
                      <p className="text-[12px] leading-7" style={{ color: "var(--foreground)" }}>
                        {t.content}
                      </p>
                    )}
                    {t.key_points && t.key_points.length > 0 && (
                      <ul className="mt-2.5 space-y-1.5">
                        {t.key_points.map((k, i) => (
                          <li key={i} className="flex gap-2 text-[11.5px] leading-6" style={{ color: "var(--foreground)" }}>
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
                      <p className="mt-2.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
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
