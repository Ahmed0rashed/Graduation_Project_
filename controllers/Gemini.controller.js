const { generateText } = require("../middleware/gemini");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

exports.generateText = async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "the field is empty"
        });
      }


      // Generate text using Gemini
      const result = await generateText(prompt.trim());

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            prompt: prompt,
            response: result.text,
            originalResponse: result.originalText,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to generate text",
          details: result.error
        });
      }

    } catch (error) {
      console.error("Error in generateText:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
};

// Generate medical advice using Gemini API
exports.generateMedicalAdvice = async (req, res) => {
    try {
      const { symptoms, age, gender, medicalHistory } = req.body;

      // Validate required fields
      if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "the field is empty"
        });
      }

      // Create a medical-focused prompt
      const medicalPrompt = `
        As a medical AI assistant, please provide general health information based on the following:
        
        Symptoms: ${symptoms}
        Age: ${age || 'Not specified'}
        Gender: ${gender || 'Not specified'}
        Medical History: ${medicalHistory || 'Not specified'}
        
        Please provide:
        1. Possible conditions (general guidance only)
        2. Recommended next steps
        3. When to seek immediate medical attention
        4. General health tips
        
        Note: This is for informational purposes only and should not replace professional medical advice.
      `;

      const result = await generateText(medicalPrompt.trim());

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            symptoms: symptoms,
            age: age,
            gender: gender,
            medicalHistory: medicalHistory,
            advice: result.text,
            originalResponse: result.originalText,
            timestamp: new Date().toISOString(),
            disclaimer: "This is for informational purposes only and should not replace professional medical advice."
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to generate medical advice",
          details: result.error
        });
      }

    } catch (error) {
      console.error("Error in generateMedicalAdvice:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
};

// Generate radiology report summary
exports.generateRadiologySummary = async (req, res) => {
    try {
      const { findings, impression, patientAge, patientGender } = req.body;

      // Validate required fields
      if (!findings || typeof findings !== 'string' || findings.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Findings are required and must be a non-empty string"
        });
      }

      // Create a radiology-focused prompt
      const radiologyPrompt = `
        As a radiology AI assistant, please provide a comprehensive summary of this radiology report:
        
        Findings: ${findings}
        Impression: ${impression || 'Not specified'}
        Patient Age: ${patientAge || 'Not specified'}
        Patient Gender: ${patientGender || 'Not specified'}
        
        Please provide:
        1. Summary of key findings
        2. Clinical significance
        3. Follow-up recommendations
        4. Any additional considerations
        
        Note: This is for educational purposes and should be reviewed by a qualified radiologist.
      `;

      const result = await generateText(radiologyPrompt.trim());

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            findings: findings,
            impression: impression,
            patientAge: patientAge,
            patientGender: patientGender,
            summary: result.text,
            originalResponse: result.originalText,
            timestamp: new Date().toISOString(),
            disclaimer: "This is for educational purposes and should be reviewed by a qualified radiologist."
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to generate radiology summary",
          details: result.error
        });
      }

    } catch (error) {
      console.error("Error in generateRadiologySummary:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
};

// Explain radiology report in simple Egyptian Arabic
exports.explainReport = async (req, res) => {
  try {
    const { report } = req.body;

    // Validate input
    if (!report || typeof report !== 'string' || report.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Report is required and must be a non-empty string"
      });
    }

    // Create Arabic explanation prompt
    const arabicPrompt = `
      Explain this radiology report in very simple Egyptian Arabic so that a normal patient with no medical background can understand it. Avoid scientific jargon.
      
      Report: ${report}
      
      Please provide a clear, simple explanation in Egyptian Arabic that a patient can understand.
    `;

    // Generate explanation using Gemini
    const result = await generateText(arabicPrompt.trim());

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          patient_explanation: result.text,
          timestamp: new Date().toISOString(),
          language: "Egyptian Arabic",
          disclaimer: "This explanation is for educational purposes and should not replace professional medical consultation."
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to generate explanation",
        details: result.error
      });
    }

  } catch (error) {
    console.error("Error in explainReport:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

