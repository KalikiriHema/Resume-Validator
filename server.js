import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI client with your key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
app.get("/", (req, res) => {
  res.send("🚀 ATS Resume Validator API is running. Use POST /analyze to test.");
});


app.post("/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Both resumeText and jobDescription are required." });
    }

    console.log("👉 Request Body:", req.body);

    const prompt = `
You are an ATS Resume Checker.
Compare this resume with the job description and provide:
1. ATS Score (0-100)
2. Matched Keywords
3. Missing Keywords
4. Suggestions for improving the resume

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

    // Call OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheaper, you can also use "gpt-4o" or "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "You are an ATS resume analysis assistant." },
        { role: "user", content: prompt },
      ],
    });

    const result = response.choices[0].message.content;
    res.json({ result });

  } catch (err) {
    console.error("❌ Server Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
