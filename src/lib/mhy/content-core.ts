// ─── Isomorphic content core — pure queries over the REAL exported DB content ───
// Source: assets_db_mohandes_yar_server.db (actual APK v1.0.0), exported by scripts/export_content.py
// Runs identically on the server (fs-loaded → server.ts) and in the browser
// (fetch-loaded from /data/*.json → api.ts). Single source of truth for query semantics.

export type MhyQuestion = {
  id: number;
  text: string;
  major: string;
  discipline: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  answer: number | null;
  explanation: string | null;
  type: string;
  sourceType: "OFFICIAL_EXAM" | "AUTHORED";
  mabhas: number | null;
  citation: {
    page: string | null;
    mabhas: string | null;
    band: string | null;
    line: string | null;
    quote: string | null;
  };
  answerSource: string | null;
  examSession: string | null;
  examQnum: number | null;
  choices: (string | null)[];
  status: "PUBLISHED" | "REVIEW_REQUIRED";
  flags: string[];
};

export type MhyDiscipline = {
  majorCode: string;
  disciplineCode: string;
  title: string;
};

export type MhySession = { session: string; count: number; majors: number };

export type MhyLesson = {
  id: number;
  mabhas: number;
  title: string;
  json: LessonJson | null;
};

export type LessonJson = {
  lesson_id: string;
  title: string;
  discipline: string;
  topics: {
    topic_id: string;
    title: string;
    content?: string;
    key_points?: string[];
    common_mistakes?: string[];
    regulation_refs?: { mabhas: number; band?: string; note?: string }[];
  }[];
};

export type MhyBand = {
  id: number;
  band: string;
  title: string | null;
  page: number | null;
  line: number | null;
  text: string | null;
};

export type Bootstrap = {
  stats: {
    questions: number;
    official: number;
    authored: number;
    reviewRequired: number;
    disciplines: number;
    sessions: number;
    regulationBandTexts: number;
    lessons: number;
  };
  disciplines: MhyDiscipline[];
  sessions: MhySession[];
  mabhasWithRegulation: number[];
  mabhasIndex: { mabhas: number; questions: number; official: number; topics: string[] }[];
};

export type ContentData = {
  stats: Bootstrap["stats"];
  disciplines: MhyDiscipline[];
  sessions: MhySession[];
  questions: MhyQuestion[];
  lessons: MhyLesson[];
};

export type ContentStore = ContentData & {
  regulations: Record<string, MhyBand[]>;
};

export function createStore(content: ContentData, regulations: Record<string, MhyBand[]>): ContentStore {
  return { ...content, regulations };
}

export function getBootstrap(s: ContentStore): Bootstrap {
  const mabhasIndex = new Map<number, { questions: number; official: number; topics: Set<string> }>();
  for (const q of s.questions) {
    if (q.mabhas == null) continue;
    const e = mabhasIndex.get(q.mabhas) ?? { questions: 0, official: 0, topics: new Set<string>() };
    e.questions++;
    if (q.sourceType === "OFFICIAL_EXAM") e.official++;
    if (q.topic) e.topics.add(q.topic);
    mabhasIndex.set(q.mabhas, e);
  }
  return {
    stats: s.stats,
    disciplines: s.disciplines,
    sessions: s.sessions,
    mabhasWithRegulation: Object.keys(s.regulations)
      .map(Number)
      .sort((a, b) => a - b),
    mabhasIndex: [...mabhasIndex.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([mabhas, v]) => ({ mabhas, questions: v.questions, official: v.official, topics: [...v.topics].slice(0, 40) })),
  };
}

export type QuestionFilter = {
  major?: string; // discipline/major code
  mabhas?: number;
  sourceType?: "OFFICIAL_EXAM" | "AUTHORED" | "ALL";
  difficulty?: ("easy" | "medium" | "hard")[];
  session?: string;
  onlyUnsolved?: boolean;
  ids?: number[];
  limit?: number;
  offset?: number;
  topics?: string[];
};

// Exact mirror of the /api/mhy/questions route parsing (single source of truth)
export function parseQuestionFilter(sp: URLSearchParams): QuestionFilter {
  return {
    major: sp.get("major") ?? undefined,
    mabhas: sp.get("mabhas") ? Number(sp.get("mabhas")) : undefined,
    sourceType: (sp.get("sourceType") as QuestionFilter["sourceType"]) ?? undefined,
    session: sp.get("session") ?? undefined,
    difficulty: sp.get("difficulty") ? (sp.get("difficulty")!.split(",") as QuestionFilter["difficulty"]) : undefined,
    ids: sp.get("ids") ? sp.get("ids")!.split(",").map(Number) : undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 20,
    offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
  };
}

