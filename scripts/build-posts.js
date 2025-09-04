// scripts/build-posts.js
//
// Converts Markdown posts in /posts into HTML pages
// using the template in /templates/post_template.html

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const POSTS_DIR = path.join(__dirname, "..", "posts");
const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "post_template.html");

// Load template
const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

// Utility: format date as "Sept 5, 2025"
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Collect all .md posts
const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));

// List of posts for index page
let postsList = [];

files.forEach(file => {
  const filePath = path.join(POSTS_DIR, file);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const title = data.title || file.replace(".md", "");
  const date = data.date ? formatDate(data.date) : formatDate(new Date());

  const slug = file.replace(/\\.md$/, "");
  const htmlContent = marked(content);

  // Fill template
  const page = template
    .replace(/{{title}}/g, title)
    .replace(/{{date}}/g, date)
    .replace("{{content}}", htmlContent)
    .replace("{{url}}", `/posts/${slug}/`);

  // Output folder
  const outDir = path.join(POSTS_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page, "utf-8");

  // Collect for index
  postsList.push({ title, date, slug });
});

// Build posts index
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog | Sahnawaz Ahmed Laskar</title>
  <link rel="stylesheet" href="../style.css" />
</head>
<body>
  <header>
    <h1>📰 Blog</h1>
    <nav><a href="../index.html" class="btn">🏠 Home</a></nav>
  </header>
  <main style="max-width:800px;margin:2rem auto;padding:1rem;">
    <ul>
      ${postsList.map(p => `<li><a href="./${p.slug}/">${p.title}</a> <small>(${p.date})</small></li>`).join("")}
    </ul>
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(POSTS_DIR, "index.html"), indexHtml, "utf-8");

console.log("✅ Blog posts built successfully.");
