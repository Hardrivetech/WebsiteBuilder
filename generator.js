const ejs = require("ejs");
const fs = require("fs/promises");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "templates", "basic.ejs");
const OUTPUT_DIR = path.join(__dirname, "output");

async function generateSite(siteData) {
  // Read the EJS template file
  const template = await fs.readFile(TEMPLATE_PATH, "utf-8");

  // Render the template with the user's data
  const html = ejs.render(template, { site: siteData });

  // Create a directory for the new site
  const siteOutputDir = path.join(OUTPUT_DIR, siteData.id);
  await fs.mkdir(siteOutputDir, { recursive: true });

  // Write the final HTML to a file
  await fs.writeFile(path.join(siteOutputDir, "index.html"), html);
}

module.exports = { generateSite };
