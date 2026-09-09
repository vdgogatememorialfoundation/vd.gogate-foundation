// Fails if mr/hi are missing keys present in en (keeps translations in sync).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "messages");
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const en = new Set(flat(JSON.parse(readFileSync(join(dir, "en.json"), "utf8"))));
let bad = 0;
for (const l of ["mr", "hi"]) {
  const keys = new Set(flat(JSON.parse(readFileSync(join(dir, `${l}.json`), "utf8"))));
  for (const k of en) if (!keys.has(k)) (console.error(`[i18n] ${l}.json missing ${k}`), bad++);
  for (const k of keys) if (!en.has(k)) (console.error(`[i18n] ${l}.json has extra ${k}`), bad++);
}
if (bad) process.exit(1);
console.log(`[i18n] ${en.size} keys in sync across ${["en", "mr", "hi"].join(", ")}`);
