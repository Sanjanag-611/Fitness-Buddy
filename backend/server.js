require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const IBM_API_KEY = process.env.IBM_API_KEY;
const IBM_URL = process.env.IBM_URL;
const IBM_PROJECT_ID = process.env.IBM_PROJECT_ID;
const IBM_MODEL_ID = process.env.IBM_MODEL_ID;
const PORT = process.env.PORT || 3000;

// Cache IBM IAM token
let cachedToken = null;
let tokenExpiry = null;

async function getIBMToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const response = await axios.post(
    "https://iam.cloud.ibm.com/identity/token",
    new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: IBM_API_KEY,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  cachedToken = response.data.access_token;
  // Expire 5 minutes before actual expiry
  tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
  return cachedToken;
}

const SYSTEM_PROMPT = `You are Fitness Buddy, a friendly and motivating AI-powered health and fitness coach. Your role is to:
- Recommend effective home workouts and exercise routines tailored to the user's fitness level and goals.
- Provide motivational tips, daily fitness inspiration, and encouragement to keep users consistent.
- Suggest simple, nutritious meal ideas and healthy eating habits.
- Help users build positive fitness habits and maintain consistency over time.
- Answer questions about exercise form, recovery, hydration, sleep, and overall wellness.

Always be positive, supportive, and encouraging. Keep responses concise, practical, and actionable. Use bullet points or numbered lists when listing exercises or meal ideas for clarity. If a user shares their fitness level or goals, personalize your advice accordingly.`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request: messages array required." });
  }

  try {
    const token = await getIBMToken();

    const payload = {
      model_id: IBM_MODEL_ID,
      project_id: IBM_PROJECT_ID,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    const response = await axios.post(IBM_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const reply = response.data.choices?.[0]?.message?.content || "I'm here to help! Could you clarify your question?";
    res.json({ reply });
  } catch (err) {
    console.error("IBM API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get a response from the AI. Please try again." });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Fitness Buddy backend is running!" });
});

app.listen(PORT, () => {
  console.log(`✅ Fitness Buddy backend running at http://localhost:${PORT}`);
});
