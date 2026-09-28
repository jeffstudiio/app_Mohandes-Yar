"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnswerState, ExamAttempt } from "./engines";

// ─── Client state — persisted progress (offline-first §39) ───

export type Profile = {
  onboarded: boolean;
  disciplineCode: string | null; // e.g. CIVIL-SUPERVISION
  disciplineTitle: string | null;
  competency: string | null; // نظارت / اجرا / طراحی / محاسبات …
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

export const useMhy = create<MhyState>()(
  persist(
    (set) => ({
      theme: "light",
      profile: {
        onboarded: false,
        disciplineCode: null,
        disciplineTitle: null,
        competency: null,
        targetExam: null,
        targetExamDate: null,
        name: "",
      },
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
          profile: { ...st.profile, onboarded: false, disciplineCode: null, competency: null, targetExam: null, targetExamDate: null },
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
    { name: "mhy-v2-state" }
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

export const COMPETENCY_OF_DISCIPLINE: Record<string, string[]> = {
  CIVIL: ["نظارت", "اجرا", "محاسبات", "بهسازی", "گودبرداری", "کاردانی"],
  ARCH: ["نظارت", "اجرا", "طراحی"],
  ELEC: ["طراحی", "نظارت", "اجرا"],
  MECH: ["طراحی", "نظارت", "اجرا"],
  URBAN: ["طراحی"],
  SURV: ["طراحی", "کاردانی"],
  TRAFFIC: ["طراحی"],
};
