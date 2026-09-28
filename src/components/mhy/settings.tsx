"use client";

import { useMemo, useState } from "react";
import type { Bootstrap } from "@/lib/mhy/server";
import { useMhy, groupDisciplines, competencyOfCode, mabhasTitle } from "@/lib/mhy/store";
import { faNum, daysUntil } from "@/lib/mhy/engines";
import { Card, SectionHeader, Btn, EmptyState, Toggle, BottomSheet, Modal, CheckBadge, DisciplineGlyph, CountdownRing, SearchField, DenseRow, DenseList, Eyebrow } from "./ui";
import {
  KeyRound,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Database,
  Trash2,
  BadgeCheck,
  UserRound,
  Target,
  CalendarDays,
  ChevronLeft,
  SunMoon,
  Layers,
  Check,
} from "lucide-react";

const CONTENT_VERSION = "محتوای واقعی APK نسخه ۱.۰.۰ (mohandesyar_v7)";

export default function Settings({ bootstrap, dark, onToggleDark }: { bootstrap: Bootstrap | null; dark: boolean; onToggleDark: (v: boolean) => void }) {
  const { profile, license, answers, bookmarks, mistakes, attempts, studiedBands, updateProfile, activateLicense, resetAll } = useMhy();
  const [showReset, setShowReset] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenState, setTokenState] = useState<"idle" | "invalid" | "ok">("idle");
  const [compsOpen, setCompsOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [draftComps, setDraftComps] = useState<string[]>([]);
  const [draftExam, setDraftExam] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState("");
  const [sessionQuery, setSessionQuery] = useState("");

  // license state machine (§40) — offline-first friendly
  const licDaysLeft = license.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - license.activatedAt) / 86400000)) : null;

  const tryActivate = () => {
    if (tokenInput.trim().length < 6) {
      setTokenState("invalid");
      return;
    }
    activateLicense(tokenInput.trim());
    setTokenState("ok");
  };

  const answeredCount = Object.values(answers).filter((a) => a.choice !== null).length;
  const groups = useMemo(() => groupDisciplines(bootstrap?.disciplines, bootstrap?.disciplineStats), [bootstrap]);
  const myGroup = groups.find((g) => g.code === profile.disciplineGroup) ?? null;
  const comps = profile.competencies ?? [];
  const daysLeft = profile.targetExamDate ? daysUntil(profile.targetExamDate) : null;
  const sessions = useMemo(() => {
    const q = sessionQuery.trim();
    return q ? (bootstrap?.sessions ?? []).filter((s) => s.session.includes(q)) : bootstrap?.sessions ?? [];
  }, [bootstrap, sessionQuery]);

  const openCompsEditor = () => {
    setDraftComps(comps);
    setCompsOpen(true);
  };
  const saveComps = () => {
    updateProfile({
      competencies: draftComps,
      activeCompetency: draftComps.includes(profile.activeCompetency ?? "") ? profile.activeCompetency : draftComps.length === 1 ? draftComps[0] : null,
    });
    setCompsOpen(false);
  };

  const openExamEditor = () => {
    setDraftExam(profile.targetExam);
    setDraftDate(profile.targetExamDate ? new Date(profile.targetExamDate).toISOString().slice(0, 10) : "");
    setExamOpen(true);
  };
  const saveExam = () => {
    updateProfile({ targetExam: draftExam, targetExamDate: draftDate ? new Date(draftDate).getTime() : null });
    setExamOpen(false);
  };

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <header className="pt-4">
        <Eyebrow>تنظیمات</Eyebrow>
        <h1 className="t-title mt-1">پیکربندی ابزار</h1>
      </header>

      {/* profile */}
      <SectionHeader title="پروفایل من" />
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-[16px] font-extrabold" style={{ background: "var(--grad-hero)", color: "#fff" }}>
            {profile.name ? profile.name.slice(0, 1) : <UserRound size={20} />}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
              {profile.name || "مهندس مهمان"}
            </p>
            <p className="t-caption mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {profile.disciplineTitle ?? "رشته انتخاب نشده"}
              {comps.length ? ` · ${comps.map((c) => competencyOfCode(bootstrap?.disciplines, c)).join("، ")}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <input
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="نام شما (اختیاری)"
            aria-label="نام شما"
            className="h-11 w-full rounded-xl border px-3.5 text-[13px] outline-none"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>
      </Card>

      {/* competencies + target + display — one quiet dense surface (§10) */}
      <SectionHeader title="حساب و نمایش" />
      <div className="rounded-2xl border px-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <DenseList>
          <DenseRow
            icon={profile.disciplineGroup ? undefined : Layers}
            glyph={profile.disciplineGroup ? <span style={{ color: "var(--primary)", display: "flex" }}><DisciplineGlyph code={profile.disciplineGroup} size={22} /></span> : undefined}
            title={profile.disciplineTitle ?? "انتخاب رشته"}
            desc={comps.length ? `${faNum(comps.length)} صلاحیت فعال` : "صلاحیتی انتخاب نشده"}
            onClick={openCompsEditor}
          />
          <DenseRow
            icon={Target}
            tone="var(--copper)"
            title={profile.targetExam ?? "آزمون هدف ثبت نشده"}
            desc={
              <span className="num">
                {profile.targetExamDate ? new Date(profile.targetExamDate).toLocaleDateString("fa-IR") : "بدون تاریخ"}
                {daysLeft !== null && daysLeft >= 0 ? ` · ${faNum(daysLeft)} روز مانده` : ""}
              </span>
            }
            onClick={openExamEditor}
          />
          <DenseRow
            icon={SunMoon}
            title="حالت تیره"
            desc="تم یکپارچه در کل برنامه"
            right={<Toggle on={dark} onChange={onToggleDark} label="حالت تیره" />}
          />
        </DenseList>
      </div>

      {/* license (§40) */}
      <SectionHeader title="لایسنس" />
      <Card>
        {license.token ? (
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck size={17} style={{ color: "var(--success)" }} />
              <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
                لایسنس فعال
              </p>
            </div>
            <p className="num t-caption mt-1.5" style={{ color: "var(--muted-foreground)" }}>
              {licDaysLeft !== null && licDaysLeft > 7
                ? `آفلاین — ${faNum(licDaysLeft)} روز اعتبار باقی‌مانده`
                : licDaysLeft !== null
                  ? `تنها ${faNum(licDaysLeft)} روز مانده — برای تمدید به اتصال نیاز است`
                  : ""}
            </p>
            <div className="mt-2.5 rounded-xl p-3" style={{ background: "var(--success-soft)" }}>
              <p className="t-caption leading-5" style={{ color: "var(--success)" }}>
                در حالت آفلاین، همه محتوای دستگاه (سؤالات، مقررات، درسنامه‌ها) در دسترس است. فقط بروزرسانی محتوا و تأیید دوره‌ای به اینترنت نیاز دارد.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              <KeyRound size={14} className="ml-1 inline" /> توکن فعال‌سازی
            </p>
            <div className="mt-2 flex gap-2">
              <input
                dir="ltr"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setTokenState("idle");
                }}
                placeholder="MHYR-XXXX-XXXX"
                aria-label="توکن فعال‌سازی"
                className="num h-11 flex-1 rounded-xl border px-3.5 text-left text-[13px] outline-none"
                style={{ background: "var(--surface)", borderColor: tokenState === "invalid" ? "var(--danger)" : "var(--border)", color: "var(--foreground)" }}
              />
              <Btn size="sm" onClick={tryActivate}>
                <RefreshCw size={14} />
                فعال‌سازی
              </Btn>
            </div>
            {tokenState === "invalid" && (
              <p className="t-caption mt-2 flex items-center gap-1.5" style={{ color: "var(--danger)" }} role="alert">
                <AlertTriangle size={13} /> توکن معتبر نیست — دوباره بررسی کنید.
              </p>
            )}
            <p className="t-meta mt-2" style={{ color: "var(--muted-foreground)" }}>
              برای نسخه نمایشی، هر مقدار ۶ نویسه‌ای پذیرفته می‌شود.
            </p>
          </div>
        )}
      </Card>

      {/* appearance removed — moved into account/display dense surface */}

      {/* data & content (§38 transparency) */}
      <SectionHeader title="داده و محتوا" />
      <Card>
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: "var(--primary)" }} />
          <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            نسخه محتوا
          </p>
        </div>
        <p className="t-caption mt-1.5 leading-5" style={{ color: "var(--muted-foreground)" }}>
          {CONTENT_VERSION}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            [faNum(bootstrap?.stats.questions ?? 0), "سؤال در کتابخانه"],
            [faNum(bootstrap?.stats.official ?? 0), "رسمی با هویت جلسه"],
            [faNum(bootstrap?.stats.reviewRequired ?? 0), "نیازمند بازبینی (شفاف)"],
            [faNum(bootstrap?.stats.regulationBandTexts ?? 0), "بند مقررات با متن"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl p-2.5 text-center" style={{ background: "var(--surface)" }}>
              <p className="num text-[15px] font-extrabold" style={{ color: "var(--foreground)" }}>
                {v}
              </p>
              <p className="t-meta" style={{ color: "var(--muted-foreground)" }}>
                {l}
              </p>
            </div>
          ))}
        </div>
        <p className="num t-meta mt-3 leading-4" style={{ color: "var(--muted-foreground)" }}>
          پیشرفت شما روی این دستگاه: {faNum(answeredCount)} پاسخ · {faNum(bookmarks.length)} نشانک · {faNum(mistakes.length)} اشتباه · {faNum(attempts.length)} آزمون · {faNum(new Set(studiedBands).size)} بند مطالعه‌شده
        </p>
      </Card>

      {/* about */}
      <SectionHeader title="درباره" />
      <Card>
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={17} style={{ color: "var(--success)" }} className="mt-0.5 shrink-0" />
          <p className="t-caption leading-6" style={{ color: "var(--muted-foreground)" }}>
            مهندس‌یار V2 — محتوای این نسخه مستقیماً از پایگاه داده رسمی اپلیکیشن (۲۱۹۱ سؤال واقعی) خوانده می‌شود. هیچ سؤال یا پاسخی ساختگی اضافه نشده و سؤالات نیازمند بازبینی با برچسب شفاف نمایش داده می‌شوند.
          </p>
        </div>
      </Card>

      <div className="mt-4">
        <Btn full variant="secondary" onClick={() => setShowReset(true)}>
          <Trash2 size={15} style={{ color: "var(--danger)" }} />
          بازنشانی کامل پیشرفت و پروفایل
        </Btn>
      </div>

      {/* reset modal */}
      <Modal open={showReset} onClose={() => setShowReset(false)} ariaLabel="تایید بازنشانی">
        <p className="text-center text-[15px] font-extrabold" style={{ color: "var(--foreground)" }}>
          بازنشانی کامل؟
        </p>
        <p className="t-body-sm mt-2 text-center leading-6" style={{ color: "var(--muted-foreground)" }}>
          همه پیشرفت، نشانک‌ها، اشتباهات و آزمون‌های شما پاک می‌شود و به مرحله انتخاب رشته برمی‌گردید. این کار برگشت‌پذیر نیست.
        </p>
        <div className="mt-5 flex gap-2.5">
          <Btn variant="secondary" onClick={() => setShowReset(false)}>
            انصراف
          </Btn>
          <div className="flex-1">
            <Btn full variant="danger" onClick={() => { resetAll(); setShowReset(false); }}>
              بازنشانی کن
            </Btn>
          </div>
        </div>
      </Modal>

      {/* competencies editor — real multi-select (§9.3) */}
      <BottomSheet
        open={compsOpen}
        onClose={() => setCompsOpen(false)}
        title="صلاحیت‌های من"
        footer={
          <div className="flex items-center gap-3">
            <p className="num t-caption min-w-[80px] font-bold" style={{ color: "var(--muted-foreground)" }}>
              {faNum(draftComps.length)} انتخاب
            </p>
            <div className="flex-1">
              <Btn full onClick={saveComps} disabled={!draftComps.length}>
                ذخیره
              </Btn>
            </div>
          </div>
        }
      >
        {myGroup ? (
          <div className="space-y-2">
            {myGroup.items.map((c) => {
              const on = draftComps.includes(c.majorCode);
              return (
                <button
                  key={c.majorCode}
                  onClick={() => setDraftComps((s) => (on ? s.filter((x) => x !== c.majorCode) : [...s, c.majorCode]))}
                  aria-pressed={on}
                  className="press flex min-h-[56px] w-full items-center gap-3 rounded-2xl border p-3.5 text-right"
                  style={{ background: on ? "var(--primary-soft)" : "var(--surface)", borderColor: on ? "var(--primary)" : "var(--border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                      {c.competency}
                    </p>
                    <p className="num t-caption" style={{ color: "var(--muted-foreground)" }}>
                      {faNum(c.total)} سؤال · {faNum(c.official)} رسمی
                    </p>
                  </div>
                  <CheckBadge on={on} />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Layers} title="ابتدا رشته را انتخاب کنید" desc="رشته‌ای برای نمایش صلاحیت‌ها یافت نشد. از رویبردن مجدد رویboarding استفاده کنید." />
        )}
      </BottomSheet>

      {/* target exam editor */}
      <BottomSheet
        open={examOpen}
        onClose={() => setExamOpen(false)}
        title="آزمون هدف"
        footer={
          <Btn full onClick={saveExam}>
            ذخیره
          </Btn>
        }
      >
        <p className="t-caption mb-2 font-bold" style={{ color: "var(--muted-foreground)" }}>
          جلسه رسمی (از کتابخانه واقعی)
        </p>
        <SearchField value={sessionQuery} onChange={setSessionQuery} placeholder="جستجوی جلسه…" ariaLabel="جستجوی جلسه" />
        <div className="mt-2.5 space-y-2">
          {sessions.slice(0, 6).map((s) => {
            const on = draftExam === s.session;
            return (
              <button
                key={s.session}
                onClick={() => setDraftExam(on ? null : s.session)}
                aria-pressed={on}
                className="press flex min-h-[50px] w-full items-center gap-3 rounded-2xl border px-3.5 text-right"
                style={{ background: on ? "var(--primary-soft)" : "var(--surface)", borderColor: on ? "var(--primary)" : "var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold" style={{ color: "var(--foreground)" }}>
                    {s.session}
                  </p>
                  <p className="num t-caption" style={{ color: "var(--muted-foreground)" }}>
                    {faNum(s.count)} سؤال رسمی · {faNum(s.majors)} رشته
                  </p>
                </div>
                {on && <Check size={17} style={{ color: "var(--primary)" }} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
        <p className="t-caption mb-1.5 mt-4 flex items-center gap-1.5 font-bold" style={{ color: "var(--muted-foreground)" }}>
          <CalendarDays size={14} />
          تاریخ آزمون هدف
        </p>
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          className="h-12 w-full rounded-2xl border px-4 text-[13px] outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
          aria-label="تاریخ آزمون هدف"
        />
        {draftDate && (
          <div className="mt-3">
            <CountdownRing daysLeft={daysUntil(new Date(draftDate).getTime())} examTitle={draftExam} />
          </div>
        )}
        <p className="t-meta mt-2" style={{ color: "var(--muted-foreground)" }}>
          تاریخ از تقویم دستگاه شما خوانده می‌شود؛ هیچ تاریخ ثابتی در برنامه درج نشده است.
        </p>
      </BottomSheet>
    </div>
  );
}
