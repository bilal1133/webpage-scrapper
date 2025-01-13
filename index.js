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
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Heroku
    });
  }
  return browser;
};

// REST API Endpoint
app.get("/scrape/:id", async (req, res) => {
  const { id } = req.params; // Get the listing ID from the URL
  const url = `https://www.airbnb.com/rooms/${id}`; // Build the Airbnb URL dynamically

  try {
    const browserInstance = await getBrowserInstance(); // Reuse or create the browser
    const page = await browserInstance.newPage();

    // Navigate to the Airbnb listing
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for the main content to load
    await page.waitForSelector("body");

    // Extract the entire HTML content from the page
    const htmlContent = await page.evaluate(() => document.body.innerHTML);

    // Close the page (not the browser) after scraping
    await page.close();

    // Send the HTML content as the API response
    res.status(200).json({
      success: true,
      id,
      html: htmlContent,
    });
  } catch (err) {
    console.error("Error scraping Airbnb:", err);

    // Send an error response
    res.status(500).json({
      success: false,
      message: "Error scraping the page. Please check the listing ID and try again.",
      error: err.message,
    });
  }
});

// Default route for health check or root access
app.get("/", (req, res) => {
  res.send("Welcome to the Airbnb Scraper API! Use the endpoint /scrape/:id to fetch listing data.");
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