export function queryQuestions(s: ContentStore, f: QuestionFilter): { total: number; items: MhyQuestion[] } {
  let items = s.questions;
  if (f.ids) {
    const set = new Set(f.ids);
    items = items.filter((q) => set.has(q.id));
    const order = new Map(f.ids.map((id, i) => [id, i]));
    items = [...items].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }
  if (f.major) items = items.filter((q) => q.major === f.major);
  if (f.mabhas != null) items = items.filter((q) => q.mabhas === f.mabhas);
  if (f.sourceType && f.sourceType !== "ALL") items = items.filter((q) => q.sourceType === f.sourceType);
  if (f.difficulty?.length) items = items.filter((q) => f.difficulty!.includes(q.difficulty));
  if (f.session) items = items.filter((q) => q.examSession === f.session);
  if (f.topics?.length) items = items.filter((q) => f.topics!.some((t) => q.topic.includes(t)));
  const total = items.length;
  const offset = f.offset ?? 0;
  const limit = f.limit ?? 20;
  return { total, items: items.slice(offset, offset + limit) };
}

export function getQuestion(s: ContentStore, id: number): MhyQuestion | null {
  return s.questions.find((q) => q.id === id) ?? null;
}

export function getQuestionsByIds(s: ContentStore, ids: number[]): MhyQuestion[] {
  const map = new Map(s.questions.map((q) => [q.id, q]));
  return ids.map((id) => map.get(id)).filter(Boolean) as MhyQuestion[];
}

export function getRegulationMabhas(s: ContentStore, mabhas: number): { mabhas: number; bands: MhyBand[] } | null {
  const bands = s.regulations[String(mabhas)];
  if (!bands) return null;
  return { mabhas, bands };
}

export function getLesson(s: ContentStore, mabhas: number): MhyLesson | null {
  return s.lessons.find((l) => l.mabhas === mabhas) ?? null;
}

export function getLessons(s: ContentStore): { mabhas: number; title: string; topics: number }[] {
  return s.lessons.map((l) => ({
    mabhas: l.mabhas,
    title: l.title,
    topics: l.json?.topics?.length ?? 0,
  }));
}

export type SearchHit =
  | { kind: "regulation"; mabhas: number; band: string; title: string | null; snippet: string; page: number | null }
  | { kind: "question"; id: number; text: string; sourceType: string; session: string | null; topic: string }
  | { kind: "lesson"; mabhas: number; title: string; topic: string };

export function globalSearch(s: ContentStore, q: string, limitPerKind = 8): SearchHit[] {
  const term = q.trim();
  if (term.length < 2) return [];
  const hits: SearchHit[] = [];
  // regulations first (the trust layer)
  let regCount = 0;
  outer: for (const m of Object.keys(s.regulations).sort()) {
    for (const b of s.regulations[m]) {
      const hay = `${b.title ?? ""} ${b.band} ${b.text ?? ""}`;
      if (hay.includes(term)) {
        const text = b.text ?? "";
        const idx = text.indexOf(term);
        const snippet = idx >= 0 ? text.slice(Math.max(0, idx - 40), idx + 80) : (b.title ?? b.band);
        hits.push({
          kind: "regulation",
          mabhas: Number(m),
          band: b.band,
          title: b.title,
          snippet,
          page: b.page,
        });
        if (++regCount >= limitPerKind) break outer;
      }
    }
  }
  // questions
  let qCount = 0;
  for (const q2 of s.questions) {
    if (q2.text.includes(term) || q2.topic.includes(term)) {
      hits.push({
        kind: "question",
        id: q2.id,
        text: q2.text.slice(0, 90),
        sourceType: q2.sourceType,
        session: q2.examSession,
        topic: q2.topic,
      });
      if (++qCount >= limitPerKind) break;
    }
  }
  // lessons
  for (const l of s.lessons) {
    if ((l.title ?? "").includes(term)) {
      hits.push({ kind: "lesson", mabhas: l.mabhas, title: l.title, topic: l.json?.topics?.[0]?.title ?? "" });
      if (hits.length > limitPerKind * 3) break;
    }
  }
  return hits;
}

// related questions — data-driven via shared mabhas/topic/band (§25)
export function relatedQuestions(s: ContentStore, id: number, limit = 6): MhyQuestion[] {
  const q = getQuestion(s, id);
  if (!q) return [];
  const sameBand = q.citation.band
    ? s.questions.filter((x) => x.id !== id && x.mabhas === q.mabhas && x.citation.band === q.citation.band)
    : [];
  const sameTopic = s.questions.filter((x) => x.id !== id && x.topic === q.topic && !sameBand.includes(x));
  const sameMabhas = s.questions.filter(
    (x) => x.id !== id && x.mabhas === q.mabhas && !sameBand.includes(x) && !sameTopic.includes(x)
  );
  return [...sameBand, ...sameTopic, ...sameMabhas].slice(0, limit);
}
