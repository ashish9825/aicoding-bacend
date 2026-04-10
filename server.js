// server.js
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();
const cors = require("cors");
app.use(cors());
const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// ─── Helper: build system prompt ───────────────────────────────────────────
function getSystemPrompt(mode, language) {
  if (mode === "generate") {
    return `You are an expert ${language} programmer. 
When given a description, write clean, well-commented ${language} code.
Return ONLY the code block, no extra explanation outside the code.
Add inline comments to explain key logic.`;
  }
  if (mode === "debug") {
    return `You are an expert code debugger.
When given broken ${language} code, you:
1. Identify all bugs clearly
2. Explain why each is a bug
3. Return the fully fixed code
Format your response as:
## Bugs Found
- Bug 1: ...
- Bug 2: ...
## Fixed Code
\`\`\`${language}
[fixed code here]
\`\`\``;
  }
  if (mode === "explain") {
    return `You are a coding teacher. Explain the given ${language} code 
in simple terms. Break it down step by step. Use plain language.`;
  }
}

// ─── Route: Generate Code ──────────────────────────────────────────────────
app.post("/api/generate", async (req, res) => {
  const { prompt, language = "python", model = "llama-3.3-70b-versatile" } = req.body;

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: getSystemPrompt("generate", language) },
        { role: "user", content: `Write ${language} code to: ${prompt}` },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route: Debug Code ─────────────────────────────────────────────────────
app.post("/api/debug", async (req, res) => {
  const { code, language = "python", model = "llama-3.3-70b-versatile" } = req.body;

  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: getSystemPrompt("debug", language) },
        { role: "user", content: `Debug this ${language} code:\n\n${code}` },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route: Explain Code ───────────────────────────────────────────────────
app.post("/api/explain", async (req, res) => {
  const { code, language = "python" } = req.body;

  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: getSystemPrompt("explain", language) },
        { role: "user", content: `Explain this code:\n\n${code}` },
      ],
      max_tokens: 1024,
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));