const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'No message received.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'API key not configured.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are Sahnawaz's assistant. Answer about him warmly.\n\nVisitor says: ${message.trim()}` }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 400 }
        })
      }
    );

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Please contact shzthedigitalalchemist@gmail.com 😊";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Error:', err);
    return res.status(200).json({ reply: "Something went wrong! Contact shzthedigitalalchemist@gmail.com 😊" });
  }
};

module.exports = handler;
