const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const postsDir = "posts";          // where your .md files live
const outputDir = ".";             // output HTMLs into repo root

// Check if posts folder exists
if (!fs.existsSync(postsDir)) {
  console.error(`❌ Posts folder not found: ${postsDir}`);
  process.exit(1);
}

// Loop through all .md files
fs.readdirSync(postsDir).forEach((file) => {
  if (file.endsWith(".md")) {
    const filePath = path.join(postsDir, file);
    const mdContent = fs.readFileSync(filePath, "utf-8");

    // Extract front matter (title, date, etc.)
    const { data, content } = matter(mdContent);

    // Convert markdown to HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${data.title || "Untitled Post"}</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <header>
          <h1>${data.title || "Untitled Post"}</h1>
          <p><em>Published on ${data.date || "Unknown date"}</em></p>
        </header>
        <main>
          ${marked(content)}
        </main>
      </body>
      </html>
    `;

    // Save HTML file
    const outFile = file.replace(".md", ".html");
    fs.writeFileSync(path.join(outputDir, outFile), htmlContent);
    console.log(`✅ Built ${outFile}`);
  }
});
