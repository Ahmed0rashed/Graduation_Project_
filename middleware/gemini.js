
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function cleanText(text) {
  return typeof text === "string"
    ? text.replace(/(\*\*.*?\*\*|\n|\*|:)/g, "").trim()
    : "";
}

async function analyzeImages(imageUrls) {
  const promptFinding = 
  "As a radiologist, provide the complete diagnostic findings from this image, written in a professional radiology reporting style, without adding any steps, explanations, or extra text.";
  const promptImpression = 
  "As a radiologist, provide the full diagnostic impression from this image, written in a professional radiology reporting style, without adding any steps, explanations, or extra text.";

  const imageParts = await Promise.all(
    imageUrls.map(async (url) => {
      const resp = await fetch(url);
      const buffer = await resp.arrayBuffer();
      return {
        inlineData: {
          data: Buffer.from(buffer).toString("base64"),
          mimeType: "image/jpeg",
        },
      };
    })
  );


  const findingResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptFinding }, ...imageParts] }],
  });

  const impressionResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptImpression }, ...imageParts] }],
  });

  return {
    finding: cleanText(findingResult.response.text() || ""),
    impression: cleanText(impressionResult.response.text() || ""),
  };
}

async function generateText(prompt) {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return {
      success: true,
      text: cleanText(result.response.text() || ""),
      originalText: result.response.text() || ""
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate text",
      text: ""
    };
  }
}






module.exports = { analyzeImages, generateText };
