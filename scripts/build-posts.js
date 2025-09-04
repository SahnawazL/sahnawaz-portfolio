// scripts/build-posts.js
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const repoRoot = path.join(__dirname, "..");
const postsDir = path.join(repoRoot, "posts");
const docsDir = path.join(repoRoot, "docs");
const templatesDir = path.join(repoRoot, "templates");
const templatePath = path.join(templatesDir, "post_template.html");

// --- sanity checks
if (!fs.existsSync(postsDir)) {
  console.error(`❌ posts folder not found at ${postsDir}`);
  process.exit(1);
}

// ensure docs exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
  console.log(`Created docs folder: ${docsDir}`);
}

// load template (fallback to minimal template if missing)
let template = null;
if (fs.existsSync(templatePath)) {
  template = fs.readFileSync(templatePath, "utf8");
  console.log(`Loaded template: ${templatePath}`);
} else {
  // minimal fallback template with placeholders: {{title}} {{date}} {{content}}
  template = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{{title}}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>{{title}}</h1>
    <p><em>Published on {{date}}</em></p>
    <nav><a href="./index.html">Blog index</a> · <a href="../">Home</a></nav>
    <hr/>
  </header>
  <main>
    {{content}}
  </main>
</body>
</html>`;
  console.log("Using fallback template (no templates/post_template.html found).");
}

// read posts
const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));
if (files.length === 0) {
  console.log("No markdown posts found in posts/ — nothing to build.");
}

// collect metadata for index
const postsMeta = [];

for (const file of files) {
  const filePath = path.join(postsDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const title = data.title || path.basename(file, ".md");
  const date = data.date || new Date().toISOString().split("T")[0];
  const htmlBody = marked(content);

  const pageHtml = template
    .replace(/{{title}}/g, escapeHtml(title))
    .replace(/{{date}}/g, escapeHtml(date))
    .replace(/{{content}}/g, htmlBody);

  // output filename: example.md -> example.html placed into /docs
  const outName = file.replace(/\.md$/i, ".html");
  const outPath = path.join(docsDir, outName);
  fs.writeFileSync(outPath, pageHtml, "utf8");
  console.log(`✅ Generated ${path.relative(repoRoot, outPath)}`);

  postsMeta.push({ title, date, outName });
}

// generate docs/index.html (simple list, newest first)
postsMeta.sort((a,b) => (a.date < b.date ? 1 : -1));
const listItems = postsMeta.map(p => `<li><a href="${encodeURI(p.outName)}">${escapeHtml(p.title)}</a> <small>${escapeHtml(p.date)}</small></li>`).join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header><h1>My Blog</h1><nav><a href="../">Home</a></nav><hr/></header>
  <main>
    <ul>
      ${listItems || "<li>No posts yet</li>"}
    </ul>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(docsDir, "index.html"), indexHtml, "utf8");
console.log(`✅ Generated ${path.join("docs","index.html")}`);

// copy common assets if they exist at repo root (style + favicons)
const assets = ["style.css","favicon.ico","favicon-32x32.png","favicon-192x192.png","apple-touch-icon.png"];
for (const a of assets) {
  const src = path.join(repoRoot, a);
  const dst = path.join(docsDir, a);
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`Copied asset ${a} -> docs/`);
    }
  } catch (err) {
    console.warn(`Could not copy asset ${a}: ${err.message}`);
  }
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
