const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.continueStory = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({ message: "AI Configuration error: API Key missing" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // These are the ONLY models available for this API key (verified via ListModels)
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemInstruction = "You are an expert story writer. Continue writing this story seamlessly from where it left off, matching the tone and style. Only return the continuation text itself. Do not include any preambles, titles, or explanations.";
        const fullPrompt = `${systemInstruction}\n\nHere is the story so far:\n\n${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        console.log(`[AI] ✅ Success with model: ${modelName}`);
        return res.json({ continuation: text });
      } catch (err) {
        console.error(`[AI] ❌ Failed with ${modelName}:`, err.message);
        lastError = err;
        if (!err.message.includes("404") && !err.message.includes("not found")) break;
      }
    }

    throw lastError || new Error("All models failed");
  } catch (error) {
    console.error("[AI] Final Error:", error.message);
    res.status(500).json({
      message: "AI Generation failed",
      error: error.message
    });
  }
};
