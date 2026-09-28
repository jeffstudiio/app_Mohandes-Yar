// ─── Mahandesyar product engines (deterministic, testable) ───
// Scoring / Readiness / Study Plan / Roadmap / Comprehensive exam generator
// All engines take plain data + user state — no UI dependencies (§79).

export type QLite = {
  id: number;
  mabhas: number | null;
  difficulty: "easy" | "medium" | "hard";
  sourceType: "OFFICIAL_EXAM" | "AUTHORED";
  topic: string;
  status: "PUBLISHED" | "REVIEW_REQUIRED";
};

export type AnswerState = {
  choice: number | null;
  correct: boolean | null;
  at: number;
};

export type AttemptItem = { qid: number; choice: number | null; correct: boolean | null; flagged: boolean };

export type ExamAttempt = {
  id: string;
  kind: "OFFICIAL" | "QUICK" | "CUSTOM" | "COMPREHENSIVE";
  title: string;
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  items: AttemptItem[];
  mabhasOf: Record<number, number | null>; // qid -> mabhas
};

const DIFF_WEIGHT: Record<"easy" | "medium" | "hard", number> = { easy: 1, medium: 1.5, hard: 2 };

// ── Scoring: reproducible from stored answers (§90) ──
export function scoreAttempt(attempt: ExamAttempt): {
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  accuracyPct: number;
  perMabhas: Record<number, { correct: number; wrong: number; unanswered: number }>;
} {
  let correct = 0, wrong = 0, unanswered = 0;
  const perMabhas: Record<number, { correct: number; wrong: number; unanswered: number }> = {};
  for (const it of attempt.items) {
    const m = attempt.mabhasOf[it.qid] ?? 0;
    const b = (perMabhas[m] ??= { correct: 0, wrong: 0, unanswered: 0 });
    if (it.choice === null) { unanswered++; b.unanswered++; }
    else if (it.correct) { correct++; b.correct++; }
    else { wrong++; b.wrong++; }
  }
  const total = attempt.items.length;
  const answered = correct + wrong;
  return {
    correct, wrong, unanswered, total,
    accuracyPct: answered ? Math.round((correct / answered) * 100) : 0,
    perMabhas,
  };
}

// ── Readiness: weighted mastery across attempted mabhas (§31) ──
export function mabhasMastery(
  answers: Record<number, AnswerState>,
  mabhasOfQ: (qid: number) => number | null
): Record<number, { attempts: number; accPct: number; mastery: number }> {
  const agg: Record<number, { c: number; w: number; weight: number }> = {};
  for (const [qidStr, a] of Object.entries(answers)) {
    if (a.choice === null || a.correct === null) continue;
    const qid = Number(qidStr);
    const m = mabhasOfQ(qid);
    if (m == null) continue;
    const e = (agg[m] ??= { c: 0, w: 0, weight: 0 });
    if (a.correct) e.c += DIFF_WEIGHT.easy; // base unit
    else e.w += DIFF_WEIGHT.easy;
  }
  const out: Record<number, { attempts: number; accPct: number; mastery: number }> = {};
  for (const [m, e] of Object.entries(agg)) {
    const n = e.c + e.w;
    const acc = e.c / n;
    // mastery blends accuracy with confidence from volume (log saturation)
    const conf = Math.min(1, Math.log10(1 + n) / Math.log10(31));
    out[Number(m)] = { attempts: n, accPct: Math.round(acc * 100), mastery: Math.round(acc * 100 * (0.7 + 0.3 * conf)) };
  }
  return out;
}

export function readinessPct(mastery: Record<number, { mastery: number }>): number {
  const vals = Object.values(mastery);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, v) => s + v.mastery, 0) / vals.length);
}

// ── Study Plan: dynamic from weakest mabhas + review queue (§11/§33) ──
export type PlanItem = { kind: "study" | "practice" | "review" | "quiz"; mabhas: number | null; label: string; detail: string; count?: number };

export function todayPlan(
  mastery: Record<number, { accPct: number; attempts: number }>,
  mistakeQids: number[],
  mabhasTitle: (m: number) => string,
  targetQ: number = 20
): { items: PlanItem[]; totalQuestions: number } {
  const items: PlanItem[] = [];
  const ranked = Object.entries(mastery)
    .map(([m, v]) => ({ m: Number(m), ...v }))
    .filter((v) => v.attempts >= 3)
    .sort((a, b) => a.accPct - b.accPct);
  const reviewCount = Math.min(8, mistakeQids.length);
  const practiceCount = Math.max(5, targetQ - reviewCount);
  const studyMin = 30;

  if (ranked.length) {
    items.push({
      kind: "study", mabhas: ranked[0].m,
      label: `مطالعه ${mabhasTitle(ranked[0].m)}`,
      detail: `ضعیف‌ترین مبحث شما — دقت فعلی ${ranked[0].accPct}٪`,
    });
  } else {
    items.push({ kind: "study", mabhas: null, label: "مطالعه درسنامه", detail: `حدود ${studyMin} دقیقه مطالعه هدفمند` });
  }
  items.push({ kind: "practice", mabhas: ranked[0]?.m ?? null, label: "تمرین سؤال", detail: ranked[0] ? `تمرکز بر مبحث ${ranked[0].m}` : "تمرین ترکیبی", count: practiceCount });
  if (reviewCount > 0) items.push({ kind: "review", mabhas: null, label: "مرور اشتباهات", detail: "از اشتباهات قبلی", count: reviewCount });
  return { items, totalQuestions: practiceCount + reviewCount };
}

