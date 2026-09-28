"use client";

import { useEffect, useRef, useState } from "react";
import { faNum } from "@/lib/mhy/engines";
import { mabhasTitle } from "@/lib/mhy/store";
import { mabhasCoverSrc } from "@/lib/mhy/covers";
import {
  ShieldCheck,
  PenLine,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Loader2,
  Check,
} from "lucide-react";
import type React from "react";

// ─── Mahandesyar design system (§5) — every primitive consumes tokens, no raw hex ───
// Motion: micro 80–180ms via CSS, transitions 250–400ms, hero moments via framer-motion in screens.

/* ═══════════ Button ═══════════ */

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  ariaLabel,
  full,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  full?: boolean;
  type?: "button" | "submit";
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--primary)", color: "var(--primary-foreground)" },
    secondary: { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border-strong)" },
    ghost: { background: "transparent", color: "var(--muted-foreground)" },
    danger: { background: "var(--danger)", color: "#fff" },
    success: { background: "var(--success)", color: "#fff" },
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { minHeight: 38, padding: "0 14px", fontSize: 12.5 },
    md: { minHeight: 48, padding: "0 18px", fontSize: 14 },
    lg: { minHeight: 54, padding: "0 22px", fontSize: 15 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      type={type ?? "button"}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={`press inline-flex items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-45 ${full ? "w-full" : ""}`}
      style={{ ...styles[variant], ...sizes[size], boxShadow: variant === "primary" ? "var(--shadow-card)" : undefined }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  onClick,
  label,
  active,
  danger,
  disabled,
  size = 42,
}: {
  icon: React.ElementType;
  onClick?: () => void;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className="press flex shrink-0 items-center justify-center rounded-xl disabled:opacity-30"
      style={{
        width: size,
        height: size,
        color: danger ? "var(--danger)" : active ? "var(--primary)" : "var(--muted-foreground)",
        background: active ? "var(--primary-soft)" : "transparent",
      }}
    >
      <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
    </button>
  );
}

/* ═══════════ Cards ═══════════ */

export function Card({
  children,
  onClick,
  style,
  className = "",
  ariaLabel,
  elevated,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
  elevated?: boolean;
}) {
  const base: React.CSSProperties = {
    background: "var(--card)",
    borderColor: "var(--border)",
    boxShadow: elevated ? "var(--shadow-card)" : undefined,
    ...style,
  };
  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`press w-full rounded-2xl border p-4 text-right hover:border-[var(--border-strong)] ${className}`}
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

/* ═══════════ Badges & chips ═══════════ */

