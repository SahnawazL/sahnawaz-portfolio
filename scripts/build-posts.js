const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

// Paths
const postsDir = path.join(__dirname, "../posts");   // where .md files live
const outputDir = path.join(__dirname, "../docs");   // GitHub Pages root

// Make sure /docs exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read each markdown file and convert
fs.readdirSync(postsDir).forEach(file => {
  if (path.extname(file) === ".md") {
    const filePath = path.join(postsDir, file);
    const mdContent = fs.readFileSync(filePath, "utf-8");

    // Parse frontmatter + content
    const { data, content } = matter(mdContent);
    const htmlContent = marked(content);

    // Wrap in a simple HTML page
    const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${data.title || "Untitled"}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>${data.title || "Untitled"}</h1>
  <p><em>Published on ${data.date || "Unknown"}</em></p>
  <div>${htmlContent}</div>
</body>
</html>
`;

    // Save as .html in /docs
    const outFile = path.join(outputDir, file.replace(".md", ".html"));
    fs.writeFileSync(outFile, htmlPage, "utf-8");
    console.log(`✅ Generated: ${outFile}`);
  }
});
    
