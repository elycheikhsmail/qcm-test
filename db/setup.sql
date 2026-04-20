-- Sprint 1 — Création de la base et de l'utilisateur applicatif
-- À exécuter UNE FOIS avec le superutilisateur postgres.
-- Le script Bun `scripts/db-setup.ts` s'en charge :
--   QCM_APP_PASSWORD=... bun run db:setup
--
-- Le mot de passe est injecté via la variable psql :app_password
-- (cf. spawnSync ... "-v", `app_password=...`).

\set ON_ERROR_STOP on

-- 1. Rôle applicatif — créé seulement s'il n'existe pas
SELECT format('CREATE ROLE qcm_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qcm_app')\gexec

-- 2. Base — CREATE DATABASE ne supporte pas IF NOT EXISTS, on teste avant
SELECT 'CREATE DATABASE qcm_db OWNER qcm_app ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'qcm_db')\gexec

-- 3. Privilèges
GRANT ALL PRIVILEGES ON DATABASE qcm_db TO qcm_app;