export function Badge({
  children,
  tint = "primary",
  soft = true,
  icon: Icon,
}: {
  children: React.ReactNode;
  tint?: "primary" | "success" | "warning" | "danger" | "neutral";
  soft?: boolean;
  icon?: React.ElementType;
}) {
  const bg = soft ? `var(--${tint === "neutral" ? "muted" : tint}-soft)` : `var(--${tint === "neutral" ? "muted" : tint})`;
  const fg = soft ? `var(--${tint === "neutral" ? "muted-foreground" : tint})` : `var(--primary-foreground)`;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
      style={{ background: bg, color: fg }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
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
      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
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
      style={{ background: "var(--warning-soft)", color: "var(--warning)" }}
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

export function Chip({
  on,
  label,
  onClick,
  disabled,
}: {
  on: boolean;
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className="press min-h-[40px] rounded-full border px-3.5 text-[12px] font-bold disabled:opacity-40"
      style={{
        background: on ? "var(--primary)" : "var(--card)",
        color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
        borderColor: on ? "var(--primary)" : "var(--border)",
      }}
    >
      {label}
    </button>
  );
}

/* ═══════════ Segmented control ═══════════ */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; icon?: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex rounded-2xl border p-1"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {options.map((o) => {
        const on = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="press flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-[12px] font-bold"
            style={{
              background: on ? "var(--card)" : "transparent",
              color: on ? "var(--primary)" : "var(--muted-foreground)",
              boxShadow: on ? "var(--shadow-card)" : undefined,
            }}
          >
            {Icon && <Icon size={14} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════ Progress ═══════════ */

export function ProgressBar({ pct, color, height = 8, gradient }: { pct: number; color?: string; height?: number; gradient?: boolean }) {
  return (
    <div
      className="overflow-hidden rounded-full"
      style={{ background: "var(--muted)", height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: gradient ? "var(--grad-progress)" : (color ?? "var(--primary)"),
          transition: "width 0.5s cubic-bezier(0.2,0.8,0.2,1)",
        }}
      />
    </div>
  );
}

let ringGradSeq = 0;

export function ProgressRing({
  pct,
  size = 120,
  label,
  sub,
  color,
  strokeWidth = 10,
}: {
  pct: number;
  size?: number;
  label?: string;
  sub?: string;
  color?: string;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const gid = useRef(`rg${++ringGradSeq}`).current;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "پیشرفت"}: ${faNum(Math.round(clamped))} درصد`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary-strong)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? `url(#${gid})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="t-kpi num" style={{ color: "var(--foreground)", fontSize: size > 100 ? 24 : 19 }}>
          ٪{faNum(Math.round(clamped))}
        </span>
        {label && (
          <span className="t-meta mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {label}
          </span>
        )}
        {sub && (
          <span className="t-meta" style={{ color: "var(--muted-foreground)", opacity: 0.75 }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

/* Countdown — the target-exam composition (copper object + orbit arcs + blueprint grid).
   Not a timer widget: it tells the user which phase of readiness they are in (§13 WOW#1). */
export function CountdownRing({ daysLeft, examTitle }: { daysLeft: number | null; examTitle?: string | null }) {
  if (daysLeft === null) {
    return (
      <div className="blueprint-grid relative overflow-hidden rounded-3xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-4">
          <Eyebrow tone="copper">هدف آزمون</Eyebrow>
          <p className="mt-2 text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
            آزمون هدف ثبت نشده
          </p>
          <p className="mt-1 t-body-sm" style={{ color: "var(--muted-foreground)" }}>
            از تنظیمات، آزمون و تاریخ هدف را ثبت کنید تا شمارش معکوس و فاز آمادگی فعال شود.
          </p>
        </div>
      </div>
    );
  }
  const size = 132;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const past = daysLeft < 0;
  const urgent = daysLeft <= 7;
  const soon = daysLeft <= 30;
  const arcColor = past ? "var(--muted-foreground)" : urgent ? "var(--danger)" : "var(--copper)";
  const arcPct = past ? 1 : Math.max(0.03, 1 - Math.min(daysLeft, 90) / 90);
  const phase = past ? "پایان دوره" : urgent ? "فاز اوج مرور" : soon ? "فاز جمع‌بندی" : "فاز ساخت پایه";
  const stateText = past
    ? "آزمون برگزار شده"
    : daysLeft === 0
      ? "امروز روز آزمون است"
      : daysLeft === 1
        ? "فردا روز آزمون است"
        : "تا آزمون هدف";
  const advice = past
    ? "برای دوره بعد، هدف تازه‌ای ثبت کنید."
    : urgent
      ? "تمرکز روی مرور اشتباهات و نقاط ضعف"
      : soon
        ? "شبیه‌سازی آزمون‌های رسمی با زمان واقعی"
        : "پایه‌ها را محکم کنید؛ برنامه امروز را کامل کنید";
  // arc end-point for the orbit node
  const ang = -90 + arcPct * 360;
  const rad = (ang * Math.PI) / 180;
  const nodeX = size / 2 + r * Math.cos(rad);
  const nodeY = size / 2 + r * Math.sin(rad);
  return (
    <div
      className="tech-glow tech-glow-copper blueprint-grid relative overflow-hidden rounded-3xl border"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <Eyebrow tone="copper">هدف آزمون</Eyebrow>
        <span className="t-meta" style={{ color: "var(--muted-foreground)" }}>
          {phase}
        </span>
      </div>
      <div className="flex items-center gap-4 px-5 pb-5 pt-2.5">
        <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${faNum(daysLeft)} روز تا آزمون هدف`}>
          <svg width={size} height={size} className="-rotate-90">
            {/* construction circle */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="2 5" opacity={0.8} />
            {/* progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={arcColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - arcPct)}
              style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.2,0.8,0.2,1)" }}
            />
          </svg>
          {/* orbit node at arc head */}
          <span
            aria-hidden
            className="absolute h-2 w-2 rounded-full"
            style={{ background: arcColor, left: nodeX - 4, top: nodeY - 4, boxShadow: "0 0 0 3px var(--surface)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="t-num-hero num" style={{ fontSize: 36, color: "var(--foreground)", lineHeight: 1 }}>
              {faNum(Math.abs(daysLeft))}
            </span>
            <span className="t-meta mt-1.5" style={{ color: "var(--muted-foreground)" }}>
              {past ? "روز گذشته" : "روز"}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold" style={{ color: "var(--foreground)" }}>
            {stateText}
          </p>
          {examTitle && (
            <p className="mt-0.5 truncate t-caption" style={{ color: "var(--copper)" }}>
              {examTitle}
            </p>
          )}
          <div className="construction my-2.5" />
          <p className="t-caption leading-5" style={{ color: "var(--muted-foreground)" }}>
            {advice}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Data display ═══════════ */

export function StatTile({ value, label, color, icon: Icon }: { value: string; label: string; color?: string; icon?: React.ElementType }) {
  return (
    <div className="rounded-2xl border p-3 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <p className="t-kpi num flex items-center justify-center gap-1" style={{ fontSize: 17, color: color ?? "var(--foreground)" }}>
        {Icon && <Icon size={13} style={{ color: color ?? "var(--muted-foreground)" }} />}
        {value}
      </p>
      <p className="t-meta mt-0.5" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </p>
    </div>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between">
      <h2 className="t-section" style={{ color: "var(--foreground)" }}>
        {title}
      </h2>
      {action && (
        <button onClick={onAction} className="press flex items-center gap-0.5 text-[11.5px] font-bold" style={{ color: "var(--primary)" }}>
          {action}
          <ChevronLeft size={14} />
        </button>
      )}
    </div>
  );
}

export function ListItem({
  icon: Icon,
  title,
  desc,
  count,
  onClick,
  tint,
  right,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  count?: string;
  onClick?: () => void;
  tint?: string;
  right?: React.ReactNode;
}) {
  return (
    <Card onClick={onClick} ariaLabel={title}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: tint ? `color-mix(in srgb, ${tint} 12%, transparent)` : "var(--primary-soft)", color: tint ?? "var(--primary)" }}
        >
          <Icon size={20} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
            {title}
          </p>
          {desc && (
            <p className="mt-0.5 t-caption truncate" style={{ color: "var(--muted-foreground)" }}>
              {desc}
            </p>
          )}
        </div>
        {right ?? <ChevronLeft size={17} style={{ color: "var(--muted-foreground)" }} />}
      </div>
    </Card>
  );
}

/* ═══════════ States ═══════════ */

export function EmptyState({ icon: Icon, title, desc, action }: { icon: React.ElementType; title: string; desc: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="relative">
        <MhyGlyph size={72} className="absolute -inset-3 opacity-[0.07]" aria-hidden />
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
          <Icon size={30} strokeWidth={1.6} />
        </div>
      </div>
      <p className="mt-4 text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
        {title}
      </p>
      <p className="mt-1.5 max-w-[270px] t-body-sm" style={{ color: "var(--muted-foreground)" }}>
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

export function Skeleton({ w = "100%", h = 56, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }} aria-hidden />;
}

export function LoadingBlock({ label = "بارگذاری…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-14" role="status">
      <OrbitSpinner />
      <p className="t-caption" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </p>
    </div>
  );
}

/* ═══════════ Inputs ═══════════ */

export function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-2xl border pr-10 pl-9 text-[13px] outline-none transition-colors focus:border-[var(--primary)]"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="پاک کردن جستجو"
          className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="press relative h-7 w-12 shrink-0 rounded-full"
      style={{ background: on ? "var(--primary)" : "var(--border)", transition: "background 0.18s ease" }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
        style={{ right: on ? 2 : 22, transition: "right 0.18s cubic-bezier(0.2,0.8,0.2,1)" }}
      />
    </button>
  );
}

/* ═══════════ Overlays ═══════════ */

export function Modal({
  open,
  onClose,
  children,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-6" style={{ background: "var(--scrim)" }} role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={onClose}>
      <div className="pop-in w-full rounded-3xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-float)" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ariaLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={ariaLabel ?? title}>
      <div className="fade-in absolute inset-0" style={{ background: "var(--scrim)" }} onClick={onClose} aria-hidden />
      <div
        className="sheet-up relative flex max-h-[86%] flex-col rounded-t-3xl border-t"
        style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-float)" }}
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-3">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full" style={{ background: "var(--border-strong)" }} aria-hidden />
          {title && (
            <h2 className="t-section pt-2" style={{ color: "var(--foreground)" }}>
              {title}
            </h2>
          )}
          <button onClick={onClose} aria-label="بستن" className="press mt-1 flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="phone-scroll flex-1 overflow-y-auto px-5 py-3">{children}</div>
        {footer && (
          <div className="border-t px-5 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]" style={{ borderColor: "var(--border)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Navigation pieces ═══════════ */

export function SubHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-4">
      <IconButton icon={ChevronRight} onClick={onBack} label="بازگشت" size={44} />
      <h1 className="min-w-0 flex-1 truncate text-[16px] font-extrabold" style={{ color: "var(--foreground)" }}>
        {title}
      </h1>
      {right}
    </div>
  );
}

/* ═══════════ Visual identity — technical geometry motif (§8) ═══════════ */

/** Brand motif: orbit + arc + trajectory nodes. Subtle, abstract, ownable. */
export function MhyGlyph({ size = 48, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" className={className} style={style} aria-hidden>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 6" opacity="0.9" />
      <path d="M24 6 A18 18 0 0 1 42 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 14 A10 10 0 0 1 34 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <circle cx="24" cy="24" r="3.2" fill="currentColor" />
      <circle cx="42" cy="24" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="24" cy="6" r="1.6" fill="currentColor" opacity="0.6" />
      <path d="M10 38 L24 27 L38 38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function OrbitSpinner({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className="animate-spin" style={{ animationDuration: "1.1s" }} aria-hidden>
      <circle cx="24" cy="24" r="17" stroke="var(--muted)" strokeWidth="4" fill="none" />
      <path d="M24 7 A17 17 0 0 1 41 24" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="41" cy="24" r="2.6" fill="var(--primary)" />
    </svg>
  );
}

/** Abstract technical glyph per discipline group (§30) — line geometry, no stock illustration. */
export function DisciplineGlyph({ code, size = 26 }: { code: string; size?: number }) {
  const s = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const body = (() => {
    switch (code) {
      case "CIVIL": // structural frame — columns + load lines
        return (
          <>
            <path d="M4 5h16M7 5v14M17 5v14M7 12h10" {...s} />
            <path d="M4 19h16" {...s} opacity={0.55} />
          </>
        );
      case "ARCH": // plan view — walls + opening
        return (
          <>
            <rect x="4" y="4" width="16" height="16" rx="1" {...s} />
            <path d="M4 12h6M14 12h6M12 12v2.4" {...s} />
            <path d="M12 4v4" {...s} opacity={0.55} />
          </>
        );
      case "ELEC": // circuit — nodes + path
        return (
          <>
            <path d="M4 12h5l3-6 3 12 3-6h2" {...s} />
            <circle cx="4" cy="12" r="1.4" fill="currentColor" />
            <circle cx="20" cy="12" r="1.4" fill="currentColor" />
          </>
        );
      case "MECH": // turbine / duct
        return (
          <>
            <circle cx="12" cy="12" r="8" {...s} />
            <path d="M12 4v8l6 4" {...s} />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          </>
        );
      case "URBAN": // city blocks
        return (
          <>
            <rect x="4" y="10" width="6" height="10" {...s} />
            <rect x="10" y="6" width="5" height="14" {...s} />
            <rect x="15" y="13" width="5" height="7" {...s} />
          </>
        );
      case "SURV": // survey crosshair + coordinates
        return (
          <>
            <circle cx="12" cy="12" r="7" {...s} />
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4" {...s} />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          </>
        );
      case "TRAFFIC": // road + lane dashes
        return (
          <>
            <path d="M8 4 L5 20M16 4 L19 20" {...s} />
            <path d="M12 6v3M12 12v3M12 18v2" {...s} opacity={0.7} />
          </>
        );
      default:
        return (
          <>
            <circle cx="12" cy="12" r="8" {...s} />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </>
        );
    }
  })();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      {body}
    </svg>
  );
}

/* ═══════════ Charts — minimal editorial SVG (§13/§21/§23) ═══════════ */

/** Sparkline: thin rounded trend line with area hint. data: 0..100 */
export function Sparkline({ data, width = 132, height = 40, color = "var(--primary)", ariaLabel }: { data: number[]; width?: number; height?: number; color?: string; ariaLabel?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 12);
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel}>
      <path d={area} fill={color} opacity={0.07} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

/** Compact comparison bars (per-topic accuracy etc). items sorted by caller. */
export function MeterRows({
  items,
  max = 100,
}: {
  items: { label: string; pct: number; color?: string; meta?: string }[];
  max?: number;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="t-body-sm font-bold" style={{ color: "var(--foreground)" }}>
              {it.label}
            </span>
            <span className="num text-[11.5px] font-extrabold" style={{ color: it.color ?? "var(--primary)" }}>
              {faNum(Math.round(it.pct))}٪
            </span>
          </div>
          <ProgressBar pct={(it.pct / max) * 100} color={it.color} height={6} />
          {it.meta && (
            <p className="t-meta mt-1" style={{ color: "var(--muted-foreground)" }}>
              {it.meta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════ misc shared ═══════════ */

export function CheckBadge({ on }: { on: boolean }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
      style={{ borderColor: on ? "var(--primary)" : "var(--border-strong)", background: on ? "var(--primary)" : "transparent" }}
      aria-hidden
    >
      {on && <Check size={13} style={{ color: "var(--primary-foreground)" }} strokeWidth={3} />}
    </span>
  );
}

/* ═══════════ Composition primitives — «دفتر فنی مهندس» (directive §3/§6/§7) ═══════════ */

/** Eyebrow label — technical title-block tick + tracked text. */
export function Eyebrow({
  children,
  tone = "muted",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "muted" | "accent" | "copper" | "cream";
  className?: string;
}) {
  const color =
    tone === "accent" ? "var(--primary)" : tone === "copper" ? "var(--copper)" : tone === "cream" ? "var(--cream)" : "var(--muted-foreground)";
  return (
    <p className={`t-eyebrow flex items-center gap-1.5 ${className}`} style={{ color }}>
      <span aria-hidden className="inline-block h-[3px] w-[3px]" style={{ background: color }} />
      {children}
    </p>
  );
}

/** Corner tick marks — technical drawing frame for composition surfaces. */
export function TechFrame({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const tickStyle: React.CSSProperties = { borderColor: "var(--border-strong)" };
  return (
    <div className={`relative ${className}`} style={style}>
      <span aria-hidden className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t" style={tickStyle} />
      <span aria-hidden className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t" style={tickStyle} />
      <span aria-hidden className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r" style={tickStyle} />
      <span aria-hidden className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l" style={tickStyle} />
      {children}
    </div>
  );
}

/** Dense row — the DENSE ROW surface (§3-C): hairline-separated rows instead of card stacks. */
export function DenseRow({
  icon: Icon,
  glyph,
  title,
  desc,
  meta,
  right,
  onClick,
  tone,
}: {
  icon?: React.ElementType;
  glyph?: React.ReactNode;
  title: React.ReactNode;
  desc?: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  tone?: string;
}) {
  const inner = (
    <div className="flex min-h-[56px] items-center gap-3 py-3">
      {(Icon || glyph) && (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: tone ? `color-mix(in srgb, ${tone} 11%, transparent)` : "var(--muted)", color: tone ?? "var(--muted-foreground)" }}
        >
          {glyph ?? (Icon ? <Icon size={19} strokeWidth={1.9} /> : null)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13.5px] font-bold" style={{ color: "var(--foreground)" }}>
            {title}
          </p>
          {meta}
        </div>
        {desc && (
          <p className="mt-0.5 truncate t-caption" style={{ color: "var(--muted-foreground)" }}>
            {desc}
          </p>
        )}
      </div>
      {right ?? (onClick ? <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} /> : null)}
    </div>
  );
  if (onClick)
    return (
      <button onClick={onClick} className="press block w-full text-right">
        {inner}
      </button>
    );
  return <div>{inner}</div>;
}

/** DenseList — wraps dense rows with hairline separators. */
export function DenseList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`divide-y ${className}`} style={{ borderColor: "var(--border)" }}>
      {children}
    </div>
  );
}

/** Week strip — adherence visualization (7 days, done-marks, selected day). */
export function WeekStrip({
  days,
  selected,
  onSelect,
  ariaLabel = "هفته جاری",
}: {
  days: { label: string; dateLabel: string; done: boolean }[];
  selected?: number;
  onSelect?: (i: number) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex items-stretch justify-between gap-1">
      {days.map((d, i) => {
        const on = selected === i;
        return (
          <button
            key={i}
            onClick={() => onSelect?.(i)}
            aria-pressed={on}
            className="press flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border"
            style={{ background: on ? "var(--primary-soft)" : "var(--surface)", borderColor: on ? "var(--primary)" : "transparent" }}
          >
            {d.done ? (
              <Check size={12} strokeWidth={3} style={{ color: "var(--primary)" }} aria-label="روز مطالعه انجام شده" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--border-strong)" }} aria-hidden />
            )}
            <span className="t-meta" style={{ color: "var(--muted-foreground)" }}>
              {d.label}
            </span>
            <span className="num text-[13px] font-extrabold" style={{ color: on ? "var(--primary)" : "var(--foreground)" }}>
              {d.dateLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Segmented progress — checkpoint language (reader phases, plan steps). */
export function SegmentedProgress({
  value,
  total,
  color = "var(--primary)",
  height = 6,
  ariaLabel,
}: {
  value: number;
  total: number;
  color?: string;
  height?: number;
  ariaLabel?: string;
}) {
  const safeTotal = Math.max(total, 1);
  const done = Math.min(Math.max(value, 0), safeTotal);
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round((done / safeTotal) * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="flex gap-1"
      style={{ height }}
    >
      {Array.from({ length: safeTotal }).map((_, i) => (
        <span key={i} className="flex-1 rounded-full transition-colors" style={{ background: i < done ? color : "var(--muted)", transitionDuration: "0.3s" }} />
      ))}
    </div>
  );
}

/** TrendChart — editorial technical line: thin stroke, one highlighted point, cream callout (ref3 pattern). */
export function TrendChart({
  data,
  width = 300,
  height = 96,
  color = "var(--primary)",
  ariaLabel,
  callout,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  ariaLabel?: string;
  callout?: { index: number; label: string } | null;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(max - min, 12);
  const padX = 12;
  const padTop = 24;
  const padBottom = 10;
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = padTop + (1 - (v - min) / span) * (height - padTop - padBottom);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const hiIdx = callout ? Math.min(Math.max(callout.index, 0), pts.length - 1) : pts.length - 1;
  const hi = pts[hiIdx];
  const hiLabel = callout?.label;
  const cw = hiLabel ? Math.max(52, hiLabel.length * 6.4 + 20) : 0;
  const cx = Math.min(Math.max(hi[0] - cw / 2, 4), width - cw - 4);
  const cy = Math.max(hi[1] - 36, 4);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {/* hairline mid grid */}
      <line x1={4} y1={height / 2} x2={width - 4} y2={height / 2} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 6" />
      <path d={area} fill={color} opacity={0.06} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* guide line to highlighted point */}
      <line x1={hi[0]} y1={hi[1]} x2={hi[0]} y2={cy + 14} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="2 4" />
      {hiLabel && (
        <>
          <rect x={cx} y={cy} width={cw} height={20} rx={7} fill="var(--cream-soft)" stroke="var(--border)" strokeWidth={1} />
          <text x={cx + cw / 2} y={cy + 13.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--cream)">
            {hiLabel}
          </text>
        </>
      )}
      <circle cx={hi[0]} cy={hi[1]} r={4.5} fill="var(--surface)" stroke={color} strokeWidth={2} />
    </svg>
  );
}

/** CompareCard — two-value comparison with slanted divider + winner emphasis (ref5 concept, neutral execution). */
export function CompareCard({
  items,
  ariaLabel,
}: {
  items: { label: string; value: string; hint?: string; winner?: boolean }[];
  ariaLabel?: string;
}) {
  return (
    <div role="img" aria-label={ariaLabel} className="flex items-stretch justify-around gap-2 py-1">
      {items.map((it, i) => (
        <div key={it.label} className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1">
          {i > 0 && (
            <span aria-hidden className="absolute right-[-6px] top-1 h-[80%] w-px self-center" style={{ background: "var(--border-strong)", transform: "rotate(18deg)" }} />
          )}
          <div className="flex items-center gap-1">
            <span className="t-kpi num" style={{ fontSize: 26, color: it.winner ? "var(--primary)" : "var(--muted-foreground)" }}>
              {it.value}
            </span>
            {it.winner && <Check size={14} strokeWidth={3} style={{ color: "var(--primary)" }} aria-label="بهتر" />}
          </div>
          <span className="t-meta" style={{ color: "var(--muted-foreground)" }}>
            {it.label}
          </span>
          {it.hint && (
            <span className="t-meta mt-0.5" style={{ color: it.winner ? "var(--primary)" : "var(--muted-foreground)", opacity: it.winner ? 1 : 0.75 }}>
              {it.hint}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════ Imagery system — MabhasCover + SnapRail (directive §9–§22) ═══════════ */

/**
 * MabhasCover — the visual object of مباحث مقررات ملی ساختمان (§19).
 * Real generated asset + ink veil + oversized number in HTML (§14: text never baked in image).
 * Variants: rail (browse card) · hero (continue-reading) · thumb (dense row) · banner (reader head)
 */
export function MabhasCover({
  mabhas,
  title,
  meta,
  progress,
  badge,
  variant = "rail",
  onClick,
  ariaLabel,
  className = "",
}: {
  mabhas: number | null;
  title?: string;
  /** bottom meta line (question counts / status) */
  meta?: React.ReactNode;
  /** 0–100 → micro progress bar on the lower edge */
  progress?: number | null;
  /** absolute overlay node (status chip etc.) */
  badge?: React.ReactNode;
  variant?: "rail" | "hero" | "thumb" | "banner";
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  const src = mabhasCoverSrc(mabhas);
  const dims: Record<string, React.CSSProperties> = {
    rail: { width: 168, height: 224 },
    hero: { width: "100%", height: 196 },
    thumb: { width: 56, height: 72 },
    banner: { width: "100%", height: 92 },
  };
  const numSize = variant === "hero" ? 44 : variant === "rail" ? 30 : variant === "thumb" ? 16 : 24;
  const showText = variant !== "thumb";

  const body = (
    <>
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="cover-img" draggable={false} />
      ) : (
        <span className="absolute inset-0 blueprint-grid-sm" aria-hidden style={{ background: "var(--surface)" }} />
      )}
      <span aria-hidden className="cover-veil" />
      <span aria-hidden className="cover-grid" />
      <span aria-hidden className="cover-grain" />
      {/* oversized number — top inline-start (§19) */}
      <span className="absolute right-3.5 top-3 z-10 flex flex-col items-start gap-0.5">
        <span className="text-[8.5px] font-bold tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.55)" }}>
          مبحث
        </span>
        <span className="cover-num num" style={{ fontSize: numSize }}>
          {mabhas == null ? "—" : faNum(mabhas)}
        </span>
      </span>
      {badge && (
        <span className="absolute left-3 top-3 z-10">{badge}</span>
      )}
      {showText && (
        <span className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 p-3.5">
          {title && (
            <span
              className="line-clamp-2 text-[12.5px] font-extrabold leading-5"
              style={{ color: "#f2f5f4", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {title}
            </span>
          )}
          {meta && (
            <span className="num text-[9.5px] font-bold" style={{ color: "rgba(255,255,255,0.62)" }}>
              {meta}
            </span>
          )}
          {progress != null && (
            <span className="mt-0.5 block h-[3px] w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} aria-hidden>
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: "var(--primary)", transition: "width 0.5s cubic-bezier(0.2,0.8,0.2,1)" }}
              />
            </span>
          )}
        </span>
      )}
    </>
  );

  const style: React.CSSProperties = { ...dims[variant], ...(variant === "hero" || variant === "banner" ? { borderRadius: "1.4rem" } : {}) };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel ?? (mabhas == null ? undefined : `مبحث ${faNum(mabhas)} — ${mabhasTitle(mabhas)}`)}
        className={`cover-frame press block text-right ${className}`}
        style={style}
      >
        {body}
      </button>
    );
  }
  return (
    <div
      aria-label={ariaLabel ?? (mabhas == null ? undefined : `مبحث ${faNum(mabhas)} — ${mabhasTitle(mabhas)}`)}
      className={`cover-frame ${className}`}
      style={style}
    >
      {body}
    </div>
  );
}

/**
 * SnapRail — horizontal snap carousel (§17): touch swipe, snap, partial next card,
 * RTL-native (inherits dir), momentum, optional pagination dots driven by real scroll position.
 */
export function SnapRail({
  children,
  ariaLabel,
  dots = false,
  fade = true,
  className = "",
}: {
  children: React.ReactNode;
  ariaLabel: string;
  dots?: boolean;
  fade?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    setCount(items.length);
    if (!items.length) return;
    const onScroll = () => {
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const step = (items[0]?.offsetWidth ?? 1) + gap;
      // RTL-compliant: scrollLeft is 0 at the inline start and negative while scrolling (modern spec)
      const raw = Math.abs(el.scrollLeft) / step;
      setIdx(Math.min(items.length - 1, Math.round(raw)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  return (
    <div className={className}>
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        className={`rail-scroll no-scrollbar px-5 ${fade ? "rail-fade" : ""}`}
      >
        {children}
      </div>
      {dots && count > 2 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === idx ? 14 : 4,
                background: i === idx ? "var(--primary)" : "var(--border-strong)",
                transitionDuration: "0.25s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
