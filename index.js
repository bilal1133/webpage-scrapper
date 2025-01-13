const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000; // Use Heroku's dynamic port or fallback to 3000

let browser; // Persistent Puppeteer instance

// Function to initialize or reuse the Puppeteer browser
const getBrowserInstance = async () => {
  if (!browser) {
    console.log("Launching a new browser instance...");
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_BIN || null, // Use Heroku's Chrome binary
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-component-extensions-with-background-pages",
        "--disable-features=TranslateUI,BlinkGenPropertyTrees",
        "--disable-ipc-flooding-protection",
        "--disable-renderer-backgrounding",
        "--enable-features=NetworkService,NetworkServiceInProcess",
        "--force-color-profile=srgb",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
        "--no-default-browser-check",
        "--password-store=basic",
        "--use-mock-keychain",
      ],
    });
  }
  return browser;
};

// REST API Endpoint
app.get("/scrape", async (req, res) => {
  const { url, type } = req.query; // Get URL and type from query params

  if (!url) {
    return res.status(400).json({
      success: false,
      message:
        "URL parameter is required. Please provide a URL using ?url=your_url.",
    });
  }

  try {
    const browserInstance = await getBrowserInstance(); // Reuse or create the browser
    const page = await browserInstance.newPage();

    // Navigate to the provided URL
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for the main content to load
    await page.waitForSelector("body");

    // Extract content based on the requested type
    let content;
    if (type === "text") {
      content = await page.evaluate(() => document.body.innerText); // Get all visible text
    } else {
      content = await page.evaluate(() => document.body.innerHTML); // Get full HTML
    }

    // Close the page (not the browser) after scraping
    await page.close();

    // Send the content as the API response
    res.status(200).json({
      success: true,
      url,
      type: type || "html",
      content,
    });
  } catch (err) {
    console.error("Error scraping the page:", err);

    // Send an error response
    res.status(500).json({
      success: false,
      message: "Error scraping the page. Please check the URL and try again.",
      error: err.message,
    });
  }
});

// Default route for health check or root access
app.get("/", (req, res) => {
  res.send(
    "Welcome to the Scraper API! Use the endpoint /scrape?url=your_url&type=[text|html] to fetch page data."
  );
});

// Graceful shutdown to close the browser instance when the app is terminated
const closeBrowser = async () => {
  if (browser) {
    console.log("Closing the browser instance...");
    await browser.close();
  }
};

process.on("SIGINT", closeBrowser);
process.on("SIGTERM", closeBrowser);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
