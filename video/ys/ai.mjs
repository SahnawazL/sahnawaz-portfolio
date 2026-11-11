// Asks the live YojanaSahay assistant real questions, the way the app does,
// and saves the raw replies so the film can show genuine answers.
import fs from "fs";
const { buildChatBody } = await import(process.cwd() + "/ys/src/groqClient.js");
const QS = [
  { id: "en", lang: "en", q: "Which schemes can help a small farmer in Assam?" },
  { id: "hi", lang: "hi", q: "घर बनाने के लिए मुझे कौन सी योजना मिल सकती है?" },
  { id: "scam", lang: "en", q: "Is this message real? \"Congratulations! You are selected for PM Kisan bonus Rs 15,000. Pay Rs 499 processing fee to claim.\"" }
];
fs.mkdirSync("video/ys/out/ai", { recursive: true });
for (const x of QS) {
  try {
    const body = buildChatBody([{ role: "user", content: x.q }], x.q, x.lang, null, {});
    const r = await fetch("https://yojanasahay.vercel.app/api/chat", { method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "https://yojanasahay.vercel.app", "Referer": "https://yojanasahay.vercel.app/" },
      body: JSON.stringify(body) });
    const txt = await r.text();
    fs.writeFileSync(`video/ys/out/ai/${x.id}.json`, JSON.stringify({ q: x.q, status: r.status, body: txt }, null, 1));
    console.log(x.id, r.status, txt.slice(0, 200));
  } catch (e) { console.log(x.id, "failed", e.message); }
}

// the live counts the home screen shows
for (const path of ["/api/stats"]) {
  try { const r = await fetch("https://yojanasahay.vercel.app" + path); const t = await r.text();
    fs.writeFileSync("video/ys/out/ai/stats.json", t); console.log(path, r.status, t.slice(0, 300)); } catch (e) { console.log(path, "failed", e.message); }
}
