// ─── Client data layer — single interface, two modes ───
// 1. Server mode (dev / Node deploy): proxies the /api/mhy/* routes (unchanged behavior)
// 2. Static mode (GitHub Pages demo): loads /data/*.json once and runs the SAME
//    isomorphic query core (content-core.ts) in the browser — fully serverless.
//
// Response shapes are identical to the API routes in both modes.

import * as core from "./content-core";
import type { Bootstrap, MhyQuestion, QuestionFilter, SearchHit, MhyBand, MhyLesson } from "./content-core";

const STATIC = process.env.NEXT_PUBLIC_DATA_MODE === "static";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

let storeP: Promise<core.ContentStore> | null = null;

function store(): Promise<core.ContentStore> {
  if (!storeP) {
    storeP = Promise.all([
      fetch(`${BASE}/data/content.json`).then((r) => {
        if (!r.ok) throw new Error("content.json load failed");
        return r.json();
      }),
      fetch(`${BASE}/data/regulations.json`).then((r) => {
        if (!r.ok) throw new Error("regulations.json load failed");
        return r.json();
      }),
    ]).then(([content, regulations]) => core.createStore(content, regulations));
  }
  return storeP;
}

async function fetchJson(url: string): Promise<unknown> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

type QParams = string | URLSearchParams | Partial<QuestionFilter>;

function toSP(p: QParams): URLSearchParams {
  if (typeof p === "string") return new URLSearchParams(p);
  if (p instanceof URLSearchParams) return p;
  const sp = new URLSearchParams();
  if (p.major) sp.set("major", p.major);
  if (p.mabhas != null) sp.set("mabhas", String(p.mabhas));
  if (p.sourceType) sp.set("sourceType", p.sourceType);
  if (p.session) sp.set("session", p.session);
  if (p.difficulty?.length) sp.set("difficulty", p.difficulty.join(","));
  if (p.ids?.length) sp.set("ids", p.ids.join(","));
  if (p.limit != null) sp.set("limit", String(p.limit));
  if (p.offset != null) sp.set("offset", String(p.offset));
  if (p.topics?.length) sp.set("topics", p.topics.join(","));
  return sp;
}

export type RelatedItem = {
  id: number;
  text: string;
  sourceType: string;
  examSession: string | null;
  topic: string;
  mabhas: number | null;
};

export const api = {
  async bootstrap(): Promise<Bootstrap> {
    if (STATIC) return core.getBootstrap(await store());
    return fetchJson(`${BASE}/api/mhy/bootstrap`) as Promise<Bootstrap>;
  },

  async questions(params: QParams): Promise<{ total: number; items: MhyQuestion[] }> {
    const sp = toSP(params);
    if (STATIC) return core.queryQuestions(await store(), core.parseQuestionFilter(sp));
    const qs = sp.toString();
    return fetchJson(`${BASE}/api/mhy/questions${qs ? `?${qs}` : ""}`) as Promise<{ total: number; items: MhyQuestion[] }>;
  },

  /** Multi-competency pool (§9.4): fetch per real major code in parallel and merge —
   *  works identically in server and static modes without touching API semantics. */
  async questionsForMajors(
    majors: string[],
    params: Partial<QuestionFilter> = {}
  ): Promise<{ total: number; items: MhyQuestion[] }> {
    const list = majors.filter(Boolean);
    if (list.length <= 1) {
      const p = { ...params } as Record<string, unknown>;
      if (list.length) p.major = list[0];
      return this.questions(p as QParams);
    }
    const results = await Promise.all(list.map((m) => this.questions({ ...params, major: m })));
    // merge: dedupe by id (rows belong to exactly one major, but stay safe), sum totals
    const seen = new Set<number>();
    const items: MhyQuestion[] = [];
    for (const r of results) {
      for (const q of r.items ?? []) {
        if (!seen.has(q.id)) {
          seen.add(q.id);
          items.push(q);
        }
      }
    }
    // limit applies to the merged pool, not per-major — otherwise runs sized N
    // silently grow to N × majors (real bug found by QA)
    const lim = Number(params.limit ?? 0);
    const merged = lim > 0 ? items.slice(0, lim) : items;
    return { total: results.reduce((s, r) => s + (r.total ?? 0), 0), items: merged };
  },

  async question(id: number): Promise<{ question: MhyQuestion; related: RelatedItem[] }> {
    if (STATIC) {
      const s = await store();
      const q = core.getQuestion(s, id);
      if (!q) throw new Error("not found");
      return {
        question: q,
        related: core.relatedQuestions(s, id).map((r) => ({
          id: r.id,
          text: r.text.slice(0, 80),
          sourceType: r.sourceType,
          examSession: r.examSession,
          topic: r.topic,
          mabhas: r.mabhas,
        })),
      };
    }
    return fetchJson(`${BASE}/api/mhy/question?id=${id}`) as Promise<{ question: MhyQuestion; related: RelatedItem[] }>;
  },

  async regulations(mabhas: number): Promise<{ mabhas: number; bands: MhyBand[] }> {
    if (STATIC) {
      const r = core.getRegulationMabhas(await store(), mabhas);
      if (!r) throw new Error("no regulation text for this mabhas");
      return r;
    }
    return fetchJson(`${BASE}/api/mhy/regulations?mabhas=${mabhas}`) as Promise<{ mabhas: number; bands: MhyBand[] }>;
  },

  async lesson(mabhas: number): Promise<{ lesson: MhyLesson | null }> {
    if (STATIC) return { lesson: core.getLesson(await store(), mabhas) };
    return fetchJson(`${BASE}/api/mhy/lesson?mabhas=${mabhas}`) as Promise<{ lesson: MhyLesson | null }>;
  },

  async lessons(): Promise<{ lessons: { mabhas: number; title: string; topics: number }[] }> {
    if (STATIC) return { lessons: core.getLessons(await store()) };
    return fetchJson(`${BASE}/api/mhy/lessons`) as Promise<{ lessons: { mabhas: number; title: string; topics: number }[] }>;
  },

  async search(q: string): Promise<{ hits: SearchHit[] }> {
    if (STATIC) return { hits: core.globalSearch(await store(), q) };
    return fetchJson(`${BASE}/api/mhy/search?q=${encodeURIComponent(q)}`) as Promise<{ hits: SearchHit[] }>;
  },
};
