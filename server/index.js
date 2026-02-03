const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

// Load environment variables (check both local and parent directory)
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(express.json());
app.use(cors());

// Debug: Log API key status
console.log(
  "🔑 GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY
    ? `Found (${process.env.GEMINI_API_KEY.substring(0, 10)}...)`
    : "NOT FOUND",
);

// Initialize Gemini (optional - works without it)
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini AI initialized successfully");
  } else {
    console.log("⚠️ No GEMINI_API_KEY found - AI insights disabled");
  }
} catch (error) {
  console.error("❌ Failed to initialize Gemini:", error.message);
}

// Validation helper
function isValidUrl(string) {
  try {
    new URL(string.startsWith("http") ? string : `https://${string}`);
    return true;
  } catch (_) {
    return false;
  }
}

// AI-powered insights generator using Gemini
async function generateAIInsights(websiteData, issues) {
  if (!genAI) {
    console.log("⚠️ Skipping AI insights - Gemini not initialized");
    return null;
  }

  // Models to try - gemini-2.5-flash works based on your test!
  const modelNames = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ];

  const prompt = `You are a restaurant marketing expert. Analyze this restaurant website audit and provide actionable insights.

Website: ${websiteData.title} (${websiteData.url})
Score: ${websiteData.score}/100
Load Time: ${websiteData.loadTime}ms

Issues Found:
${issues.map((i) => `- [${i.type.toUpperCase()}] ${i.text} (${i.category})`).join("\n")}

Provide a JSON response with ONLY these fields (no markdown, no code blocks, just raw JSON):
{
  "summary": "A 2-sentence summary of the website's online presence",
  "topPriority": "The single most important thing to fix and why (1-2 sentences)",
  "quickWins": ["Easy fix 1", "Easy fix 2", "Easy fix 3"],
  "competitorTip": "One tip about what successful restaurants do differently",
  "estimatedImpact": "20-30%"
}

Respond ONLY with valid JSON. No explanation, no markdown.`;

  for (const modelName of modelNames) {
    try {
      console.log(`🤖 Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      console.log("📝 Raw AI response:", text.substring(0, 200) + "...");

      // Clean up response - remove markdown code blocks if present
      text = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(text);
      console.log(`✅ AI insights generated successfully using ${modelName}`);
      return parsed;
    } catch (error) {
      console.log(
        `   ❌ ${modelName} failed: ${error.message.substring(0, 100)}`,
      );
      // Continue to next model - don't return null here!
      continue;
    }
  }

  console.error("❌ All Gemini models failed");
  return null;
}

// Grading function
function gradeWebsite($, bodyText, url, loadTime) {
  const results = {
    seo: { score: 0, maxScore: 30, issues: [] },
    content: { score: 0, maxScore: 25, issues: [] },
    usability: { score: 0, maxScore: 25, issues: [] },
    technical: { score: 0, maxScore: 20, issues: [] },
  };

  // ===== SEO CHECKS (30 points) =====
  const description = $('meta[name="description"]').attr("content") || "";
  const title = $("title").text() || "";
  const h1Count = $("h1").length;
  const hasCanonical = $('link[rel="canonical"]').length > 0;
  const hasOgTags = $('meta[property="og:title"]').length > 0;

  if (title.length >= 30 && title.length <= 60) {
    results.seo.score += 8;
  } else if (title.length > 0) {
    results.seo.score += 4;
    results.seo.issues.push({
      type: "warning",
      text: `Title length (${title.length} chars) should be 30-60 characters`,
    });
  } else {
    results.seo.issues.push({ type: "error", text: "Missing page title" });
  }

  if (description.length >= 120 && description.length <= 160) {
    results.seo.score += 8;
  } else if (description.length > 0) {
    results.seo.score += 4;
    results.seo.issues.push({
      type: "warning",
      text: `Meta description (${description.length} chars) should be 120-160 characters`,
    });
  } else {
    results.seo.issues.push({
      type: "error",
      text: "Missing meta description - hurts Google rankings",
    });
  }

  if (h1Count === 1) {
    results.seo.score += 6;
  } else if (h1Count === 0) {
    results.seo.issues.push({ type: "error", text: "Missing H1 heading" });
  } else {
    results.seo.score += 3;
    results.seo.issues.push({
      type: "warning",
      text: `Multiple H1 tags found (${h1Count}) - should have exactly 1`,
    });
  }

  if (hasCanonical) {
    results.seo.score += 4;
  } else {
    results.seo.issues.push({ type: "info", text: "No canonical URL set" });
  }

  if (hasOgTags) {
    results.seo.score += 4;
  } else {
    results.seo.issues.push({
      type: "warning",
      text: "Missing Open Graph tags - social sharing won't look good",
    });
  }

  // ===== CONTENT CHECKS (25 points) =====
  const hasPdf = $('a[href$=".pdf"]').length > 0;
  const hasMenu =
    bodyText.includes("menu") ||
    $('a[href*="menu"]').length > 0 ||
    $('img[alt*="menu"]').length > 0;
  const hasHours =
    bodyText.includes("hours") ||
    bodyText.includes("open") ||
    bodyText.includes("am") ||
    bodyText.includes("pm");
  const hasAddress =
    bodyText.includes("address") ||
    bodyText.includes("location") ||
    bodyText.includes("street");
  const hasPhone =
    /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/.test(bodyText) ||
    $('a[href^="tel:"]').length > 0;
  const imageCount = $("img").length;
  const imagesWithAlt = $("img[alt]").filter((_, el) =>
    $(el).attr("alt")?.trim(),
  ).length;

  if (hasPdf) {
    results.content.score += 2;
    results.content.issues.push({
      type: "error",
      text: "PDF menu detected - hard for Google to read, bad on mobile",
    });
  } else if (hasMenu) {
    results.content.score += 8;
  } else {
    results.content.issues.push({
      type: "warning",
      text: "No menu found on homepage",
    });
  }

  if (hasHours) {
    results.content.score += 5;
  } else {
    results.content.issues.push({
      type: "error",
      text: "Business hours not found - customers need this!",
    });
  }

  if (hasAddress) {
    results.content.score += 4;
  } else {
    results.content.issues.push({
      type: "warning",
      text: "Address/location not clearly visible",
    });
  }

  if (hasPhone) {
    results.content.score += 4;
  } else {
    results.content.issues.push({
      type: "warning",
      text: "Phone number not found",
    });
  }

  if (imageCount >= 5) {
    results.content.score += 4;
    if (imagesWithAlt / imageCount < 0.5) {
      results.content.issues.push({
        type: "warning",
        text: `Only ${Math.round((imagesWithAlt / imageCount) * 100)}% of images have alt text`,
      });
    }
  } else {
    results.content.issues.push({
      type: "info",
      text: "Consider adding more food photos",
    });
  }

  // ===== USABILITY CHECKS (25 points) =====
  const hasOrdering =
    bodyText.includes("order online") ||
    bodyText.includes("order now") ||
    $('a[href*="order"]').length > 0 ||
    $('a[href*="doordash"]').length > 0 ||
    $('a[href*="ubereats"]').length > 0 ||
    $('a[href*="grubhub"]').length > 0;
  const hasReservation =
    bodyText.includes("reserv") ||
    bodyText.includes("book a table") ||
    $('a[href*="opentable"]').length > 0 ||
    $('a[href*="resy"]').length > 0;
  const hasSocialLinks =
    $('a[href*="facebook.com"]').length > 0 ||
    $('a[href*="instagram.com"]').length > 0 ||
    $('a[href*="twitter.com"]').length > 0 ||
    $('a[href*="tiktok.com"]').length > 0;
  const hasClickablePhone = $('a[href^="tel:"]').length > 0;
  const hasGoogleMaps =
    $('iframe[src*="google.com/maps"]').length > 0 ||
    $('a[href*="maps.google"]').length > 0 ||
    $('a[href*="goo.gl/maps"]').length > 0;

  if (hasOrdering) {
    results.usability.score += 8;
  } else {
    results.usability.issues.push({
      type: "error",
      text: "No online ordering option found - you're losing sales!",
    });
  }

  if (hasReservation) {
    results.usability.score += 5;
  } else {
    results.usability.issues.push({
      type: "info",
      text: "No reservation system detected",
    });
  }

  if (hasSocialLinks) {
    results.usability.score += 4;
  } else {
    results.usability.issues.push({
      type: "warning",
      text: "No social media links found",
    });
  }

  if (hasClickablePhone) {
    results.usability.score += 4;
  } else if (hasPhone) {
    results.usability.issues.push({
      type: "warning",
      text: "Phone number not clickable on mobile",
    });
  }

  if (hasGoogleMaps) {
    results.usability.score += 4;
  } else {
    results.usability.issues.push({
      type: "info",
      text: "Consider embedding Google Maps",
    });
  }

  // ===== TECHNICAL CHECKS (20 points) =====
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasHttps = url.startsWith("https");
  const hasFavicon =
    $('link[rel="icon"]').length > 0 ||
    $('link[rel="shortcut icon"]').length > 0;
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;

  if (hasViewport) {
    results.technical.score += 6;
  } else {
    results.technical.issues.push({
      type: "error",
      text: "Not mobile-friendly - missing viewport meta tag",
    });
  }

  if (hasHttps) {
    results.technical.score += 5;
  } else {
    results.technical.issues.push({
      type: "error",
      text: "Site not secure (no HTTPS) - Google penalizes this",
    });
  }

  if (hasFavicon) {
    results.technical.score += 3;
  } else {
    results.technical.issues.push({ type: "info", text: "Missing favicon" });
  }

  if (hasStructuredData) {
    results.technical.score += 6;
  } else {
    results.technical.issues.push({
      type: "warning",
      text: "No structured data (Schema.org) - missing rich snippets in Google",
    });
  }

  if (loadTime && loadTime < 2000) {
    results.technical.score += 2;
  } else if (loadTime && loadTime > 5000) {
    results.technical.issues.push({
      type: "warning",
      text: `Slow load time (${(loadTime / 1000).toFixed(1)}s) - aim for under 3 seconds`,
    });
  }

  // Calculate total score
  const totalScore =
    results.seo.score +
    results.content.score +
    results.usability.score +
    results.technical.score;

  const maxScore =
    results.seo.maxScore +
    results.content.maxScore +
    results.usability.maxScore +
    results.technical.maxScore;

  // Collect all issues
  const allIssues = [
    ...results.seo.issues.map((i) => ({ ...i, category: "SEO" })),
    ...results.content.issues.map((i) => ({ ...i, category: "Content" })),
    ...results.usability.issues.map((i) => ({ ...i, category: "Usability" })),
    ...results.technical.issues.map((i) => ({ ...i, category: "Technical" })),
  ];

  // Sort: errors first, then warnings, then info
  const priority = { error: 0, warning: 1, info: 2 };
  allIssues.sort((a, b) => priority[a.type] - priority[b.type]);

  return {
    score: Math.round((totalScore / maxScore) * 100),
    breakdown: {
      seo: {
        score: results.seo.score,
        maxScore: results.seo.maxScore,
        percentage: Math.round(
          (results.seo.score / results.seo.maxScore) * 100,
        ),
      },
      content: {
        score: results.content.score,
        maxScore: results.content.maxScore,
        percentage: Math.round(
          (results.content.score / results.content.maxScore) * 100,
        ),
      },
      usability: {
        score: results.usability.score,
        maxScore: results.usability.maxScore,
        percentage: Math.round(
          (results.usability.score / results.usability.maxScore) * 100,
        ),
      },
      technical: {
        score: results.technical.score,
        maxScore: results.technical.maxScore,
        percentage: Math.round(
          (results.technical.score / results.technical.maxScore) * 100,
        ),
      },
    },
    issues: allIssues,
  };
}

app.post("/grade", async (req, res) => {
  let { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  console.log(`\n🔎 Scanning: ${url}`);

  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const startTime = Date.now();

    const response = await axios.get(url, {
      httpsAgent: agent,
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const loadTime = Date.now() - startTime;
    const html = response.data;
    const $ = cheerio.load(html);
    const title = $("title").text();
    const bodyText = $("body").text().toLowerCase();

    const { score, breakdown, issues } = gradeWebsite(
      $,
      bodyText,
      url,
      loadTime,
    );

    // Generate AI insights
    const websiteData = { url, title: title.substring(0, 60), score, loadTime };
    const aiInsights = await generateAIInsights(websiteData, issues);

    console.log(
      `✅ Success! Score: ${score}${aiInsights ? " (with AI insights)" : " (no AI insights)"}`,
    );

    res.json({
      url,
      score,
      breakdown,
      issues,
      title: title.substring(0, 60) + (title.length > 60 ? "..." : ""),
      loadTime,
      aiInsights,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: `Could not scan site: ${error.message}` });
  }
});

// Test endpoint for AI
app.get("/test-ai", async (req, res) => {
  if (!genAI) {
    return res.json({
      status: "error",
      message: "Gemini not initialized",
      apiKeyFound: !!process.env.GEMINI_API_KEY,
    });
  }

  const modelNames = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ];

  const results = [];

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(
        'Say "Hello" in JSON: {"message": "Hello"}',
      );
      const text = result.response.text();
      results.push({
        model: modelName,
        status: "success",
        response: text.substring(0, 100),
      });
      break; // Stop after first success
    } catch (error) {
      results.push({
        model: modelName,
        status: "error",
        message: error.message.substring(0, 100),
      });
    }
  }

  res.json({ results });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🤖 Gemini AI: ${genAI ? "Enabled" : "Disabled (no API key)"}`);
  console.log(`🧪 Test AI at: http://localhost:${PORT}/test-ai\n`);
});
