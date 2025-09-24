
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function cleanText(text) {
  return typeof text === "string"
    ? text.replace(/(\*\*.*?\*\*|\n|\*|:)/g, "").trim()
    : "";
}

export async function analyzeImages(imageUrls) {
  const promptFinding =
    "Provide only the full diagnostic findings from this image for doctor without any thing else and without any steps";
  const promptImpression =
    "Provide only the full diagnostic impression from this image for doctor without any thing else and without any steps";

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
