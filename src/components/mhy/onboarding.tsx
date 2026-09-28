"use client";

import { useState } from "react";
import type { MhyDiscipline } from "@/lib/mhy/server";
import { useMhy, COMPETENCY_OF_DISCIPLINE } from "@/lib/mhy/store";
import { faNum } from "@/lib/mhy/engines";
import { Btn } from "./ui";
import { GraduationCap, WifiOff, KeyRound, Check, ChevronRight, CalendarDays } from "lucide-react";

type Bootstrap = { stats: Record<string, number>; disciplines: MhyDiscipline[]; sessions: { session: string; count: number; majors: number }[] };

export default function Onboarding({ bootstrap, onDone }: { bootstrap: Bootstrap | null; onDone: () => void }) {
  const { completeOnboarding, activateLicense } = useMhy();
  const [step, setStep] = useState(0); // 0 welcome, 1 offline, 2 field, 3 competency, 4 target, 5 token
  const [discipline, setDiscipline] = useState<MhyDiscipline | null>(null);
  const [competency, setCompetency] = useState<string | null>(null);
  const [targetExam, setTargetExam] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string>("");
  const [token, setToken] = useState("");
  const [tokenErr, setTokenErr] = useState("");

  const majors = bootstrap?.disciplines ?? [];
  const majorGroup = discipline ? discipline.majorCode.split("-")[0] : "";
  const competencies = COMPETENCY_OF_DISCIPLINE[majorGroup] ?? ["نظارت", "اجرا"];
  const isLast = step === 5;

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

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
      disciplineCode: discipline?.majorCode ?? null,
      disciplineTitle: discipline ? `${discipline.title}${competency ? ` — ${competency}` : ""}` : null,
      competency,
      targetExam,
      targetExamDate: targetDate ? new Date(targetDate).getTime() : null,
    });
    onDone();
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--card)" }}>
      {/* progress header */}
      {step > 0 && (
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            onClick={goBack}
            aria-label="بازگشت"
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? 20 : 7, background: i === step ? "var(--primary)" : "var(--border)" }}
              />
            ))}
          </div>
          <div className="h-11 w-11" />
        </div>
      )}

      {/* ── step 0: welcome ── */}
      {step === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center screen-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem]" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
            <GraduationCap size={52} strokeWidth={1.6} />
          </div>
          <h1 className="mt-6 text-[22px] font-extrabold" style={{ color: "var(--foreground)" }}>
            به مهندس‌یار خوش آمدید
          </h1>
          <p className="mt-3 text-[13px] leading-7" style={{ color: "var(--muted-foreground)" }}>
            میزکار مطالعاتی مهندسان برای آمادگی آزمون نظام مهندسی — مقررات، سؤالات رسمی و آزمون‌ها، همه در یک مسیر منظم.
          </p>
        </div>
      )}

      {/* ── step 1: offline ── */}
      {step === 1 && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center screen-in">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem]" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            <WifiOff size={50} strokeWidth={1.6} />
          </div>
          <h1 className="mt-6 text-[20px] font-extrabold" style={{ color: "var(--foreground)" }}>
            همه‌چیز آفلاین کار می‌کند
          </h1>
          <p className="mt-3 text-[13px] leading-7" style={{ color: "var(--muted-foreground)" }}>
            سؤالات، درسنامه‌ها و متن مقررات روی همین دستگاه ذخیره می‌شوند؛ مطالعه، تمرین و آزمون بدون اینترنت هم ادامه دارد.
          </p>
          <p className="mt-2 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
            فقط تمدید لایسنس و بروزرسانی محتوا به اتصال نیاز دارد.
          </p>
        </div>
      )}

      {/* ── step 2: field selection (real disciplines from DB) ── */}
      {step === 2 && (
        <div className="phone-scroll flex-1 overflow-y-auto px-5 screen-in">
          <h1 className="pt-2 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
            رشته شما چیست؟
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            بر اساس سؤالات واقعی موجود در کتابخانه
          </p>
          <div className="mt-4 space-y-2 pb-6">
            {majors.map((d) => {
              const on = discipline?.majorCode === d.majorCode;
              const n = { "CIVIL-SUPERVISION": 614, "CIVIL-EXECUTION": 228, "MECH-DESIGN": 242, "ARCH-SUPERVISION": 190 }[d.majorCode] ?? null;
              return (
                <button
                  key={d.majorCode}
                  onClick={() => setDiscipline(d)}
                  aria-pressed={on}
                  className="flex min-h-[54px] w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-colors"
                  style={{ background: on ? "var(--primary-soft)" : "var(--card)", borderColor: on ? "var(--primary)" : "var(--border)" }}
                >
                  <div className="flex-1">
                    <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                      {d.title}
                    </p>
                    <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                      {n ? `${faNum(n)} سوال رسمی و تألیفی` : "سؤالات این رشته در کتابخانه موجود است"}
                    </p>
                  </div>
                  {on && <Check size={18} style={{ color: "var(--primary)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── step 3: competency (§7 multi-select) ── */}
      {step === 3 && (
        <div className="phone-scroll flex-1 overflow-y-auto px-5 screen-in">
          <h1 className="pt-2 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
            صلاحیت‌های شما
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            می‌توانید چند صلاحیت را هدف بگیرید؛ صلاحیت فعال قابل تغییر است و پیشرفت حفظ می‌شود.
          </p>
          <div className="mt-4 space-y-2 pb-6">
            {competencies.map((c) => {
              const on = competency === c;
              return (
                <button
                  key={c}
                  onClick={() => setCompetency(c)}
                  aria-pressed={on}
                  className="flex min-h-[54px] w-full items-center gap-3 rounded-2xl border p-3.5 text-right"
                  style={{ background: on ? "var(--primary-soft)" : "var(--card)", borderColor: on ? "var(--primary)" : "var(--border)" }}
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-md border-2"
                    style={{ borderColor: on ? "var(--primary)" : "var(--border)", background: on ? "var(--primary)" : "transparent" }}
                  >
                    {on && <Check size={13} style={{ color: "var(--primary-foreground)" }} />}
                  </span>
                  <span className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── step 4: target exam (real sessions + user date §8) ── */}
      {step === 4 && (
        <div className="phone-scroll flex-1 overflow-y-auto px-5 screen-in">
          <h1 className="pt-2 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
            آزمون هدف
          </h1>
          <p className="mt-1 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            جلسه رسمی مدنظر و تاریخ برگزاری آن را ثبت کنید — شمارش معکوس و برنامه بر همین اساس ساخته می‌شود.
          </p>
          <p className="mb-1.5 mt-4 text-[11.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
            جلسه رسمی (از کتابخانه سؤالات)
          </p>
          <div className="flex flex-wrap gap-2">
            {(bootstrap?.sessions ?? []).slice(0, 8).map((s) => {
              const on = targetExam === s.session;
              return (
                <button
                  key={s.session}
                  onClick={() => setTargetExam(s.session)}
                  aria-pressed={on}
                  className="min-h-[40px] rounded-full border px-3.5 text-[12px] font-bold"
                  style={{
                    background: on ? "var(--primary)" : "var(--card)",
                    color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    borderColor: on ? "var(--primary)" : "var(--border)",
                  }}
                >
                  {s.session} ({faNum(s.count)} س)
                </button>
              );
            })}
          </div>
          <p className="mb-1.5 mt-5 flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: "var(--muted-foreground)" }}>
            <CalendarDays size={14} />
            تاریخ آزمون هدف (شمسی یا میلادی)
          </p>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-12 w-full rounded-2xl border px-4 text-[13px] outline-none focus:ring-2"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            aria-label="تاریخ آزمون هدف"
          />
          <p className="mt-2 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
            تاریخ از تقویم دستگاه شما خوانده می‌شود؛ هیچ تاریخ ثابتی در برنامه درج نشده است.
          </p>
        </div>
      )}

      {/* ── step 5: token (§40 license UX) ── */}
      {step === 5 && (
        <div className="phone-scroll flex-1 overflow-y-auto px-6 screen-in">
          <h1 className="pt-2 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
            توکن فعال‌سازی
          </h1>
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
                <p className="text-[11px] leading-5" style={{ color: "var(--muted-foreground)" }}>
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
            className="mt-4 h-12 w-full rounded-2xl border px-4 text-left text-[13.5px] outline-none focus:ring-2"
            style={{ background: "var(--card)", borderColor: tokenErr ? "var(--danger)" : "var(--border)", color: "var(--foreground)" }}
          />
          {tokenErr && (
            <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--danger)" }} role="alert">
              {tokenErr}
            </p>
          )}
          <p className="mt-2 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
            برای این نسخه نمایشی، هر مقدار ۶ نویسه‌ای فعال می‌شود.
          </p>
        </div>
      )}

      {/* footer */}
      <div className="flex gap-2.5 px-6 pb-8 pt-4">
        {step === 0 && (
          <Btn full size="lg" onClick={goNext}>
            شروع کنیم
          </Btn>
        )}
        {step === 1 && (
          <>
            <Btn variant="ghost" onClick={finish}>
              رد کردن
            </Btn>
            <Btn size="lg" onClick={goNext}>
              ادامه
            </Btn>
          </>
        )}
        {(step === 2 || step === 3) && (
          <Btn full size="lg" onClick={goNext} disabled={step === 2 ? !discipline : !competency}>
            ادامه
          </Btn>
        )}
        {step === 4 && (
          <Btn full size="lg" onClick={goNext}>
            ادامه
          </Btn>
        )}
        {step === 5 && (
          <Btn full size="lg" onClick={activate}>
            فعال‌سازی و ورود
          </Btn>
        )}
      </div>
    </div>
  );
}
