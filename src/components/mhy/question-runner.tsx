"use client";

import { useEffect, useState } from "react";
import type { MhyQuestion } from "@/lib/mhy/server";
import { api } from "@/lib/mhy/api";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum } from "@/lib/mhy/engines";
import { SourceBadge, DifficultyBadge, ReviewFlagBadge, MabhasChip, Btn, IconButton, SegmentedProgress, Eyebrow, MabhasCover } from "./ui";
import {
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  FileText,
  Link2,
  Flag,
  StickyNote,
  X,
  Check,
} from "lucide-react";

type RelatedQ = { id: number; text: string; sourceType: string; examSession: string | null; topic: string; mabhas: number | null };

export type RunnerMode = "practice" | "official-exam";

export function QuestionRunner({
  question,
  index,
  total,
  mode,
  onAnswer,
  onNext,
  onPrev,
  onExit,
  locked, // official exam: no instant feedback
  selected, // controlled selection for exam mode
  onSelect,
  showExplanationAfterAnswer = true,
  title, // optional runner title override
}: {
  question: MhyQuestion;
  index: number;
  total: number;
  mode: RunnerMode;
  onAnswer?: (qid: number, choice: number | null, correct: boolean | null) => void;
  onNext: () => void;
  onPrev: () => void;
  onExit?: () => void;
  locked?: boolean;
  selected?: number | null;
  onSelect?: (i: number) => void;
  showExplanationAfterAnswer?: boolean;
  title?: string;
}) {
  const { answers, bookmarks, toggleBookmark } = useMhy();
  const practiceAnswer = mode === "practice" ? answers[question.id] : undefined;
  const picked = locked ? selected : practiceAnswer?.choice ?? null;
  const revealed = !locked && picked !== null;
  const isBookmarked = bookmarks.includes(question.id);

  const choose = (i: number) => {
    if (locked) {
      onSelect?.(i);
      return;
    }
    if (revealed) return;
    onAnswer?.(question.id, i, i === question.answer);
  };

  const hasSource = question.citation.mabhas || question.citation.quote || question.mabhas != null;
  const correct = question.answer;

  return (
    <div className="flex flex-1 flex-col overflow-hidden screen-in" key={question.id}>
      {/* provenance header — counter as tabular anchor */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        {onExit ? (
          <IconButton icon={X} onClick={onExit} label="بستن" size={42} />
        ) : (
          <IconButton icon={ChevronRight} onClick={onPrev} label="سوال قبلی" disabled={index === 0} size={42} />
        )}
        <div className="min-w-0 flex-1 text-center">
          <p className="num truncate text-[13px] font-extrabold" style={{ color: "var(--foreground)", letterSpacing: "0.02em" }}>
            {faNum(index + 1)}
            <span style={{ color: "var(--muted-foreground)" }}> / {faNum(total)}</span>
          </p>
          <p className="t-meta truncate" style={{ color: "var(--muted-foreground)" }}>
            {title ?? (mode === "official-exam" && question.examSession ? `آزمون ${question.examSession}` : "تمرین")} · {question.topic || mabhasTitle(question.mabhas)}
          </p>
        </div>
        <IconButton
          icon={isBookmarked ? BookmarkCheck : Bookmark}
          onClick={() => toggleBookmark(question.id)}
          label={isBookmarked ? "حذف نشانک" : "ذخیره سوال"}
          active={isBookmarked}
          size={42}
        />
      </div>

      {/* checkpoint progress (§18 — 27/50 language) */}
      <div className="flex items-center gap-2 px-4 pt-3" aria-hidden>
        <div className="flex-1">
          <SegmentedProgress value={index + 1} total={Math.min(total, 30)} height={5} />
        </div>
        {total > 30 && <span className="num t-meta shrink-0">+{faNum(total - 30)}</span>}
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-5 pt-3.5 pb-4">
        {/* trust badges — quiet identity row */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <SourceBadge sourceType={question.sourceType} session={question.examSession} qnum={question.examQnum} />
          <MabhasChip m={question.mabhas} />
          <DifficultyBadge d={question.difficulty} />
          {question.status === "REVIEW_REQUIRED" && <ReviewFlagBadge />}
        </div>

        {/* question — focus by subtraction: typography, no box */}
        <p className="text-[15px] font-medium leading-8" style={{ color: "var(--foreground)" }}>
          {question.text}
        </p>
        <div className="construction my-4" />

        {/* options — full-width dense rows, tactile states */}
        <div className="space-y-2" role="group" aria-label="گزینه‌های پاسخ">
          {question.choices.map((opt, i) => {
            if (opt == null) return null;
            const isPicked = picked === i;
            const isAnswer = i === correct;
            const showState = revealed;
            let bg = "var(--surface)", border = "var(--border)", chipFg = "var(--muted-foreground)", chipBg = "var(--muted)";
            if (showState && isAnswer) { bg = "var(--success-soft)"; border = "var(--success)"; chipFg = "var(--success)"; chipBg = "transparent"; }
            else if (showState && isPicked && !isAnswer) { bg = "var(--danger-soft)"; border = "var(--danger)"; chipFg = "var(--danger)"; chipBg = "transparent"; }
            else if (isPicked) { bg = "var(--primary-soft)"; border = "var(--primary)"; chipFg = "var(--primary-foreground)"; chipBg = "var(--primary)"; }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                aria-pressed={isPicked}
                className="press flex min-h-[52px] w-full items-center gap-3 rounded-xl border p-3 text-right"
                style={{
                  background: bg,
                  borderColor: border,
                  transition: "background 0.25s ease, border-color 0.25s ease",
                  boxShadow: isPicked && !showState ? "var(--shadow-card)" : undefined,
                }}
              >
                <span
                  className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11.5px] font-bold"
                  style={{ borderColor: chipBg === "transparent" ? chipFg : "transparent", color: chipFg, background: chipBg }}
                >
                  {faNum(i + 1)}
                </span>
                <span className="flex-1 text-[13.5px] leading-7" style={{ color: "var(--foreground)" }}>
                  {opt}
                </span>
                {showState && isAnswer && <Check size={18} style={{ color: "var(--success)" }} strokeWidth={2.5} />}
                {showState && isPicked && !isAnswer && <X size={17} style={{ color: "var(--danger)" }} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {/* official exam: selection only, no feedback (§27) */}
        {!locked && revealed && (
          <div className="pop-in mt-4">
            {/* verdict — calm professional line, not a colored box */}
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ background: picked === correct ? "var(--success-soft)" : "var(--danger-soft)" }}
                aria-hidden
              >
                {picked === correct ? <Check size={14} style={{ color: "var(--success)" }} strokeWidth={3} /> : <X size={13} style={{ color: "var(--danger)" }} strokeWidth={3} />}
              </span>
              <p className="num text-[13px] font-bold" style={{ color: picked === correct ? "var(--success)" : "var(--danger)" }}>
                {picked === correct ? "پاسخ درست" : "پاسخ نادرست"}
                {correct != null && question.choices[correct] ? ` — گزینه ${faNum(correct + 1)}` : " — کلید در دسترس نیست"}
              </p>
            </div>
            {question.answerSource && (
              <p className="t-caption mt-1.5 pr-8" style={{ color: "var(--muted-foreground)" }}>
                منبع کلید: {question.answerSource === "lesson" ? "تطبیق با درسنامه" : question.answerSource}
              </p>
            )}
            <div className="construction my-3.5" />
            {showExplanationAfterAnswer && question.explanation && (
              <div className="mb-3.5 flex gap-2.5 rounded-2xl border p-3.5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <Lightbulb size={17} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
                <div>
                  <Eyebrow tone="accent">توضیح</Eyebrow>
                  <p className="t-body-sm mt-1 leading-6" style={{ color: "var(--foreground)" }}>
                    {question.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* source panel + related + notes (§24/§25/§55) — keyed inner component */}
            {hasSource && <PostAnswerPanels key={question.id} question={question} />}
          </div>
        )}
      </div>

      {/* footer — next action always reachable */}
      <div className="flex gap-2 border-t px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <Btn variant="secondary" onClick={onPrev} disabled={index === 0} ariaLabel="سوال قبلی">
          <ChevronRight size={17} />
          قبلی
        </Btn>
        <div className="flex-1">
          <Btn full onClick={onNext} disabled={mode === "practice" && !revealed && question.answer != null}>
            {index + 1 >= total ? (mode === "official-exam" ? "پایان و تحویل" : "پایان تمرین") : "بعدی"}
            <ChevronLeft size={17} />
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══ Post-answer panels — own state, reset naturally via key (§24/§25/§55) ═══ */
function PostAnswerPanels({ question }: { question: MhyQuestion }) {
  const { notes, setNote, reported, reportQuestion } = useMhy();
  const [sourceOpen, setSourceOpen] = useState(false);
  const [related, setRelated] = useState<RelatedQ[]>([]);
  const [relatedLoaded, setRelatedLoaded] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const isReported = reported.includes(question.id);

  const loadRelated = async () => {
    if (relatedLoaded) return;
    setRelatedLoaded(true);
    try {
      const j = await api.question(question.id);
      setRelated(j.related ?? []);
    } catch {
      setRelated([]);
    }
  };

  return (
    <>
      {/* collapsible source panel — dense hairline row */}
      <button
        onClick={() => setSourceOpen((v) => !v)}
        className="press flex min-h-[46px] w-full items-center gap-2.5 border-b py-3 text-right"
        style={{ borderColor: "var(--border)" }}
        aria-expanded={sourceOpen}
      >
        <FileText size={16} style={{ color: "var(--primary)" }} />
        <span className="flex-1 text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
          مشاهده منبع {question.citation.mabhas ? `— ${question.citation.mabhas}` : ""}
        </span>
        <ChevronLeft size={15} style={{ color: "var(--muted-foreground)", transform: sourceOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }} />
      </button>
      {sourceOpen && (
        <div className="fade-in mb-3.5 rounded-2xl border p-3.5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex gap-3">
            <MabhasCover mabhas={question.mabhas} variant="thumb" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <Eyebrow>مسیر منبع</Eyebrow>
              <p className="num mt-1.5 text-[12px] leading-6" style={{ color: "var(--foreground)" }}>
                {question.citation.mabhas ?? (question.mabhas != null ? mabhasTitle(question.mabhas) : "—")}
                {question.citation.band && ` › بند ${question.citation.band}`}
                {question.citation.page && ` › صفحه ${faNum(question.citation.page)}`}
              </p>
              {question.mabhas != null && (
                <p className="t-caption mt-2.5" style={{ color: "var(--primary)" }}>
                  ← متن کامل بند در تب مطالعه، مباحث مقررات، مبحث {faNum(question.mabhas)}
                </p>
              )}
            </div>
          </div>
          {question.citation.quote && (
            <blockquote className="mt-2 border-r-2 pr-3 text-[12px] leading-6" style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}>
              «{question.citation.quote}»
            </blockquote>
          )}
        </div>
      )}

      {/* related questions — data-driven */}
      <button
        onClick={() => {
          loadRelated();
          setRelatedOpen((v) => !v);
        }}
        className="press flex min-h-[46px] w-full items-center gap-2.5 border-b py-3 text-right"
        style={{ borderColor: "var(--border)" }}
        aria-expanded={relatedOpen}
      >
        <Link2 size={16} style={{ color: "var(--primary)" }} />
        <span className="flex-1 text-[12.5px] font-bold" style={{ color: "var(--foreground)" }}>
          سؤالات مشابه و همین مبحث
        </span>
        <ChevronLeft size={15} style={{ color: "var(--muted-foreground)", transform: relatedOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }} />
      </button>
      {relatedOpen && (
        <div className="fade-in mb-3.5 space-y-1.5">
          {related.length === 0 && (
            <p className="py-2 text-center t-caption" style={{ color: "var(--muted-foreground)" }}>
              سوال مرتبطی یافت نشد
            </p>
          )}
          {related.map((r) => (
            <p key={r.id} className="num truncate rounded-xl border px-3 py-2 text-[11px]" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              {r.sourceType === "OFFICIAL_EXAM" ? "رسمی" : "تألیفی"}
              {r.examSession ? ` · ${r.examSession}` : ""} · {r.topic || (r.mabhas != null ? `مبحث ${faNum(r.mabhas)}` : "")} — {r.text}
            </p>
          ))}
        </div>
      )}

      {/* report + note */}
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setNoteOpen((v) => !v)}
          className="press flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-[11.5px] font-bold"
          style={{ background: "var(--surface)", color: "var(--foreground)", borderColor: "var(--border)" }}
        >
          <StickyNote size={14} />
          یادداشت شخصی
        </button>
        <button
          onClick={() => reportQuestion(question.id)}
          disabled={isReported}
          className="press flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-[11.5px] font-bold disabled:opacity-50"
          style={{ background: "var(--surface)", color: isReported ? "var(--success)" : "var(--danger)", borderColor: "var(--border)" }}
        >
          <Flag size={14} />
          {isReported ? "گزارش ثبت شد" : "گزارش خطا"}
        </button>
      </div>
      {noteOpen && (
        <textarea
          value={notes[question.id] ?? ""}
          onChange={(e) => setNote(question.id, e.target.value)}
          placeholder="یادداشت شما درباره این سوال…"
          rows={3}
          className="w-full rounded-2xl border p-3 text-[12.5px] outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)" }}
        />
      )}
    </>
  );
}
