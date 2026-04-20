/**
 * export-diagrams.ts
 * Lit les fichiers .puml dans spec/uml/, génère les SVG via plantuml.com
 * et les sauvegarde dans spec/diagrams/
 *
 * Usage : bun run export-diagrams
 */

import { deflateRawSync } from "zlib";
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

// ─── Encodage PlantUML ────────────────────────────────────────────────────────

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

function encode6bit(b: number): string {
  return ALPHABET[b & 0x3f];
}

function append3bytes(b1: number, b2: number, b3: number): string {
  return (
    encode6bit(b1 >> 2) +
    encode6bit(((b1 & 0x3) << 4) | (b2 >> 4)) +
    encode6bit(((b2 & 0xf) << 2) | (b3 >> 6)) +
    encode6bit(b3 & 0x3f)
  );
}

function encodePlantUML(text: string): string {
  const data = Buffer.from(text, "utf-8");
  const compressed = deflateRawSync(data, { level: 9 });
  let result = "";
  let i = 0;
  while (i < compressed.length) {
    result += append3bytes(
      compressed[i] ?? 0,
      compressed[i + 1] ?? 0,
      compressed[i + 2] ?? 0
    );
    i += 3;
  }
  return result;
}

// ─── Téléchargement SVG ───────────────────────────────────────────────────────

async function downloadSVG(encoded: string): Promise<string> {
  const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.text();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dir, "..");
const UML_DIR = join(ROOT, "spec", "uml");
const OUTPUT_DIR = join(ROOT, "spec", "diagrams");

mkdirSync(OUTPUT_DIR, { recursive: true });

const pumlFiles = readdirSync(UML_DIR).filter((f) => f.endsWith(".puml"));
console.log(`🔍 ${pumlFiles.length} fichier(s) .puml trouvé(s) dans spec/uml/\n`);

for (const file of pumlFiles) {
  const name = basename(file, ".puml");
  process.stdout.write(`⏳ ${name} ... `);
  try {
    const code = readFileSync(join(UML_DIR, file), "utf-8");
    const encoded = encodePlantUML(code);
    const svg = await downloadSVG(encoded);
    writeFileSync(join(OUTPUT_DIR, `${name}.svg`), svg, "utf-8");
    console.log(`✅ spec/diagrams/${name}.svg`);
  } catch (err) {
    console.log(`❌ ${(err as Error).message}`);
  }
}

console.log(`\n✨ Terminé — images dans spec/diagrams/`);
