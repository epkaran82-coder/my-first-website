api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "The AI service is not configured."
    });
  }

  try {
    const { question } = req.body || {};

    if (
      typeof question !== "string" ||
      question.trim().length === 0 ||
      question.length > 2000
    ) {
      return res.status(400).json({
        error: "Enter a question of up to 2000 characters."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "You are a helpful general information assistant. " +
            "Answer clearly and concisely. Do not claim to represent " +
            "a real hospital or provide a diagnosis.",
          input: question.trim(),
          max_output_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API request failed:", response.status);

      return res.status(502).json({
        error: "The AI service could not complete the request."
      });
    }

    const answer = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    if (!answer) {
      return res.status(502).json({
        error: "The AI returned no text. Please try again."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("AI backend error:", error.message);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}
