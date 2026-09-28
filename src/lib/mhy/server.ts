import fs from "fs";
import path from "path";
import {
  createStore,
  getBootstrap as coreBootstrap,
  queryQuestions as coreQueryQuestions,
  parseQuestionFilter,
  getQuestion as coreGetQuestion,
  getQuestionsByIds as coreGetQuestionsByIds,
  getRegulationMabhas as coreGetRegulationMabhas,
  getLesson as coreGetLesson,
  getLessons as coreGetLessons,
  globalSearch as coreGlobalSearch,
  relatedQuestions as coreRelatedQuestions,
  type ContentStore,
  type QuestionFilter,
  type Bootstrap,
  type MhyQuestion,
  type MhyBand,
} from "./content-core";

// ─── Server-side content layer — reads the REAL exported DB content ───
// Source: assets_db_mohandes_yar_server.db (extracted from the actual APK v1.0.0)
// Exported by scripts/export_content.py → db/content.json + db/regulations.json
// All query semantics live in content-core.ts (isomorphic — shared with the client data layer).

export type {
  MhyQuestion,
  MhyDiscipline,
  MhySession,
  MhyLesson,
  LessonJson,
  MhyBand,
  Bootstrap,
  QuestionFilter,
} from "./content-core";
export type { SearchHit } from "./content-core";

let storeCache: ContentStore | null = null;

function store(): ContentStore {
  if (storeCache) return storeCache;
  const content = JSON.parse(fs.readFileSync(path.join(process.cwd(), "db", "content.json"), "utf8"));
  const regulations = JSON.parse(fs.readFileSync(path.join(process.cwd(), "db", "regulations.json"), "utf8"));
  storeCache = createStore(content, regulations);
  return storeCache;
}

export function getBootstrap(): Bootstrap {
  return coreBootstrap(store());
}

export function queryQuestions(f: QuestionFilter): { total: number; items: MhyQuestion[] } {
  return coreQueryQuestions(store(), f);
}

export function parseQuestionsSearchParams(sp: URLSearchParams): QuestionFilter {
  return parseQuestionFilter(sp);
}

export function getQuestion(id: number): MhyQuestion | null {
  return coreGetQuestion(store(), id);
}

export function getQuestionsByIds(ids: number[]): MhyQuestion[] {
  return coreGetQuestionsByIds(store(), ids);
}

export function getRegulationMabhas(mabhas: number): { mabhas: number; bands: MhyBand[] } | null {
  return coreGetRegulationMabhas(store(), mabhas);
}

export function getLesson(mabhas: number) {
  return coreGetLesson(store(), mabhas);
}

export function getLessons() {
  return coreGetLessons(store());
}

export function globalSearch(q: string, limitPerKind = 8) {
  return coreGlobalSearch(store(), q, limitPerKind);
}

// related questions — data-driven via shared mabhas/topic/band (§25)
export function relatedQuestions(id: number, limit = 6): MhyQuestion[] {
  return coreRelatedQuestions(store(), id, limit);
}
