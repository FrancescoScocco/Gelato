import fs from "fs";

const src = fs.readFileSync("C:/Gelateria/_legacy/b2b/b2b.css", "utf8");
const prefixes = [".b2b-app", ".thanks-page"];

function transform(css) {
  let i = 0;
  let out = "";
  const n = css.length;

  function skipWs() {
    while (i < n && /\s/.test(css[i])) {
      out += css[i];
      i += 1;
    }
  }

  function readComment() {
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      out += css.slice(i, end < 0 ? n : end + 2);
      i = end < 0 ? n : end + 2;
      return true;
    }
    return false;
  }

  function readBlock() {
    if (css[i] !== "{") return "";
    let depth = 0;
    const start = i;
    for (; i < n; i += 1) {
      if (css.startsWith("/*", i)) {
        const end = css.indexOf("*/", i + 2);
        i = end < 0 ? n - 1 : end + 1;
        continue;
      }
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          return css.slice(start, i);
        }
      }
    }
    return css.slice(start);
  }

  function prefixSelectorList(sel) {
    return sel
      .split(",")
      .map((part) => {
        const s = part.trim();
        if (!s) return "";
        if (s.startsWith(prefixes[0]) || s.startsWith(prefixes[1])) return s;
        if (s === "body" || s === "html") return prefixes.join(", ");
        if (s.startsWith("body ") || s.startsWith("html ")) {
          const rest = s.replace(/^(body|html)\s+/, "");
          return prefixes.map((p) => `${p} ${rest}`).join(", ");
        }
        return prefixes.map((p) => `${p} ${s}`).join(", ");
      })
      .filter(Boolean)
      .join(",\n");
  }

  function processRules(stopAtBraceClose = false) {
    while (i < n) {
      skipWs();
      if (i >= n) break;
      if (stopAtBraceClose && css[i] === "}") return;
      if (readComment()) continue;

      if (css[i] === "@") {
        const start = i;
        while (i < n && css[i] !== "{" && css[i] !== ";") i += 1;
        const header = css.slice(start, i);
        out += header;
        if (css[i] === ";") {
          out += ";";
          i += 1;
          continue;
        }
        if (css[i] !== "{") continue;
        const isKeyframes = /@keyframes/i.test(header);
        const isFontFace = /@font-face/i.test(header);
        out += "{";
        i += 1;
        if (isKeyframes || isFontFace) {
          let depth = 1;
          while (i < n && depth > 0) {
            if (css.startsWith("/*", i)) {
              const end = css.indexOf("*/", i + 2);
              out += css.slice(i, end < 0 ? n : end + 2);
              i = end < 0 ? n : end + 2;
              continue;
            }
            out += css[i];
            if (css[i] === "{") depth += 1;
            else if (css[i] === "}") depth -= 1;
            i += 1;
          }
        } else {
          processRules(true);
          if (css[i] === "}") {
            out += "}";
            i += 1;
          }
        }
        continue;
      }

      const selStart = i;
      while (i < n) {
        if (css.startsWith("/*", i)) {
          const end = css.indexOf("*/", i + 2);
          i = end < 0 ? n : end + 2;
          continue;
        }
        if (css[i] === "{") break;
        if (css[i] === "}" && stopAtBraceClose) break;
        i += 1;
      }
      const selector = css.slice(selStart, i).trim();
      if (!selector) {
        if (stopAtBraceClose && css[i] === "}") return;
        i += 1;
        continue;
      }
      if (selector.startsWith(":root")) out += selector;
      else out += prefixSelectorList(selector);
      out += readBlock();
    }
  }

  processRules(false);
  return out;
}

const out = transform(src);
fs.writeFileSync("C:/Gelateria/src/styles/b2b.css", out);
console.log("ok", out.length, "chars", (out.match(/\.b2b-app/g) || []).length, "prefixes");
