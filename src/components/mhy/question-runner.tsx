"use client";

import { useEffect, useState } from "react";
import type { MhyQuestion } from "@/lib/mhy/server";
import { useMhy, mabhasTitle } from "@/lib/mhy/store";
import { faNum } from "@/lib/mhy/engines";
import { SourceBadge, DifficultyBadge, ReviewFlagBadge, MabhasChip, Btn } from "./ui";
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
}) {
  const { answers, bookmarks, toggleBookmark, notes, setNote, reported, reportQuestion } = useMhy();
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
      {/* provenance header (§15) */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        {onExit ? (
          <button onClick={onExit} aria-label="بستن" className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color: "var(--muted-foreground)" }}>
            <X size={19} />
          </button>
        ) : (
          <button onClick={onPrev} disabled={index === 0} aria-label="سوال قبلی" className="flex h-11 w-11 items-center justify-center rounded-xl disabled:opacity-30" style={{ color: "var(--muted-foreground)" }}>
            <ChevronRight size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
            {mode === "official-exam" && question.examSession ? `آزمون ${question.examSession}` : "تمرین"}
            {" · "}
            سوال {faNum(index + 1)} از {faNum(total)}
          </p>
          <p className="truncate text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {question.topic || mabhasTitle(question.mabhas)}
          </p>
        </div>
        <button
          onClick={() => toggleBookmark(question.id)}
          aria-label={isBookmarked ? "حذف نشانک" : "ذخیره سوال"}
          aria-pressed={isBookmarked}
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ color: isBookmarked ? "var(--primary)" : "var(--muted-foreground)" }}
        >
          {isBookmarked ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
        </button>
      </div>

      {/* progress */}
      <div className="flex gap-1 px-4 pt-3" aria-hidden="true">
        {Array.from({ length: Math.min(total, 30) }).map((_, i) => {
          const fill = i <= index ? 1 : 0.25;
          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= index ? "var(--primary)" : "var(--muted)", opacity: fill }}
            />
          );
        })}
        {total > 30 && <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>+{faNum(total - 30)}</span>}
      </div>

      <div className="phone-scroll flex-1 overflow-y-auto px-4 pt-3.5 pb-4">
        {/* badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <SourceBadge sourceType={question.sourceType} session={question.examSession} qnum={question.examQnum} />
          <MabhasChip m={question.mabhas} />
          <DifficultyBadge d={question.difficulty} />
          {question.status === "REVIEW_REQUIRED" && <ReviewFlagBadge />}
        </div>

        {/* question text (§48 typography) */}
        <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-[14px] font-medium leading-8" style={{ color: "var(--foreground)" }}>
            {question.text}
          </p>
        </div>

        {/* options */}
        <div className="mt-3.5 space-y-2.5" role="group" aria-label="گزینه‌های پاسخ">
          {question.choices.map((opt, i) => {
            if (opt == null) return null;
            const isPicked = picked === i;
            const isAnswer = i === correct;
            const showState = revealed || (locked === true && false);
            let bg = "var(--card)", border = "var(--border)", fg = "var(--foreground)";
            if (showState && isAnswer) { bg = "var(--success-soft)"; border = "var(--success)"; fg = "var(--success)"; }
            else if (showState && isPicked && !isAnswer) { bg = "var(--danger-soft)"; border = "var(--danger)"; fg = "var(--danger)"; }
            else if (isPicked) { bg = "var(--primary-soft)"; border = "var(--primary)"; fg = "var(--primary)"; }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                aria-pressed={isPicked}
                className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-all"
                style={{ background: bg, borderColor: border, color: fg }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold"
                  style={{ borderColor: "currentColor", color: fg }}
                >
                  {faNum(i + 1)}
                </span>
                <span className="text-[13px] leading-7" style={{ color: "var(--foreground)" }}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* official exam: selection only, no feedback (§27) */}
        {!locked && revealed && (
          <div className="pop-in mt-3.5 space-y-2.5">
            <div
              className="rounded-2xl p-3.5"
              style={{ background: picked === correct ? "var(--success-soft)" : "var(--danger-soft)" }}
            >
              <p className="text-[12.5px] font-bold" style={{ color: picked === correct ? "var(--success)" : "var(--danger)" }}>
                {picked === correct ? "پاسخ درست" : "پاسخ نادرست"}
                {correct != null && question.choices[correct] ? ` — گزینه ${faNum((correct ?? 0) + 1)}` : " — کلید در دسترس نیست"}
              </p>
              {question.answerSource && (
                <p className="mt-1 text-[10.5px]" style={{ color: "var(--muted-foreground)" }}>
                  منبع کلید: {question.answerSource === "lesson" ? "تطبیق با درسنامه" : question.answerSource}
                </p>
              )}
            </div>
            {showExplanationAfterAnswer && question.explanation && (
              <div className="flex gap-2.5 rounded-2xl p-3.5" style={{ background: "var(--primary-soft)" }}>
                <Lightbulb size={18} className="shrink-0" style={{ color: "var(--primary)" }} />
                <div>
                  <p className="text-[11.5px] font-bold" style={{ color: "var(--primary)" }}>
                    توضیح
                  </p>
                  <p className="mt-1 text-[12px] leading-6" style={{ color: "var(--foreground)" }}>
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

      {/* footer nav */}
      <div className="flex gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
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
      const res = await fetch(`/api/mhy/question?id=${question.id}`);
      const j = await res.json();
      setRelated(j.related ?? []);
    } catch {
      setRelated([]);
    }
  };

  return (
    <>
      {/* source panel (§24) */}
      <button
        onClick={() => setSourceOpen((v) => !v)}
        className="flex min-h-[46px] w-full items-center gap-2.5 rounded-2xl border px-3.5 text-right"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        aria-expanded={sourceOpen}
      >
        <FileText size={16} style={{ color: "var(--primary)" }} />
        <span className="flex-1 text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
          مشاهده منبع {question.citation.mabhas ? `— ${question.citation.mabhas}` : ""}
        </span>
        <ChevronLeft size={15} style={{ color: "var(--muted-foreground)", transform: sourceOpen ? "rotate(90deg)" : "none" }} />
      </button>
      {sourceOpen && (
        <div className="rounded-2xl border p-3.5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-[11px] font-bold" style={{ color: "var(--muted-foreground)" }}>
            مسیر منبع
          </p>
          <p className="mt-1.5 text-[12px] leading-6" style={{ color: "var(--foreground)" }}>
            {question.citation.mabhas ?? (question.mabhas != null ? mabhasTitle(question.mabhas) : "—")}
            {question.citation.band && ` › بند ${question.citation.band}`}
            {question.citation.page && ` › صفحه ${faNum(question.citation.page)}`}
          </p>
          {question.citation.quote && (
            <blockquote className="mt-2 border-r-2 pr-3 text-[12px] leading-6" style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}>
              «{question.citation.quote}»
            </blockquote>
          )}
          {question.mabhas != null && (
            <div className="mt-2.5">
              <span className="text-[10.5px]" style={{ color: "var(--primary)" }}>
                ← متن کامل بند در تب مطالعه، مباحث مقررات، مبحث {faNum(question.mabhas)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* related questions (§25 — data-driven) */}
      <button
        onClick={() => {
          loadRelated();
          setRelatedOpen((v) => !v);
        }}
        className="flex min-h-[46px] w-full items-center gap-2.5 rounded-2xl border px-3.5 text-right"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
        aria-expanded={relatedOpen}
      >
        <Link2 size={16} style={{ color: "var(--primary)" }} />
        <span className="flex-1 text-[12px] font-bold" style={{ color: "var(--foreground)" }}>
          سؤالات مشابه و همین مبحث
        </span>
        <ChevronLeft size={15} style={{ color: "var(--muted-foreground)", transform: relatedOpen ? "rotate(90deg)" : "none" }} />
      </button>
      {relatedOpen && (
        <div className="space-y-1.5">
          {related.length === 0 && (
            <p className="py-2 text-center text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              سوال مرتبطی یافت نشد
            </p>
          )}
          {related.map((r) => (
            <p key={r.id} className="truncate rounded-xl border px-3 py-2 text-[11px]" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              {r.sourceType === "OFFICIAL_EXAM" ? "رسمی" : "تألیفی"}
              {r.examSession ? ` · ${r.examSession}` : ""} · {r.topic || (r.mabhas != null ? `مبحث ${faNum(r.mabhas)}` : "")} — {r.text}
            </p>
          ))}
        </div>
      )}

      {/* report + note (§23/§55) */}
      <div className="flex gap-2">
        <button
          onClick={() => setNoteOpen((v) => !v)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-[11.5px] font-bold"
          style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}
        >
          <StickyNote size={14} />
          یادداشت شخصی
        </button>
        <button
          onClick={() => reportQuestion(question.id)}
          disabled={isReported}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-[11.5px] font-bold disabled:opacity-50"
          style={{ background: "var(--card)", color: isReported ? "var(--success)" : "var(--danger)", borderColor: "var(--border)" }}
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
          className="w-full rounded-2xl border p-3 text-[12.5px] outline-none focus:ring-2"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
        />
      )}
    </>
  );
}
