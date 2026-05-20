import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      stream: true,

      messages: [
        {
          role: "system",
          content: `
You are a helpful AI assistant.
Rules:
- Write clean sentences
- Do not break words
- Use proper punctuation
- Use proper spacing
- Respond like ChatGPT
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let buffer = "";

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || "";

      buffer += content;

      // flush in safe chunks
      if (
        buffer.endsWith(" ") ||
        buffer.endsWith("\n") ||
        buffer.length > 30
      ) {
        res.write(buffer);
        buffer = "";
      }
    }

    if (buffer.length > 0) {
      res.write(buffer);
    }

    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error generating response",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});