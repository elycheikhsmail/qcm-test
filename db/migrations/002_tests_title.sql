-- Sprint 9: ajoute un titre optionnel aux tests
ALTER TABLE tests ADD COLUMN IF NOT EXISTS title TEXT;
