"use client";

import { faNum } from "@/lib/mhy/engines";
import { mabhasTitle } from "@/lib/mhy/store";
import {
  ShieldCheck,
  PenLine,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import type React from "react";

// ─── Mahandesyar design-system primitives (§44/§68) — tokens only, no raw hex ───

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  ariaLabel,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  ariaLabel?: string;
  full?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--primary)", color: "var(--primary-foreground)" },
    secondary: { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--muted-foreground)" },
    danger: { background: "var(--danger)", color: "#fff" },
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { minHeight: 38, padding: "0 14px", fontSize: 12.5 },
    md: { minHeight: 48, padding: "0 18px", fontSize: 14 },
    lg: { minHeight: 52, padding: "0 22px", fontSize: 15 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${full ? "w-full" : ""}`}
      style={{ ...styles[variant], ...sizes[size] }}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  onClick,
  style,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
}) {
  const base: React.CSSProperties = {
    background: "var(--card)",
    borderColor: "var(--border)",
    ...style,
  };
  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`w-full rounded-2xl border p-4 text-right transition-colors hover:bg-[var(--surface)] ${className}`}
        style={base}
      >
        {children}
      </button>
    );
  }
  return (
    <div aria-label={ariaLabel} className={`rounded-2xl border p-4 ${className}`} style={base}>
      {children}
    </div>
  );
}

export function SourceBadge({ sourceType, session, qnum }: { sourceType: "OFFICIAL_EXAM" | "AUTHORED"; session?: string | null; qnum?: number | null }) {
  if (sourceType === "OFFICIAL_EXAM") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        aria-label={`سوال رسمی${session ? ` آزمون ${session}` : ""}${qnum ? ` شماره ${qnum}` : ""}`}
      >
        <ShieldCheck size={12} />
        رسمی{session ? ` · ${session}` : ""}{qnum ? ` · س ${faNum(qnum)}` : ""}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
      style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
      aria-label="سوال تألیفی"
    >
      <PenLine size={12} />
      تألیفی
    </span>
  );
}

const DIFF_LABEL: Record<string, string> = { easy: "آسان", medium: "متوسط", hard: "سخت" };
const DIFF_COLOR: Record<string, string> = { easy: "var(--success)", medium: "var(--warning)", hard: "var(--danger)" };

export function DifficultyBadge({ d }: { d: "easy" | "medium" | "hard" }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: "var(--muted)", color: DIFF_COLOR[d] }}
    >
      {DIFF_LABEL[d]}
    </span>
  );
}

export function ReviewFlagBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
      aria-label="این محتوا نیازمند بازبینی است"
      title="طبق داده اصلی، این مورد نیازمند بازبینی است"
    >
      <AlertTriangle size={11} />
      نیازمند بازبینی
    </span>
  );
}

export function MabhasChip({ m }: { m: number | null }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
    >
      <BookOpen size={11} />
      {m == null ? "عمومی" : `مبحث ${faNum(m)}`}
    </span>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-2.5 mt-5 flex items-center justify-between">
      <h2 className="text-[14.5px] font-bold" style={{ color: "var(--foreground)" }}>
        {title}
      </h2>
      {action && (
        <button onClick={onAction} className="flex items-center gap-0.5 text-[11.5px] font-bold" style={{ color: "var(--primary)" }}>
          {action}
          <ChevronLeft size={14} />
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ pct, color, height = 8 }: { pct: number; color?: string; height?: number }) {
  return (
    <div
      className="overflow-hidden rounded-full"
      style={{ background: "var(--muted)", height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color ?? "var(--primary)" }}
      />
    </div>
  );
}

export function ProgressRing({ pct, size = 120, label }: { pct: number; size?: number; label?: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "پیشرفت"}: ${faNum(pct)} درصد`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold" style={{ color: "var(--foreground)" }}>
          ٪{faNum(pct)}
        </span>
        {label && (
          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }: { icon: React.ElementType; title: string; desc: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
        <Icon size={30} strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
        {title}
      </p>
      <p className="mt-1.5 max-w-[260px] text-[12px] leading-6" style={{ color: "var(--muted-foreground)" }}>
        {desc}
      </p>
      {action && (
        <div className="mt-4">
          <Btn variant="secondary" size="sm" onClick={action.onClick}>
            {action.label}
          </Btn>
        </div>
      )}
    </div>
  );
}

export function StatTile({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="rounded-2xl border p-3 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <p className="text-[17px] font-extrabold" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </p>
      <p className="mt-0.5 text-[9.5px] leading-3" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </p>
    </div>
  );
}

export function Countdown({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) {
    return (
      <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <p className="text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
          آزمون هدف انتخاب نشده
        </p>
        <p className="mt-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          از تنظیمات، آزمون هدف و تاریخ آن را ثبت کنید تا شمارش معکوس فعال شود.
        </p>
      </div>
    );
  }
  const urgent = daysLeft <= 30;
  return (
    <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div
        className="flex h-14 min-w-14 flex-col items-center justify-center rounded-xl px-2"
        style={{ background: urgent ? "var(--danger-soft)" : "var(--primary-soft)" }}
      >
        <span className="text-[20px] font-extrabold leading-6" style={{ color: urgent ? "var(--danger)" : "var(--primary)" }}>
          {faNum(daysLeft)}
        </span>
        <span className="text-[8.5px]" style={{ color: urgent ? "var(--danger)" : "var(--primary)" }}>
          روز
        </span>
      </div>
      <div>
        <p className="text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
          {daysLeft === 0 ? "امروز روز آزمون است" : daysLeft === 1 ? "فردا روز آزمون است" : "تا آزمون هدف"}
        </p>
        <p className="mt-0.5 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
          {urgent ? "زمان محدود — تمرکز بر مباحث ضعیف" : "برنامه امروز را کامل کنید"}
        </p>
      </div>
    </div>
  );
}

