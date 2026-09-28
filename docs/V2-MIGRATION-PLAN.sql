-- ═══════════════════════════════════════════════════════════════════
-- Mahandesyar V2 — SQLite Schema Extension Plan (Directive §37)
-- Strategy: PRESERVE + EXTEND the existing v7 database.
-- Base schema (already in assets_db_mohandes_yar_server.db):
--   disciplines(major_code, discipline_code, title)
--   questions(id, question_text, major_code, discipline_code, topic,
--             difficulty, correct_choice_index, explanation, question_type,
--             source, mabhas_number, citation_page, citation_mabhas,
--             citation_band, citation_line, citation_quote, answer_source,
--             exam_session, exam_qnum)
--   choices(question_id, choice_index, choice_text)
--   lessons(mabhas_number, lesson_title, lesson_json)
--   mabhas_bands(mabhas, band, title, page, line, text)
-- Nothing below alters existing columns; all changes are additive
-- (safe migration via CREATE TABLE IF NOT EXISTS + backfill).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. User & target-exam model (§6-§8) ──
CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),          -- single local profile
  name TEXT,
  discipline_code TEXT REFERENCES disciplines(discipline_code),
  competency TEXT,                                 -- نظارت/اجرا/طراحی/…
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discipline_code TEXT REFERENCES disciplines(discipline_code),
  competency TEXT,
  label TEXT NOT NULL,                             -- e.g. «مهر ۱۴۰۳»
  exam_date TEXT,                                  -- ISO date; USER-PROVIDED (§8: never hard-code)
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Content verification layer (§16/§57/§74) ──
-- Derived at ingest time from actual data (never manually asserted).
CREATE TABLE IF NOT EXISTS content_verification (
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'PUBLISHED','REVIEW_REQUIRED','DRAFT','IMPORTED','MAPPED',
    'ANSWER_VERIFIED','SOURCE_VERIFIED','REVIEWED',
    'AMBIGUOUS','OUTDATED','SUPERSEDED','REMOVED')),
  flags TEXT,                                      -- JSON array: OPTION_UNREADABLE / NO_ANSWER_KEY / …
  reviewer TEXT,
  reviewed_at TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_cq_status ON content_verification(status);

-- ── 3. Edition awareness (§14) ──
CREATE TABLE IF NOT EXISTS document_editions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mabhas INTEGER NOT NULL,
  edition_label TEXT NOT NULL,                     -- «ویرایش ۱۳۹۹»
  published_year INTEGER,
  is_current INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(mabhas, edition_label)
);

-- Question ↔ edition binding: keeps original edition refs forever
-- (existing citation_* columns stay the authoritative source).
CREATE TABLE IF NOT EXISTS question_edition_refs (
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  edition_id INTEGER NOT NULL REFERENCES document_editions(id),
  PRIMARY KEY (question_id, edition_id)
);

-- ── 4. Content relation graph (§25/§36/§72) ──
CREATE TABLE IF NOT EXISTS question_relations (
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  related_id   INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('same_band','same_topic','same_mabhas','same_exam','similar')),
  weight REAL DEFAULT 1,
  PRIMARY KEY (question_id, related_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_qrel_q ON question_relations(question_id);

-- Clause ↔ Question ↔ Lesson bridges (jump links §13/§24)
CREATE TABLE IF NOT EXISTS band_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mabhas INTEGER NOT NULL,
  band TEXT NOT NULL,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bandlinks_band ON band_links(mabhas, band);

-- ── 5. User progress & practice state (§31/§55) ──
CREATE TABLE IF NOT EXISTS user_answers (
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  choice_index INTEGER,
  is_correct INTEGER,                              -- NULL = answer key unavailable
  answered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  times_wrong INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ua_wrong ON user_answers(is_correct);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,                             -- deterministic id (§58)
  kind TEXT NOT NULL CHECK (kind IN ('OFFICIAL','QUICK','CUSTOM','COMPREHENSIVE')),
  title TEXT,
  session_label TEXT,                              -- for OFFICIAL: exact session
  started_at INTEGER NOT NULL,                     -- epoch ms (timestamp-based timer §89)
  finished_at INTEGER NOT NULL,
  duration_sec INTEGER NOT NULL,
  score_json TEXT NOT NULL                         -- reproducible scoring snapshot (§90)
);

CREATE TABLE IF NOT EXISTS exam_attempt_items (
  attempt_id TEXT NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  choice_index INTEGER,
  is_correct INTEGER,
  flagged INTEGER DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS band_bookmarks (       -- bookmarks on regulation clauses (§55)
  band_row_id INTEGER PRIMARY KEY REFERENCES mabhas_bands(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS review_queue (          -- spaced repetition / mistakes (§32)
  question_id INTEGER PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('mistake','manual','plan')),
  due_at TEXT,
  box INTEGER DEFAULT 0                            -- Leitner box
);

CREATE TABLE IF NOT EXISTS studied_bands (
  band_row_id INTEGER PRIMARY KEY REFERENCES mabhas_bands(id) ON DELETE CASCADE,
  studied_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (         -- daily aggregates for dashboard (§5/§31)
  day TEXT PRIMARY KEY,                            -- YYYY-MM-DD
  answered INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  study_minutes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS roadmap_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discipline_code TEXT,
  competency TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS roadmap_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roadmap_id INTEGER NOT NULL REFERENCES roadmap_instances(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  done INTEGER DEFAULT 0,
  done_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,                              -- session_start/search/exam_finish/…
  payload TEXT,                                    -- anonymized JSON (§76)
  at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_versions (      -- §38 content versioning
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_version TEXT NOT NULL,
  questions_revision INTEGER NOT NULL,
  regulations_revision INTEGER NOT NULL,
  shipped_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_reports (         -- user «گزارش خطا» (§23)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  kind TEXT CHECK (kind IN ('wrong_answer','bad_text','unreadable_option','other')),
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── 6. Search performance (§61/§62) ──
CREATE INDEX IF NOT EXISTS idx_q_major ON questions(major_code);
CREATE INDEX IF NOT EXISTS idx_q_mabhas ON questions(mabhas_number);
CREATE INDEX IF NOT EXISTS idx_q_source ON questions(source);
CREATE INDEX IF NOT EXISTS idx_q_session ON questions(exam_session);
CREATE INDEX IF NOT EXISTS idx_q_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_bands_mabhas ON mabhas_bands(mabhas);

-- FTS5 (evaluate on-device; fallback: LIKE + indexes as in reference impl)
CREATE VIRTUAL TABLE IF NOT EXISTS fts_questions USING fts5(
  question_text, topic, explanation, content='questions', content_rowid='id'
);
CREATE VIRTUAL TABLE IF NOT EXISTS fts_bands USING fts5(
  title, band, text, content='mabhas_bands', content_rowid='id'
);

-- ── Migration notes ──
-- 1. Run inside a transaction; ship with the app as bundled content v8.
-- 2. Backfill content_verification from existing data:
--    flag rules = exactly what scripts/export_content.py implements
--    (OPTION_UNREADABLE / NO_ANSWER_KEY / ANSWER_NEEDS_REVIEW / TEXT_INCOMPLETE).
-- 3. Never rewrite citation_* or exam_session of official questions (§14/§15).
-- 4. user_answers is the ONLY source for scoring/mastery (§90).
