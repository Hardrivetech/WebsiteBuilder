const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs/promises");
const path = require("path");

const CF_API_URL = "https://api.cloudflare.com/client/v4";
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const AUTH_HEADERS = {
  Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
};

/**
 * Creates a new Cloudflare Pages project or returns an existing one.
 */
async function createPagesProject(siteId) {
  try {
    const response = await axios.post(
      `${CF_API_URL}/accounts/${ACCOUNT_ID}/pages/projects`,
      {
        name: siteId,
        production_branch: "main",
        deployment_configs: { production: {} },
      },
      { headers: AUTH_HEADERS }
    );
    console.log(`Cloudflare project '${siteId}' created.`);
    return response.data.result;
  } catch (error) {
    // Error code 8000014 means a project with that name already exists.
    if (error.response?.data?.errors?.[0]?.code === 8000014) {
      console.log(
        `Cloudflare project '${siteId}' already exists. Using existing one.`
      );
      const getResponse = await axios.get(
        `${CF_API_URL}/accounts/${ACCOUNT_ID}/pages/projects/${siteId}`,
        { headers: AUTH_HEADERS }
      );
      return getResponse.data.result;
    }
    console.error(
      "Error creating Cloudflare project:",
      error.response?.data || error.message
    );
    throw new Error("Failed to create Cloudflare project.");
  }
}

/**
 * Generates site files, creates a Cloudflare Pages project, and deploys the files.
 * @param {object} siteData - The metadata for the site.
 * @returns {string} The live URL of the deployed site.
 */
async function deployToCloudflare(siteData) {
  const { id: siteId } = siteData;

  // 1. Ensure a Cloudflare Pages project exists for this site ID.
  const project = await createPagesProject(siteId);

  // 2. Prepare the generated file for upload.
  const filePath = path.join(__dirname, "output", siteId, "index.html");
  const fileContent = await fs.readFile(filePath);

  // 3. Create a FormData payload for the deployment.
  const form = new FormData();
  form.append("index.html", fileContent, { filename: "index.html" });

  // 4. Create a new deployment by uploading the file.
  try {
    const response = await axios.post(
      `${CF_API_URL}/accounts/${ACCOUNT_ID}/pages/projects/${project.name}/deployments`,
      form,
      { headers: { ...AUTH_HEADERS, ...form.getHeaders() } }
    );

    console.log(`Deployment successful for site '${siteId}'.`);

    // 5. Clean up the local generated files to save space.
    await fs.rm(path.join(__dirname, "output", siteId), {
      recursive: true,
      force: true,
    });

    // 6. Return the live URL from the deployment response.
    return response.data.result.url;
  } catch (error) {
    console.error(
      "Error deploying to Cloudflare:",
      error.response?.data || error.message
    );
    throw new Error("Failed to deploy to Cloudflare Pages.");
  }
}

module.exports = { deployToCloudflare };
