const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

// Paths
const postsDir = path.join(__dirname, "..", "posts");
const templatePath = path.join(__dirname, "..", "templates", "post_template.html");
const outputDir = path.join(__dirname, "..");

// Load template
const template = fs.readFileSync(templatePath, "utf-8");

// Ensure posts folder exists
if (!fs.existsSync(postsDir)) {
  console.error("❌ posts folder not found!");
  process.exit(1);
}

// Process markdown files
fs.readdirSync(postsDir).forEach((file) => {
  if (file.endsWith(".md")) {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Parse front matter
    const { data, content: markdownContent } = matter(content);

    // Convert markdown to HTML
    const htmlContent = marked(markdownContent);

    // Replace placeholders in template
    let finalHtml = template
      .replace("{{title}}", data.title || "Untitled Post")
      .replace("{{date}}", data.date || new Date().toISOString().split("T")[0])
      .replace("{{content}}", htmlContent);

    // Save output (same name as md but .html)
    const outputFile = path.join(outputDir, file.replace(".md", ".html"));
    fs.writeFileSync(outputFile, finalHtml);

    console.log(`✅ Built ${outputFile}`);
  }
});
   
