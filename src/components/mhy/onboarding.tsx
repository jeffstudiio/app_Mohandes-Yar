"use client";

import { useMemo, useState } from "react";
import type { Bootstrap } from "@/lib/mhy/server";
import { useMhy, groupDisciplines, type DisciplineGroup } from "@/lib/mhy/store";
import { faNum } from "@/lib/mhy/engines";
import { Btn, DisciplineGlyph, MhyGlyph, CheckBadge, SegmentedProgress, Eyebrow, TechFrame } from "./ui";
import {
  WifiOff,
  KeyRound,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// ─── Onboarding — 01 Welcome · 02 Offline · 03 رشته (parent) · 04 صلاحیت‌ها (multi) · 05 Activation ───
// All counts derive from bootstrap.disciplineStats (real rows). No hard-coded numbers, ever (§9.2).
// آزمون هدف/جلسه ثبت نمی‌شود — شمارش معکوس داشبورد از ثابت رسمی آزمون ۱۴۰۵ استفاده می‌کند.

type OnbBootstrap = Bootstrap | null;

export default function Onboarding({ bootstrap, onDone }: { bootstrap: OnbBootstrap; onDone: () => void }) {
  const { completeOnboarding, activateLicense } = useMhy();
  const [step, setStep] = useState(0);
  const [group, setGroup] = useState<DisciplineGroup | null>(null);
  const [comps, setComps] = useState<string[]>([]); // real major codes, multi-select
  const [token, setToken] = useState("");
  const [tokenErr, setTokenErr] = useState("");

  const groups = useMemo(() => groupDisciplines(bootstrap?.disciplines, bootstrap?.disciplineStats), [bootstrap]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const toggleComp = (code: string) =>
    setComps((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]));

  const activate = () => {
    if (token.trim().length < 6) {
      setTokenErr("توکن معتبر نیست.");
      return;
    }
    activateLicense(token.trim());
    finish();
  };

  const finish = () => {
    completeOnboarding({
      disciplineGroup: group?.code ?? null,
      disciplineTitle: group?.title ?? null,
      competencies: comps,
      activeCompetency: comps.length === 1 ? comps[0] : null,
      targetExam: null,
      targetExamDate: null,
    });
    onDone();
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--background)" }}>
      {/* progress header — checkpoint segments */}
      {step > 0 && (
        <div className="flex items-center gap-3 px-5 pt-5">
          <button
            onClick={goBack}
            aria-label="بازگشت"
            className="press flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex-1">
            <SegmentedProgress value={step} total={4} height={5} ariaLabel="پیشرفت راه‌اندازی" />
          </div>
          <span className="num t-meta" style={{ color: "var(--muted-foreground)" }}>
            {faNum(step)} / {faNum(4)}
          </span>
        </div>
      )}

      {/* ── 01 Welcome — signature technical hero (composition surface) ── */}
      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <TechFrame className="tech-glow blueprint-grid relative flex w-full flex-col items-center rounded-3xl border px-6 py-9" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <Eyebrow tone="accent" className="justify-center">MHY · نسخه ۲</Eyebrow>
            <div className="relative mt-6">
              <MhyGlyph size={150} className="absolute -inset-7 opacity-[0.08]" style={{ color: "var(--primary)" }} />
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-[1.8rem]"
                style={{ background: "var(--grad-hero)", color: "#fff", boxShadow: "var(--shadow-float)" }}
              >
                <MhyGlyph size={54} />
              </div>
            </div>
            <h1 className="t-display mt-7" style={{ color: "var(--foreground)" }}>
              مهندس‌یار
            </h1>
            <p className="mt-2 text-[13px] font-bold" style={{ color: "var(--primary)" }}>
              دفتر فنیِ آمادگی آزمون نظام مهندسی
            </p>
            <p className="mt-4 max-w-[290px] t-body-sm leading-7" style={{ color: "var(--muted-foreground)" }}>
              مقررات ملی، سؤالات رسمی با هویت جلسه، تحلیل عملکرد و مسیر مطالعه — همه بر پایه محتوای واقعی، در یک فضای منظم.
            </p>
            {bootstrap && (
              <p className="num mt-5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                {faNum(bootstrap.stats.questions)} سؤال واقعی · {faNum(bootstrap.stats.official)} رسمی · {faNum(bootstrap.stats.sessions)} جلسه
              </p>
            )}
          </TechFrame>
        </div>
      )}

      {/* ── 02 Offline ── */}
      {step === 1 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center screen-in">
          <div className="relative">
            <MhyGlyph size={140} className="absolute -inset-6 opacity-[0.06]" style={{ color: "var(--success)" }} />
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem]" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <WifiOff size={46} strokeWidth={1.6} />
            </div>
          </div>
          <h1 className="t-title mt-7">همه‌چیز آفلاین کار می‌کند</h1>
          <p className="mt-3 max-w-[290px] t-body-sm leading-7" style={{ color: "var(--muted-foreground)" }}>
            سؤالات، درسنامه‌ها و متن مقررات روی همین دستگاه ذخیره می‌شوند؛ مطالعه، تمرین و آزمون بدون اینترنت هم ادامه دارد.
          </p>
          <p className="mt-2 t-caption" style={{ color: "var(--muted-foreground)" }}>
            فقط تمدید لایسنس و بروزرسانی محتوا به اتصال نیاز دارد.
          </p>
        </div>
      )}

      {/* ── 03 رشته — parent only (§9.1) ── */}
      {step === 2 && (
        <div className="phone-scroll flex-1 overflow-y-auto px-5 screen-in">
          <Eyebrow tone="accent" className="pt-3">رشته</Eyebrow>
          <h1 className="t-title mt-1">رشته شما چیست؟</h1>
          <p className="mt-1 t-caption" style={{ color: "var(--muted-foreground)" }}>
            رشته اصلی را انتخاب کنید؛ صلاحیت‌ها در گام بعد می‌آیند.
          </p>
          <div className="mt-4 space-y-2 pb-6">
            {groups.map((g) => {
              const on = group?.code === g.code;
              return (
                <button
                  key={g.code}
                  onClick={() => {
                    setGroup(g);
                    setComps([]); // group changed → competencies reset (real codes belong to the group)
                  }}
                  aria-pressed={on}
                  className="press flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl border p-3.5 text-right"
                  style={{
                    background: on ? "var(--primary-soft)" : "var(--card)",
                    borderColor: on ? "var(--primary)" : "var(--border)",
                    boxShadow: on ? "var(--shadow-card)" : undefined,
                  }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: on ? "var(--primary)" : "var(--muted)", color: on ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                  >
                    <DisciplineGlyph code={g.code} size={26} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                      {g.title}
                    </p>
                    <p className="num mt-0.5 t-caption" style={{ color: "var(--muted-foreground)" }}>
                      {faNum(g.counts.total)} سؤال · {faNum(g.counts.official)} رسمی · {faNum(g.counts.authored)} تألیفی
                    </p>
                  </div>
                  {on ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--primary)" }}>
                      <Check size={15} style={{ color: "var(--primary-foreground)" }} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="t-meta">{faNum(g.items.length)} صلاحیت</span>
                  )}
                </button>
              );
            })}
            {!groups.length && (
              <p className="py-10 text-center t-body-sm" style={{ color: "var(--muted-foreground)" }}>
                در حال بارگذاری رشته‌ها…
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 04 صلاحیت‌ها — REAL MULTI SELECT (§9.3) ── */}
      {step === 3 && group && (
        <div className="phone-scroll flex-1 overflow-y-auto px-5 screen-in">
          <Eyebrow tone="accent" className="pt-3">صلاحیت‌ها</Eyebrow>
          <h1 className="t-title mt-1">کدام صلاحیت‌ها را هدف می‌گیرید؟</h1>
          <p className="mt-1 t-caption" style={{ color: "var(--muted-foreground)" }}>
            رشته {group.title} — می‌توانید همزمان چند صلاحیت را انتخاب کنید؛ پیشرفت هرکدام جدا نگه‌داری می‌شود.
          </p>
          <div className="mt-4 space-y-2.5 pb-4">
            {group.items.map((c) => {
              const on = comps.includes(c.majorCode);
              return (
                <button
                  key={c.majorCode}
                  onClick={() => toggleComp(c.majorCode)}
                  aria-pressed={on}
                  className="press w-full rounded-2xl border p-4 text-right"
                  style={{
                    background: on ? "var(--primary-soft)" : "var(--card)",
                    borderColor: on ? "var(--primary)" : "var(--border)",
                    boxShadow: on ? "var(--shadow-card)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: on ? "var(--primary)" : "var(--muted)", color: on ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                    >
                      <ShieldCheck size={18} strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
                        {c.competency}
                      </p>
                      <p className="num mt-0.5 t-caption" style={{ color: "var(--muted-foreground)" }}>
                        {faNum(c.total)} سؤال · {faNum(c.official)} رسمی · {faNum(c.authored)} تألیفی
                      </p>
                    </div>
                    <CheckBadge on={on} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 05 Activation ── */}
      {step === 4 && (
        <div className="phone-scroll flex-1 overflow-y-auto px-6 screen-in">
          <Eyebrow tone="accent" className="pt-3">فعال‌سازی</Eyebrow>
          <h1 className="t-title mt-1">توکن فعال‌سازی</h1>
          <div className="mt-4 space-y-2.5 rounded-2xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {[
              ["توکن چیست؟", "کلید دسترسی شما به محتوای کامل است."],
              ["از کجا دریافت می‌شود؟", "پس از ثبت‌نام، از پنل کاربری یا نمایندگی فروش."],
              ["چقدر اعتبار دارد؟", "مطابق مدت خرید شما؛ در صفحه تنظیمات، اعتبار باقی‌مانده نمایش داده می‌شود."],
              ["در حالت آفلاین چه؟", "محتوای دانلودشده بدون اینترنت کامل در دسترس است."],
              ["تمدید؟", "هر ۳۰ روز یک‌بار برای تأیید به اتصال کوتاه نیاز است."],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
                  {t}
                </p>
                <p className="t-caption" style={{ color: "var(--muted-foreground)" }}>
                  {d}
                </p>
              </div>
            ))}
          </div>
          <input
            dir="ltr"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setTokenErr("");
            }}
            placeholder="MHYR-XXXX-XXXX"
            aria-label="توکن فعال‌سازی"
            className="num mt-4 h-12 w-full rounded-2xl border px-4 text-left text-[14px] outline-none"
            style={{ background: "var(--card)", borderColor: tokenErr ? "var(--danger)" : "var(--border)", color: "var(--foreground)" }}
          />
          {tokenErr && (
            <p className="mt-1.5 t-caption" style={{ color: "var(--danger)" }} role="alert">
              {tokenErr}
            </p>
          )}
          <p className="mt-2 t-meta" style={{ color: "var(--muted-foreground)" }}>
            برای این نسخه نمایشی، هر مقدار ۶ نویسه‌ای فعال می‌شود.
          </p>
        </div>
      )}

      {/* footer — sticky actions */}
      <div className="border-t px-6 pb-7 pt-3.5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        {step === 0 && (
          <Btn full size="lg" onClick={goNext}>
            <Sparkles size={17} />
            شروع کنیم
          </Btn>
        )}
        {step === 1 && (
          <div className="flex gap-2.5">
            <Btn variant="ghost" onClick={finish}>
              رد کردن
            </Btn>
            <div className="flex-1">
              <Btn full size="lg" onClick={goNext}>
                ادامه
              </Btn>
            </div>
          </div>
        )}
        {step === 2 && (
          <Btn full size="lg" onClick={goNext} disabled={!group}>
            ادامه
          </Btn>
        )}
        {step === 3 && group && (
          <div className="flex items-center gap-3">
            <p className="num min-w-[92px] t-caption font-bold" style={{ color: "var(--muted-foreground)" }}>
              {comps.length ? `${faNum(comps.length)} صلاحیت انتخاب شده` : "انتخاب نشده"}
            </p>
            <div className="flex-1">
              <Btn full size="lg" onClick={goNext} disabled={!comps.length}>
                ادامه
              </Btn>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="flex gap-2.5">
            <Btn variant="ghost" onClick={finish}>
              بعداً
            </Btn>
            <div className="flex-1">
              <Btn full size="lg" onClick={activate}>
                <KeyRound size={16} />
                فعال‌سازی و ورود
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
