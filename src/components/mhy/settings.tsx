"use client";

import { useState } from "react";
import type { Bootstrap } from "@/lib/mhy/server";
import { useMhy } from "@/lib/mhy/store";
import { faNum } from "@/lib/mhy/engines";
import { Card, SectionHeader, Btn, EmptyState } from "./ui";
import {
  KeyRound,
  Moon,
  Sun,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertTriangle,
  WifiOff,
  Database,
  Trash2,
  BadgeCheck,
  ChevronLeft,
} from "lucide-react";

const CONTENT_VERSION = "محتوای واقعی APK نسخه ۱.۰.۰ (mohandesyar_v7)";

export default function Settings({ bootstrap, dark, onToggleDark }: { bootstrap: Bootstrap | null; dark: boolean; onToggleDark: (v: boolean) => void }) {
  const { profile, license, answers, bookmarks, mistakes, attempts, studiedBands, updateProfile, activateLicense, resetAll } = useMhy();
  const [showReset, setShowReset] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenState, setTokenState] = useState<"idle" | "invalid" | "offline" | "ok">("idle");

  // license state machine (§40) — offline-first friendly
  const daysLeft = license.activatedAt ? Math.max(0, 30 - Math.floor((Date.now() - license.activatedAt) / 86400000)) : null;

  const tryActivate = () => {
    if (tokenInput.trim().length < 6) {
      setTokenState("invalid");
      return;
    }
    activateLicense(tokenInput.trim());
    setTokenState("ok");
  };

  const answeredCount = Object.values(answers).filter((a) => a.choice !== null).length;

  return (
    <div className="phone-scroll flex-1 overflow-y-auto px-4 pb-6 screen-in">
      <h1 className="pt-4 text-[19px] font-extrabold" style={{ color: "var(--foreground)" }}>
        تنظیمات
      </h1>

      {/* profile */}
      <SectionHeader title="پروفایل من" />
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl p-3 text-[16px] font-extrabold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            {profile.name ? profile.name.slice(0, 1) : "م"}
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-extrabold" style={{ color: "var(--foreground)" }}>
              {profile.name || "مهندس مهمان"}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              {profile.disciplineTitle ?? "رشته انتخاب نشده"}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <input
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="نام شما (اختیاری)"
            aria-label="نام شما"
            className="h-11 w-full rounded-xl border px-3.5 text-[12.5px] outline-none focus:ring-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>
        <p className="mt-2.5 text-[10.5px] leading-5" style={{ color: "var(--muted-foreground)" }}>
          آزمون هدف: {profile.targetExam ?? "—"}
          {profile.targetExamDate ? ` · تاریخ ${new Date(profile.targetExamDate).toLocaleDateString("fa-IR")}` : ""}
        </p>
      </Card>

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
            <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--muted-foreground)" }}>
              {daysLeft !== null && daysLeft > 7
                ? `آفلاین — ${faNum(daysLeft)} روز اعتبار باقی‌مانده`
                : daysLeft !== null
                  ? `تنها ${faNum(daysLeft)} روز مانده — برای تمدید به اتصال نیاز است`
                  : ""}
            </p>
            <div className="mt-2.5 rounded-xl p-3" style={{ background: "var(--success-soft)" }}>
              <p className="text-[10.5px] leading-5" style={{ color: "var(--success)" }}>
                در حالت آفلاین، همه محتوای دستگاه (سؤالات، مقررات، درسنامه‌ها) در دسترس است. فقط بروزرسانی محتوا و تأیید دوره‌ای به اینترنت نیاز دارد.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              توکن فعال‌سازی
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
                className="h-11 flex-1 rounded-xl border px-3.5 text-left text-[12.5px] outline-none focus:ring-2"
                style={{ background: "var(--surface)", borderColor: tokenState === "invalid" ? "var(--danger)" : "var(--border)", color: "var(--foreground)" }}
              />
              <Btn size="sm" onClick={tryActivate}>
                <RefreshCw size={14} />
                فعال‌سازی
              </Btn>
            </div>
            {tokenState === "invalid" && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--danger)" }} role="alert">
                <AlertTriangle size={13} /> توکن معتبر نیست — دوباره بررسی کنید.
              </p>
            )}
            <p className="mt-2 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
              برای نسخه نمایشی، هر مقدار ۶ نویسه‌ای پذیرفته می‌شود.
            </p>
          </div>
        )}
      </Card>

      {/* appearance */}
      <SectionHeader title="نمایش" />
      <Card>
        <div className="flex min-h-[44px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
            {dark ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
              حالت تیره
            </p>
            <p className="text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
              تم یکپارچه در کل برنامه
            </p>
          </div>
          <button
            role="switch"
            aria-checked={dark}
            aria-label="حالت تیره"
            onClick={() => onToggleDark(!dark)}
            className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
            style={{ background: dark ? "var(--primary)" : "var(--border)" }}
          >
            <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ right: dark ? 2 : 22 }} />
          </button>
        </div>
      </Card>

      {/* data & content (§38 content versioning transparency) */}
      <SectionHeader title="داده و محتوا" />
      <Card>
        <div className="flex items-center gap-2">
          <Database size={16} style={{ color: "var(--primary)" }} />
          <p className="text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
            نسخه محتوا
          </p>
        </div>
        <p className="mt-1.5 text-[11px] leading-5" style={{ color: "var(--muted-foreground)" }}>
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
              <p className="text-[15px] font-extrabold" style={{ color: "var(--foreground)" }}>
                {v}
              </p>
              <p className="text-[9px] leading-3.5" style={{ color: "var(--muted-foreground)" }}>
                {l}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-4.5" style={{ color: "var(--muted-foreground)" }}>
          پیشرفت شما روی این دستگاه: {faNum(answeredCount)} پاسخ · {faNum(bookmarks.length)} نشانک · {faNum(mistakes.length)} اشتباه · {faNum(attempts.length)} آزمون · {faNum(new Set(studiedBands).size)} بند مطالعه‌شده
        </p>
      </Card>

      {/* about */}
      <SectionHeader title="درباره" />
      <Card>
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={17} style={{ color: "var(--success)" }} className="mt-0.5 shrink-0" />
          <p className="text-[11px] leading-6" style={{ color: "var(--muted-foreground)" }}>
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

      {showReset && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 px-6" role="dialog" aria-modal="true" aria-label="تایید بازنشانی">
          <div className="pop-in w-full rounded-3xl p-5" style={{ background: "var(--card)" }}>
            <p className="text-center text-[15px] font-extrabold" style={{ color: "var(--foreground)" }}>
              بازنشانی کامل؟
            </p>
            <p className="mt-2 text-center text-[12px] leading-6" style={{ color: "var(--muted-foreground)" }}>
              همه پیشرفت، نشانک‌ها، اشتباهات و آزمون‌های شما پاک می‌شود و به مرحله انتخاب رشته برمی‌گردید. این کار برگشت‌پذیر نیست.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Btn variant="secondary" onClick={() => setShowReset(false)}>
                انصراف
              </Btn>
              <div className="flex-1">
                <Btn
                  full
                  variant="danger"
                  onClick={() => {
                    resetAll();
                    setShowReset(false);
                  }}
                >
                  بازنشانی کن
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