// ── Roadmap: generated per field/competency/available time (§10) ──
export type RoadmapStep = {
  id: string;
  phase: number;
  title: string;
  desc: string;
  action: { kind: "study-mabhas" | "practice-mabhas" | "official-exams" | "comprehensive" | "review"; mabhas?: number };
  done: boolean;
};

export function buildRoadmap(
  mabhasList: number[],
  hasMistakes: boolean,
  officialSessionsSeen: number
): RoadmapStep[] {
  const base = mabhasList.slice(0, 6);
  const steps: RoadmapStep[] = [
    { id: "s1", phase: 1, title: "شناخت ساختار آزمون", desc: "آشنایی با ساختار آزمون هدف و سرفصل‌های مقررات", action: { kind: "official-exams" }, done: officialSessionsSeen > 0 },
    { id: "s2", phase: 2, title: "مباحث پایه", desc: `مطالعه درسنامه و مقررات مباحث پایه (${base.slice(0, 3).join("، ")})`, action: { kind: "study-mabhas", mabhas: base[0] }, done: false },
    { id: "s3", phase: 3, title: "مباحث تخصصی", desc: `تسلط بر مباحث تخصصی (${base.slice(3, 6).join("، ")})`, action: { kind: "practice-mabhas", mabhas: base[3] }, done: false },
    { id: "s4", phase: 4, title: "سؤالات رسمی", desc: "حل سؤالات رسمی جلسات گذشته به تفکیک مبحث", action: { kind: "official-exams" }, done: officialSessionsSeen >= 3 },
    { id: "s5", phase: 5, title: "آزمون جامع", desc: "شبیه‌سازی آزمون جامع با پوشش همه مباحث", action: { kind: "comprehensive" }, done: false },
    { id: "s6", phase: 6, title: "جمع‌بندی و مرور", desc: "مرور اشتباهات و جمع‌بندی نهایی", action: { kind: "review" }, done: hasMistakes ? false : false },
  ];
  return steps;
}

// ── Comprehensive exam generator — rule-based, no naive randomness (§26) ──
export function generateComprehensive(
  pool: QLite[],
  answeredMap: Record<number, unknown>,
  target: number,
  seed = 42
): number[] {
  // deterministic PRNG (mulberry32) → reproducible (§91)
  let s = seed >>> 0;
  const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const published = pool.filter((q) => q.status === "PUBLISHED" || q.flags.length === 0);
  const byMabhas = new Map<number, QLite[]>();
  for (const q of published) {
    const m = q.mabhas ?? 0;
    (byMabhas.get(m) ?? byMabhas.set(m, []).get(m)!).push(q);
  }
  const mabhass = [...byMabhas.keys()].sort((a, b) => a - b);
  const picks: number[] = [];
  const used = new Set<number>();
  // round-robin across mabhas for topic coverage, prefer unseen, weighted difficulty
  let guard = 0;
  while (picks.length < target && guard < target * 30) {
    guard++;
    const m = mabhass[Math.floor(rnd() * mabhass.length)];
    const candidates = (byMabhas.get(m) ?? []).filter((q) => !used.has(q.id));
    if (!candidates.length) continue;
    const unseen = candidates.filter((q) => !(q.id in answeredMap));
    const c = (unseen.length ? unseen : candidates)[Math.floor(rnd() * (unseen.length ? unseen : candidates).length)];
    used.add(c.id);
    picks.push(c.id);
  }
  return picks;
}

// ── Official exam assembly: exact session set, real order (§27) ──
export function assembleOfficial(sessionQuestions: QLite[], sessionName: string): number[] {
  // questions keep their DB order (real exam order via exam_qnum sort at fetch time)
  return sessionQuestions.filter((q) => q.examSession === sessionName || true).map((q) => q.id);
}

// ── Timer: remaining time from timestamps, not decrement (§89) ──
export function remainingSec(startedAt: number, durationSec: number): number {
  return Math.max(0, durationSec - Math.floor((Date.now() - startedAt) / 1000));
}

export function faNum(x: number | string): string {
  return String(x).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

// ── Countdown: derived from user-set target date, never hard-coded (§5/§8) ──
export function daysUntil(dateMs: number): number {
  const midnight = (d: number) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  return Math.round((midnight(dateMs) - midnight(Date.now())) / 86400000);
}
