// CLI wrapper pour créer un magic link via POST /api/magic-links
// Usage :
//   bun --env-file=.env.local run scripts/generate-magic-link.ts
//   bun --env-file=.env.local run scripts/generate-magic-link.ts --expires-in 48 --max-uses 30
//   bun --env-file=.env.local run scripts/generate-magic-link.ts --level-id 2 --classe-id 3
export {};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("❌  ADMIN_TOKEN non défini dans .env.local");
  process.exit(1);
}

// --- Parse args simples --key value ---
const args = process.argv.slice(2);
function getArg(key: string): string | undefined {
  const i = args.indexOf(key);
  return i !== -1 ? args[i + 1] : undefined;
}

const body: Record<string, number> = {};
const expiresIn = getArg("--expires-in");
const maxUses = getArg("--max-uses");
const levelId = getArg("--level-id");
const classeId = getArg("--classe-id");

if (expiresIn) body.expires_in = Number(expiresIn);
if (maxUses) body.max_uses = Number(maxUses);
if (levelId) body.level_id = Number(levelId);
if (classeId) body.classe_id = Number(classeId);

// --- Appel API ---
const res = await fetch(`${BASE_URL}/api/magic-links`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-token": ADMIN_TOKEN,
  },
  body: JSON.stringify(body),
});

const json = await res.json();

if (!res.ok) {
  console.error(`❌  Erreur ${res.status}: ${json.error}`);
  process.exit(1);
}

const { token, url, expires_at, max_uses: mu } = json.data;
const fullUrl = `${BASE_URL}/?token=${token}`;

console.log("\n✅  Magic link créé :\n");
console.log(`  Token      : ${token}`);
console.log(`  URL élève  : ${fullUrl}`);
console.log(`  Expire le  : ${new Date(expires_at).toLocaleString("fr-FR")}`);
console.log(`  Max uses   : ${mu}`);
console.log();
