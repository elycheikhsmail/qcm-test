-- ============================================================
-- QCM Système — Schéma v3 complet
-- Sprint 2 — 2026-04-20
-- Ordre de création : respecte les dépendances FK
-- Idempotent : CREATE TABLE IF NOT EXISTS
-- ============================================================

-- ─── 1. UTILISATEURS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  role         TEXT NOT NULL CHECK (role IN (
                 'admin_tech','admin_ped','enseignant','eleve','directeur','parent'
               )),
  auth_method  TEXT CHECK (auth_method IN ('phone','email','google','magic_link')),
  phone        TEXT UNIQUE,
  email        TEXT UNIQUE,
  google_id    TEXT UNIQUE,
  first_name   TEXT,
  last_name    TEXT,
  password_hash TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. ÉTABLISSEMENTS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS etablissements (
  id      SERIAL PRIMARY KEY,
  nom     TEXT NOT NULL,
  wilaya  TEXT NOT NULL,
  ville   TEXT
);

-- ─── 3. MATIÈRES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('ar','fr')),
  UNIQUE (name, language)
);

-- ─── 4. NIVEAUX ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS levels (
  id      SERIAL PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  "order" SMALLINT NOT NULL
);

-- ─── 5. CHAPITRES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chapters (
  id          SERIAL PRIMARY KEY,
  subject_id  INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  level_id    INT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  UNIQUE (subject_id, level_id, title)
);

-- ─── 6. QUESTIONS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS questions (
  id             SERIAL PRIMARY KEY,
  chapter_id     INT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('qcm','true_false','matching','fill_blank')),
  content        TEXT NOT NULL,
  options        JSONB,
  correct_answer JSONB NOT NULL,
  difficulty     TEXT NOT NULL CHECK (difficulty IN ('facile','moyen','difficile')),
  source         TEXT,
  created_by     TEXT NOT NULL DEFAULT 'claude_code',
  validated      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. CLASSES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classes (
  id               SERIAL PRIMARY KEY,
  etablissement_id INT REFERENCES etablissements(id) ON DELETE SET NULL,
  niveau           TEXT NOT NULL,
  filiere          TEXT,
  nom              TEXT NOT NULL,
  annee_scolaire   TEXT NOT NULL DEFAULT '2025-2026',
  created_by       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nom, annee_scolaire, created_by)
);

-- ─── 8. CLASSE ↔ ENSEIGNANTS (liaison) ───────────────────────

CREATE TABLE IF NOT EXISTS classe_enseignants (
  classe_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enseignant_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (classe_id, enseignant_id)
);

-- ─── 9. CLASSE ↔ ÉLÈVES (liaison + statut) ───────────────────

CREATE TABLE IF NOT EXISTS classe_eleves (
  classe_id  INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  eleve_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','removed')),
  PRIMARY KEY (classe_id, eleve_id)
);

-- ─── 10. DIRECTEUR ↔ CLASSES (liaison) ───────────────────────

CREATE TABLE IF NOT EXISTS directeur_classes (
  directeur_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classe_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (directeur_id, classe_id)
);

-- ─── 11. MAGIC LINKS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS magic_links (
  id          SERIAL PRIMARY KEY,
  token       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by  INT REFERENCES users(id) ON DELETE SET NULL,
  level_id    INT REFERENCES levels(id) ON DELETE SET NULL,
  classe_id   INT REFERENCES classes(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  max_uses    INT NOT NULL DEFAULT 1,
  use_count   INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (use_count <= max_uses)
);

-- ─── 12. TESTS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tests (
  id               SERIAL PRIMARY KEY,
  created_by       INT REFERENCES users(id) ON DELETE SET NULL,
  subject_id       INT REFERENCES subjects(id) ON DELETE SET NULL,
  level_id         INT REFERENCES levels(id) ON DELETE SET NULL,
  chapter_id       INT REFERENCES chapters(id) ON DELETE SET NULL,
  difficulty       TEXT CHECK (difficulty IN ('facile','moyen','difficile')),
  question_count   INT NOT NULL DEFAULT 10,
  time_mode        TEXT NOT NULL DEFAULT 'libre' CHECK (time_mode IN ('libre','chrono','deadline')),
  duration_minutes INT,
  deadline_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. TEST ↔ QUESTIONS (snapshot) ─────────────────────────

CREATE TABLE IF NOT EXISTS test_questions (
  test_id     INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  "order"     SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (test_id, question_id)
);

-- ─── 14. ASSIGNATIONS DE TESTS ───────────────────────────────

CREATE TABLE IF NOT EXISTS test_assignments (
  id          SERIAL PRIMARY KEY,
  test_id     INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('classe','eleve')),
  target_id   INT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (test_id, target_type, target_id)
);

-- ─── 15. SESSIONS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id            SERIAL PRIMARY KEY,
  test_id       INT REFERENCES tests(id) ON DELETE SET NULL,
  eleve_id      INT REFERENCES users(id) ON DELETE SET NULL,
  magic_link_id INT REFERENCES magic_links(id) ON DELETE SET NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at  TIMESTAMPTZ,
  score         INT,
  is_anonymous  BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── 16. RÉPONSES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS answers (
  id           SERIAL PRIMARY KEY,
  session_id   INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id  INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  given_answer JSONB,
  is_correct   BOOLEAN,
  answered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, question_id)
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_questions_chapter   ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_validated  ON questions(validated);
CREATE INDEX IF NOT EXISTS idx_questions_type       ON questions(type);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_level ON chapters(subject_id, level_id);

CREATE INDEX IF NOT EXISTS idx_sessions_eleve      ON sessions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_sessions_test       ON sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_sessions_submitted  ON sessions(submitted_at) WHERE submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_answers_session     ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question    ON answers(question_id);

CREATE INDEX IF NOT EXISTS idx_magic_links_token   ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_test_assignments    ON test_assignments(test_id, target_type, target_id);
