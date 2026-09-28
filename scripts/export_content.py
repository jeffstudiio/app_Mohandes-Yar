#!/usr/bin/env python3
"""
PHASE 0/3 content export — Mahandesyar real content (no fabrication).
Exports the actual SQLite DB content into normalized JSON for the web app.
Verification flags preserved exactly as found in the data (directive §99).
"""
import sqlite3, json, re, os

SRC = '/home/z/my-project/apk_analysis/mohandesyar_v7_real.db'
OUT = '/home/z/my-project/db'
os.makedirs(OUT, exist_ok=True)

db = sqlite3.connect(SRC)
db.row_factory = sqlite3.Row
cur = db.cursor()

def clean(s):
    if s is None: return None
    s = str(s)
    # normalize ZWNJ artifacts and PDF bullets
    s = s.replace('\uf0b7', '•').replace('\u200f', '').replace('\u200e', '')
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip()

# ── disciplines ──
disciplines = []
for r in cur.execute('SELECT major_code, discipline_code, title FROM disciplines ORDER BY id'):
    disciplines.append({'majorCode': r['major_code'], 'disciplineCode': r['discipline_code'], 'title': clean(r['title'])})

# ── exam sessions (official) ──
sessions = []
for r in cur.execute("""SELECT exam_session, COUNT(*) n, COUNT(DISTINCT major_code) majors
                        FROM questions WHERE source='exam' AND exam_session IS NOT NULL
                        GROUP BY exam_session ORDER BY n DESC"""):
    sessions.append({'session': clean(r['exam_session']), 'count': r['n'], 'majors': r['majors']})

# ── questions (with real provenance + verification state) ──
questions = []
UNREADABLE = ('ناخوانا', 'نیازمند بازبینی', 'نیازمند تایید')
qcur = db.cursor()
ccur = db.cursor()
for r in qcur.execute("""SELECT id, question_text, major_code, discipline_code, topic, difficulty,
        correct_choice_index, explanation, question_type, source, mabhas_number,
        citation_page, citation_mabhas, citation_band, citation_line, citation_quote, answer_source,
        exam_session, exam_qnum
        FROM questions ORDER BY id"""):
    qid = r['id']
    choices = [None, None, None, None]
    for c in ccur.execute('SELECT choice_index, choice_text FROM choices WHERE question_id=? ORDER BY choice_index', (qid,)):
        if 0 <= c['choice_index'] <= 3:
            choices[c['choice_index']] = clean(c['choice_text'])
    text = clean(r['question_text'])
    expl = clean(r['explanation'])
    # verification status — derived strictly from actual data content (§16/§99)
    flags = []
    if any(k in (t or '') for t in choices for k in UNREADABLE): flags.append('OPTION_UNREADABLE')
    if r['correct_choice_index'] is None: flags.append('NO_ANSWER_KEY')
    if r['source'] == 'exam' and expl and 'تایید دستی' in expl: flags.append('ANSWER_NEEDS_REVIEW')
    if not text or len(text) < 15: flags.append('TEXT_INCOMPLETE')
    status = 'PUBLISHED' if not flags else 'REVIEW_REQUIRED'
    questions.append({
        'id': qid, 'text': text, 'major': r['major_code'], 'discipline': r['discipline_code'],
        'topic': clean(r['topic']), 'difficulty': r['difficulty'],
        'answer': r['correct_choice_index'], 'explanation': expl,
        'type': r['question_type'], 'sourceType': 'OFFICIAL_EXAM' if r['source'] == 'exam' else 'AUTHORED',
        'mabhas': r['mabhas_number'],
        'citation': {'page': r['citation_page'], 'mabhas': clean(r['citation_mabhas']),
                     'band': clean(r['citation_band']), 'line': r['citation_line'],
                     'quote': clean(r['citation_quote'])},
        'answerSource': r['answer_source'],
        'examSession': clean(r['exam_session']), 'examQnum': r['exam_qnum'],
        'choices': choices, 'status': status, 'flags': flags,
    })

# ── regulations (mabhas_bands, real text) ──
regulations = {}
for r in cur.execute('SELECT id, mabhas, band, title, page, line, text FROM mabhas_bands ORDER BY mabhas, id'):
    m = str(r['mabhas'])
    regulations.setdefault(m, []).append({
        'id': r['id'], 'band': clean(r['band']), 'title': clean(r['title']),
        'page': r['page'], 'line': r['line'], 'text': clean(r['text']) if r['text'] else None,
    })

# ── lessons (structured JSON from DB) ──
lessons = []
for r in cur.execute('SELECT id, mabhas_number, lesson_title, lesson_json FROM lessons ORDER BY mabhas_number'):
    try:
        lj = json.loads(r['lesson_json'])
    except Exception:
        lj = None
    lessons.append({'id': r['id'], 'mabhas': r['mabhas_number'], 'title': clean(r['lesson_title']),
                    'json': lj})

# ── stats ──
stats = {
    'questions': len(questions),
    'official': sum(1 for q in questions if q['sourceType'] == 'OFFICIAL_EXAM'),
    'authored': sum(1 for q in questions if q['sourceType'] == 'AUTHORED'),
    'reviewRequired': sum(1 for q in questions if q['status'] == 'REVIEW_REQUIRED'),
    'disciplines': len(disciplines),
    'sessions': len(sessions),
    'regulationBandTexts': sum(1 for m in regulations.values() for b in m if b['text']),
    'lessons': len(lessons),
}

with open(f'{OUT}/content.json', 'w', encoding='utf8') as f:
    json.dump({'stats': stats, 'disciplines': disciplines, 'sessions': sessions,
               'questions': questions, 'lessons': lessons}, f, ensure_ascii=False, separators=(',', ':'))
with open(f'{OUT}/regulations.json', 'w', encoding='utf8') as f:
    json.dump(regulations, f, ensure_ascii=False, separators=(',', ':'))

print('STATS:', json.dumps(stats, ensure_ascii=False))
print('WROTE: db/content.json (%.1f MB), db/regulations.json (%.1f MB)' % (
    os.path.getsize(f'{OUT}/content.json')/1e6, os.path.getsize(f'{OUT}/regulations.json')/1e6))
