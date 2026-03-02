import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// 1) 从环境变量拿 key，避免写进代码/网页
const apiKey = (process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.error("Missing OPENAI_API_KEY. Please set it in your terminal before running server.js");
  process.exit(1);
}

// 2) 安全检查：确保 key 里没有中文等非 ASCII 字符
try {
  Buffer.from(apiKey, "ascii");
} catch {
  console.error("OPENAI_API_KEY contains non-ASCII characters. Please re-copy your key.");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

// 简单的系统提示词：强制英文 + 以“宾州服务助手”的身份回答
const SYSTEM_PROMPT =
  "You are a helpful assistant for Pennsylvania public services. " +
  "Reply in English only. Provide clear steps, required documents, eligibility notes, " +
  "and mention that users should verify details on official Pennsylvania government websites. " +
  "If the user asks for legal/medical/financial advice, give general information and suggest professional help.";

app.post("/chat", async (req, res) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    if (!message) return res.status(400).send("Message is required.");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: response.choices?.[0]?.message?.content ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error. Check terminal logs.");
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});