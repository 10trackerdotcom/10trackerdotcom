export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const apiKey =
    "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";
  const apiUrl = "https://openrouter.ai/api/v1/chat/completions"; // Correct API Endpoint

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Your domain
        "X-Title": "Your App Name",
      },
      body: JSON.stringify({
        model: "google/gemini-pro-2", // Correct model name
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: req.body.prompt || "Hello!" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
