// Garde-fou TDD (règle n°4 de CLAUDE.md) : aucun test sauté, focalisé ou ignoré.
// En Node pour tourner à l'identique en local et en CI, sur tous les OS.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["src", "tests", "src-tauri/src", "src-tauri/tests"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".rs"]);

const TS_PATTERNS = [
  /\b(?:it|test|describe|bench|suite)(?:\s*\.\s*\w+)*\s*\.\s*(?:only|skip|skipIf|runIf|todo)\b/,
  /\b(?:it|test|describe|suite)\s*\[\s*["'](?:only|skip|skipIf|runIf|todo)["']\s*\]/,
  /(?<![\w.])(?:xit|xtest|xdescribe|fit|fdescribe)\s*\(/,
];
// Rust : recherche sur le fichier entier, car rustfmt peut couper un attribut sur plusieurs lignes.
const RUST_PATTERNS = [
  /#\s*\[\s*ignore\b/g,
  /#\s*\[\s*cfg_attr\s*\([^\]]*\bignore\b/g,
  // `#[cfg(any())]` ou `#[cfg(FALSE)]` retirent un test de la compilation sans le signaler.
  /#\s*\[\s*cfg\s*\(\s*(?:any\s*\(\s*\)|FALSE|false)\s*\)\s*\]/g,
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(name))) yield path;
  }
}

const violations = [];
for (const root of ROOTS.filter((r) => existsSync(r))) {
  for (const file of walk(root)) {
    const content = readFileSync(file, "utf8");
    if (file.endsWith(".rs")) {
      for (const pattern of RUST_PATTERNS) {
        for (const match of content.matchAll(pattern)) {
          const line = content.slice(0, match.index).split("\n").length;
          violations.push(`${file}:${line}: ${match[0].replace(/\s+/g, " ")}`);
        }
      }
    } else {
      content.split(/\r?\n/).forEach((line, i) => {
        if (TS_PATTERNS.some((p) => p.test(line)))
          violations.push(`${file}:${i + 1}: ${line.trim()}`);
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Test sauté, focalisé ou ignoré détecté (règle TDD n°4) :");
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log("check:tdd — aucun test sauté, focalisé ou ignoré.");
