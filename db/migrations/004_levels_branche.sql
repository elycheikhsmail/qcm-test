-- Ajout de la colonne branche (série) sur la table levels
-- Nullable pour fondamental et collège, valeur parmi C/D/A/O pour lycée.
-- C = Mathématiques | D = Sciences Naturelles | A = Littérature Moderne | O = Littérature Originelle

ALTER TABLE levels
  ADD COLUMN IF NOT EXISTS branche TEXT CHECK (branche IN ('C', 'D', 'A', 'O'));

-- Contrainte croisée : fondamental et collège n'ont pas de branche
ALTER TABLE levels
  ADD CONSTRAINT levels_branche_cycle_check
  CHECK (
    (cycle IN ('fondamental', 'college') AND branche IS NULL) OR
    cycle = 'lycee'
  );
