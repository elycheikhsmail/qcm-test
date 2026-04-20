/**
 * migrate-diagrams.ts
 * Migration one-shot :
 *   1. Extrait les blocs PlantUML de spec/spec_projet_v3.md
 *   2. Sauvegarde chaque bloc dans spec/uml/{nom}.puml
 *   3. Remplace chaque bloc dans la spec par une référence image markdown
 *
 * Usage : bun run scripts/migrate-diagrams.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const SPEC_FILE = join(ROOT, "spec", "spec_projet_v3.md");
const UML_DIR = join(ROOT, "spec", "uml");

mkdirSync(UML_DIR, { recursive: true });

let spec = readFileSync(SPEC_FILE, "utf-8");

const BLOCK_RE = /```plantuml\n([\s\S]*?)```/g;
let match: RegExpExecArray | null;
let count = 0;

while ((match = BLOCK_RE.exec(spec)) !== null) {
  const code = match[1].trim();
  const nameMatch = code.match(/@startuml\s+(\S+)/);
  const name = nameMatch ? nameMatch[1] : `diagram_${count + 1}`;

  // Écrire le fichier .puml
  writeFileSync(join(UML_DIR, `${name}.puml`), code + "\n", "utf-8");
  console.log(`✅ spec/uml/${name}.puml`);
  count++;
}

// Remplacer les blocs plantuml par des références image dans la spec
spec = spec.replace(BLOCK_RE, (_, code) => {
  const trimmed = code.trim();
  const nameMatch = trimmed.match(/@startuml\s+(\S+)/);
  const name = nameMatch ? nameMatch[1] : "diagram";
  return `![${name}](diagrams/${name}.svg)`;
});

writeFileSync(SPEC_FILE, spec, "utf-8");
console.log(`\n📝 spec_projet_v3.md mis à jour (${count} blocs remplacés)`);
console.log(`📁 Sources PlantUML dans spec/uml/`);
