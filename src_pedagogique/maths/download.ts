import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";

const JSON_FILE = join(import.meta.dir, "urls_livres_maths.json");
const OUTPUT_DIR = import.meta.dir;

type Document = {
  titre: string;
  type: string;
  edition: number;
  url: string;
  fichier: string;
  option?: string;
};

type Niveau = {
  niveau: string;
  annee: string;
  code: string;
  documents: Document[];
  note?: string;
};

type UrlsData = {
  livres: Niveau[];
};

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
  const buffer = await res.arrayBuffer();
  await writeFile(destPath, Buffer.from(buffer));
}

function niveauFolder(niveau: string): string {
  if (niveau.startsWith("Fondamental")) return "Fondamental";
  if (niveau.includes("1er cycle")) return "Secondaire_1er_cycle";
  if (niveau.includes("2ème cycle")) return "Secondaire_2eme_cycle";
  return "Autres";
}

async function main() {
  const data: UrlsData = JSON.parse(await Bun.file(JSON_FILE).text());

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const livre of data.livres) {
    if (livre.documents.length === 0) {
      console.log(`⚠️  [${livre.code}] Aucun document – ${livre.note ?? ""}`);
      skipped++;
      continue;
    }

    const folder = join(OUTPUT_DIR, niveauFolder(livre.niveau), livre.code);
    await mkdir(folder, { recursive: true });

    for (const doc of livre.documents) {
      const destPath = join(folder, doc.fichier);
      const label = `[${livre.code}] ${doc.titre}`;

      try {
        process.stdout.write(`⬇️  ${label} ... `);
        await downloadFile(doc.url, destPath);
        console.log(`✅ OK`);
        success++;
      } catch (err) {
        console.log(`❌ ERREUR – ${(err as Error).message}`);
        failed++;
      }
    }
  }

  console.log("\n──────────────────────────────");
  console.log(`✅ Téléchargés : ${success}`);
  console.log(`⚠️  Ignorés    : ${skipped}`);
  console.log(`❌ Échoués    : ${failed}`);
}

await main();
