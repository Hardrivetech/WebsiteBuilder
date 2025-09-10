require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const { generateSite } = require("./generator");
const { deployToCloudflare } = require("./deployer");
const { nanoid } = require("nanoid");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, "db.json");
const OUTPUT_DIR = path.join(__dirname, "output");

// Ensure output directory exists
fs.mkdir(OUTPUT_DIR, { recursive: true });

app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Parse JSON bodies
// We will no longer serve sites directly. Cloudflare will host them.
// app.use("/sites", express.static(OUTPUT_DIR));

// Helper to read/write to our JSON DB
const readDb = async () => {
  try {
    const data = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, start with an empty object
    if (error.code === "ENOENT") {
      return { sites: {} };
    }
    throw error;
  }
};

const writeDb = async (data) => {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
};

// Auth middleware to protect routes
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication token is required." });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  req.user = user;
  next();
};

// API Endpoint to create a new website
app.post("/api/sites", authMiddleware, async (req, res) => {
  try {
    const { siteName, headline, theme } = req.body;

    if (!siteName || !headline || !theme) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const siteId = nanoid(10);
    const siteData = {
      id: siteId,
      siteName,
      headline,
      theme,
      createdAt: new Date().toISOString(),
      userId: req.user.id, // Associate site with the logged-in user
    };

    // Generate the static HTML file
    await generateSite(siteData);

    // Deploy the generated site to Cloudflare Pages
    const siteUrl = await deployToCloudflare(siteData);

    // Save metadata to our "database"
    const db = await readDb();
    db.sites[siteId] = { ...siteData, url: siteUrl };
    await writeDb(db);

    console.log(`Successfully generated and deployed site: ${siteId}`);

    res.status(201).json({
      message: "Site deployed successfully!",
      siteId,
      siteUrl,
    });
  } catch (error) {
    console.error("Failed to create site:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
