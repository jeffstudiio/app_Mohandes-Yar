"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnswerState, ExamAttempt } from "./engines";
import type { MhyDiscipline, DisciplineStat } from "./content-core";

// ─── Client state — persisted progress (offline-first §39) ───

export type Profile = {
  onboarded: boolean;
  /** parent discipline code, e.g. CIVIL (§9.1 — parent, never a combined code) */
  disciplineGroup: string | null;
  /** parent discipline title, e.g. عمران */
  disciplineTitle: string | null;
  /** selected competencies — REAL major codes from the DB, multi-select (§9.3/§9.4) */
  competencies: string[];
  /** active focus: which selected competency is currently in focus (may be null = همه) */
  activeCompetency: string | null;
  /** @deprecated legacy scalar competency — kept only for v0 → v1 migration */
  competency?: string | null;
  /** @deprecated legacy combined code — kept only for v0 → v1 migration */
  disciplineCode?: string | null;
  targetExam: string | null; // session name
  targetExamDate: number | null; // epoch ms — user-provided, never hard-coded
  name: string;
};

export type StudyPosition = { mabhas: number; bandId: number | null; kind: "regulation" | "lesson"; at: number };

type MhyState = {
  theme: "light" | "dark";
  profile: Profile;
  answers: Record<number, AnswerState>;
  bookmarks: number[];
  notes: Record<number, string>;
  mistakes: number[]; // qids answered wrong (chronological, unique)
  attempts: ExamAttempt[];
  lastStudy: StudyPosition | null;
  studiedBands: number[];
  officialSessionsSeen: string[];
  reported: number[]; // question ids flagged for issue report
  license: { token: string | null; activatedAt: number | null };

  setTheme: (t: "light" | "dark") => void;
  completeOnboarding: (p: Partial<Profile>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  recordAnswer: (qid: number, choice: number | null, correct: boolean | null) => void;
  toggleBookmark: (qid: number) => void;
  setNote: (qid: number, note: string) => void;
  addAttempt: (a: ExamAttempt) => void;
  setLastStudy: (p: StudyPosition) => void;
  toggleStudiedBand: (bandId: number) => void;
  markSessionSeen: (s: string) => void;
  reportQuestion: (qid: number) => void;
  activateLicense: (token: string) => void;
  resetAll: () => void;
};

export const emptyProfile: Profile = {
  onboarded: false,
  disciplineGroup: null,
  disciplineTitle: null,
  competencies: [],
  activeCompetency: null,
  targetExam: null,
  targetExamDate: null,
  name: "",
};

export const useMhy = create<MhyState>()(
  persist(
    (set) => ({
      theme: "light",
      profile: emptyProfile,
      answers: {},
      bookmarks: [],
      notes: {},
      mistakes: [],
      attempts: [],
      lastStudy: null,
      studiedBands: [],
      officialSessionsSeen: [],
      reported: [],
      license: { token: null, activatedAt: null },

      setTheme: (t) => set({ theme: t }),
      completeOnboarding: (p) => set((st) => ({ profile: { ...st.profile, ...p, onboarded: true } })),
      updateProfile: (p) => set((st) => ({ profile: { ...st.profile, ...p } })),
      recordAnswer: (qid, choice, correct) =>
        set((st) => ({
          answers: { ...st.answers, [qid]: { choice, correct, at: Date.now() } },
          mistakes:
            correct === false && !st.mistakes.includes(qid) ? [qid, ...st.mistakes].slice(0, 500) : st.mistakes,
        })),
      toggleBookmark: (qid) =>
        set((st) => ({
          bookmarks: st.bookmarks.includes(qid) ? st.bookmarks.filter((x) => x !== qid) : [qid, ...st.bookmarks],
        })),
      setNote: (qid, note) => set((st) => ({ notes: { ...st.notes, [qid]: note } })),
      addAttempt: (a) => set((st) => ({ attempts: [a, ...st.attempts].slice(0, 60) })),
      setLastStudy: (p) => set({ lastStudy: p }),
      toggleStudiedBand: (bandId) =>
        set((st) => ({
          studiedBands: st.studiedBands.includes(bandId)
            ? st.studiedBands.filter((x) => x !== bandId)
            : [bandId, ...st.studiedBands],
        })),
      markSessionSeen: (s) =>
        set((st) => ({
          officialSessionsSeen: st.officialSessionsSeen.includes(s) ? st.officialSessionsSeen : [...st.officialSessionsSeen, s],
        })),
      reportQuestion: (qid) =>
        set((st) => ({ reported: st.reported.includes(qid) ? st.reported : [...st.reported, qid] })),
      activateLicense: (token) => set({ license: { token, activatedAt: Date.now() } }),
      resetAll: () =>
        set((st) => ({
          profile: { ...emptyProfile },
          answers: {},
          bookmarks: [],
          notes: {},
          mistakes: [],
          attempts: [],
          lastStudy: null,
          studiedBands: [],
          officialSessionsSeen: [],
          reported: [],
        })),
    }),
    {
      name: "mhy-v2-state",
      version: 1,
      // ── v0 → v1 migration: scalar competency → multi-select competencies (§9.3/§32.6) ──
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const profile = (p.profile ?? {}) as Record<string, unknown>;
        if (version < 1) {
          const legacyCode = (profile.disciplineCode as string | null) ?? null;
          const legacyCompetency = (profile.competency as string | null) ?? null;
          let group = (profile.disciplineGroup as string | null) ?? null;
          let groupTitle = (profile.disciplineTitle as string | null) ?? null;
          let competencies = (profile.competencies as string[] | undefined) ?? [];
          if (legacyCode) {
            group = group ?? legacyCode.split("-")[0];
            competencies = competencies.length ? competencies : [legacyCode];
            // old title looked like "عمران-نظارت" / "عمران — نظارت" → keep only the parent
            if (groupTitle && !groupTitle.includes("—")) {
              groupTitle = groupTitle.split("-")[0]?.trim() ?? groupTitle;
              groupTitle = groupTitle.split("—")[0]?.trim() ?? groupTitle;
            }
          }
          profile.disciplineGroup = group;
          profile.disciplineTitle = groupTitle;
          profile.competencies = competencies;
          profile.activeCompetency = legacyCompetency;
          profile.onboarded = Boolean(profile.onboarded);
          p.profile = profile;
        }
        return p as MhyState;
      },
    }
  )
);

