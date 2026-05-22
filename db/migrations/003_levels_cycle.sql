-- Ajout de la colonne cycle sur la table levels
-- Valeurs : 'fondamental' | 'college' | 'lycee'

ALTER TABLE levels
  ADD COLUMN IF NOT EXISTS cycle TEXT CHECK (cycle IN ('fondamental', 'college', 'lycee'));

-- Affectation des cycles pour les niveaux mauritaniens existants
UPDATE levels SET cycle = 'fondamental' WHERE name IN ('1AF','2AF','3AF','4AF','5AF','6AF');
UPDATE levels SET cycle = 'college'     WHERE name IN ('1AS','2AS','3AS','4AS');
UPDATE levels SET cycle = 'lycee'       WHERE name IN ('5AS','6AS','7AS');
-- Fallback pour les niveaux de test éventuellement présents
UPDATE levels SET cycle = 'fondamental' WHERE cycle IS NULL;

-- Rendre la colonne obligatoire (après backfill)
ALTER TABLE levels ALTER COLUMN cycle SET NOT NULL;
