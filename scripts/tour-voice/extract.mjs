// Reads the tour's captions straight from js/tour.js, so the voice clips always
// say exactly the text shown on screen. Prints JSON: [{ i, say }]
import fs from "node:fs";
const src = fs.readFileSync("js/tour.js", "utf8");
const block = src.slice(src.indexOf("var STEPS = ["), src.indexOf("];", src.indexOf("var STEPS = [")));
const says = [...block.matchAll(/say:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
if (says.length < 2) { console.error("tour captions not found"); process.exit(1); }
process.stdout.write(JSON.stringify(says.map((say, i) => ({ i, say }))));
