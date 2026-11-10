import fs from "fs";

const i18nSrc = fs.readFileSync("C:/Gelateria/_legacy/js/i18n.js", "utf8");
const start = i18nSrc.indexOf("var messages = ");
const norm = i18nSrc.indexOf("function normalize");
if (start < 0 || norm < 0) {
  console.error("fail i18n", start, norm);
  process.exit(1);
}
const end = i18nSrc.lastIndexOf("};", norm) + 1;
let obj = i18nSrc.slice(start + "var messages = ".length, end);
obj = obj.replace(/^\s*it:/m, '  "it":').replace(/^\s*en:/m, '  "en":');
fs.mkdirSync("C:/Gelateria/src/i18n", { recursive: true });
fs.mkdirSync("C:/Gelateria/src/styles", { recursive: true });
const out =
  'export type Lang = "pt-BR" | "it" | "en";\n\n' +
  "export const homeMessages: Record<Lang, Record<string, string>> = " +
  obj +
  ";\n";
fs.writeFileSync("C:/Gelateria/src/i18n/homeMessages.ts", out);
console.log("homeMessages", out.length);

const html = fs.readFileSync("C:/Gelateria/_legacy/index.html", "utf8");
const s = html.indexOf("<style>") + 7;
const e = html.indexOf("</style>", s);
fs.writeFileSync("C:/Gelateria/src/styles/home.css", html.slice(s, e).trim() + "\n");
console.log("home.css", e - s);

fs.copyFileSync("C:/Gelateria/_legacy/b2b/b2b.css", "C:/Gelateria/src/styles/b2b.css");
console.log("b2b.css ok");

const lab = fs.readFileSync("C:/Gelateria/_legacy/lab/analytics/index.html", "utf8");
const ls = lab.indexOf("<style>") + 7;
const le = lab.indexOf("</style>", ls);
fs.writeFileSync("C:/Gelateria/src/styles/lab.css", lab.slice(ls, le).trim() + "\n");
console.log("lab.css", le - ls);

const copySrc = fs.readFileSync("C:/Gelateria/_legacy/js/b2b/copy.js", "utf8");
const pushStart = copySrc.indexOf("window.GelatoI18nPacks.push(");
const packStart = copySrc.indexOf("{", pushStart);
// find matching close of push( ... );
let depth = 0;
let packEnd = -1;
for (let i = packStart; i < copySrc.length; i++) {
  const ch = copySrc[i];
  if (ch === "{") depth++;
  if (ch === "}") {
    depth--;
    if (depth === 0) {
      packEnd = i + 1;
      break;
    }
  }
}
let pack = copySrc.slice(packStart, packEnd);
pack = pack.replace(/^\s*it:/m, '  "it":').replace(/^\s*en:/m, '  "en":');
const b2bOut =
  'import type { Lang } from "./homeMessages";\n\n' +
  "export const b2bMessages: Record<Lang, Record<string, string>> = " +
  pack +
  ";\n";
fs.writeFileSync("C:/Gelateria/src/i18n/b2bMessages.ts", b2bOut);
console.log("b2bMessages", b2bOut.length);