// ─── The real mabhas metadata of مقررات ملی ساختمان (titles only — no content fabrication) ───
export const MABHAS_TITLES: Record<number, string> = {
  1: "کلیات و تعاریف",
  2: "نظامات اداری",
  3: "حفاظت ساختمان‌ها در مقابل حریق",
  4: "الزامات عمومی ساختمان",
  5: "مصالح و فنون ساختمان",
  6: "بارهای وارد بر ساختمان",
  7: "پی و فونداسیون",
  8: "طراحی اجرایی ساختمان‌های بتن‌آرمه",
  9: "طراحی و اجرای ساختمان‌های بتن‌آرمه",
  10: "طراحی و اجرای ساختمان‌های فولادی",
  11: "طراحی و اجرای سازه‌های چوبی",
  12: "ضوابط طراحی ساختمان‌ها برای بهره‌وری انرژی",
  13: "طراحی تفصیلی و اجرایی تأسیسات برقی ساختمان‌ها",
  14: "تأسیسات مکانیکی",
  15: "آسانسور و پله برقی",
  16: "تأسیسات بهداشتی",
  17: "لوله‌کشی گاز طبیعی",
  18: "بهره‌برداری از تأسیسات و تجهیزات مکانیکی",
  19: "صرفه‌جویی در مصرف انرژی و برق",
  20: "نشانه‌گذاری ساختمان‌ها (راهنما و علامت‌گذاری)",
  21: "پدافند غیرعامل",
  22: "مراقبت و نگهداری از ساختمان",
  23: "علائم و تابلوهای ایمنی",
};

export const mabhasTitle = (m: number | null | undefined) =>
  m == null ? "عمومی" : MABHAS_TITLES[m] ?? `مبحث ${m}`;

// ─── Discipline grouping — derived from REAL DB disciplines (§9.1/§32.2/§32.3) ───
// majorCodes like CIVIL-SUPERVISION group under parent CIVIL; the competency label
// is the suffix of the real title (عمران-نظارت → نظارت). Nothing is invented.

export type DisciplineItem = {
  majorCode: string; // real DB code, e.g. CIVIL-SUPERVISION
  competency: string; // real Persian label from the DB title, e.g. نظارت
  total: number;
  official: number;
  authored: number;
};

export type DisciplineGroup = {
  code: string; // CIVIL
  title: string; // عمران
  items: DisciplineItem[];
  counts: { total: number; official: number; authored: number };
};

const GROUP_FALLBACK_TITLE: Record<string, string> = {
  CIVIL: "عمران",
  ARCH: "معماری",
  ELEC: "تاسیسات برقی",
  MECH: "تاسیسات مکانیکی",
  URBAN: "شهرسازی",
  SURV: "نقشه‌برداری",
  TRAFFIC: "ترافیک",
};

function competencyLabel(majorCode: string, title: string): string {
  // real titles: "عمران-نظارت" | "عمران — نظارت" | "ترافیک" (single)
  const dash = title.includes("—") ? "—" : "-";
  if (title.includes(dash)) {
    const parts = title.split(dash);
    return (parts[1] ?? parts[0]).trim();
  }
  return title.trim();
}

export function groupDisciplines(
  disciplines: MhyDiscipline[] | undefined,
  stats: Record<string, DisciplineStat> | undefined
): DisciplineGroup[] {
  if (!disciplines?.length) return [];
  const map = new Map<string, DisciplineGroup>();
  for (const d of disciplines) {
    const code = d.majorCode.split("-")[0];
    const st = stats?.[d.majorCode] ?? { total: 0, official: 0, authored: 0 };
    const g = map.get(code) ?? {
      code,
      title: GROUP_FALLBACK_TITLE[code] ?? competencyLabel(d.majorCode, d.title),
      items: [],
      counts: { total: 0, official: 0, authored: 0 },
    };
    g.items.push({ majorCode: d.majorCode, competency: competencyLabel(d.majorCode, d.title), ...st });
    g.counts.total += st.total;
    g.counts.official += st.official;
    g.counts.authored += st.authored;
    map.set(code, g);
  }
  // keep groups sorted by real question volume (desc) — data-driven order
  return [...map.values()].sort((a, b) => b.counts.total - a.counts.total);
}

export function competencyOfCode(disciplines: MhyDiscipline[] | undefined, code: string): string {
  const d = disciplines?.find((x) => x.majorCode === code);
  return d ? competencyLabel(code, d.title) : code;
}
