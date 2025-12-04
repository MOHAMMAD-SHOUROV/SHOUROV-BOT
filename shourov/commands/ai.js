// commands/ai.js
const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "1.0.2",
  permission: 0,
  credits: "shourov",
  description: "Send a query to remote GPT-like API and return the reply",
  prefix: true,
  category: "user",
  usages: "ai <query>",
  cooldowns: 5,
  dependencies: {}
};

module.exports.name = module.exports.config.name;

module.exports.run = async function ({ api, event, args, Users }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  // Validate input
  const prompt = (args || []).join(" ").trim();
  if (!prompt) return api.sendMessage("❗ Please provide a query. Usage: /ai <your question>", threadID, messageID);

  try {
    // try to get sender display name (best-effort)
    let senderName = senderID;
    try {
      if (Users && typeof Users.getNameUser === "function") {
        senderName = await Users.getNameUser(senderID) || senderID;
      }
    } catch (e) { /* ignore */ }

    // Try multiple known locations for api.json (graceful)
    let apiBase = null;
    const candidates = [
      "https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourov/main/api.json",
      "https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/main/api.json",
      "https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/master/api.json"
    ];

    for (const c of candidates) {
      try {
        const res = await axios.get(c, { timeout: 7000 });
        if (res && res.data) {
          // Try common keys that may hold the base URL
          apiBase = res.data.api || res.data.base || res.data.url || res.data.endpoint || null;
          if (apiBase) break;
        }
      } catch (e) {
        // ignore this candidate and try next
      }
    }

    if (!apiBase) {
      // No remote base found — return useful message so admin can fix repo/api.json
      return api.sendMessage("❗ AI service is currently unavailable (api.json not found or missing 'api' entry). Please check your remote api.json.", threadID, messageID);
    }

    // Build request URL
    const url = `${apiBase.replace(/\/+$/, "")}/shourov/gpt3?prompt=${encodeURIComponent(prompt)}`;

    // Call remote GPT-like endpoint
    const resp = await axios.get(url, { timeout: 20000 }).catch(err => {
      throw new Error("Remote AI endpoint request failed: " + (err && err.message));
    });

    // Parse response flexibly
    let aiResponse = null;
    if (resp && resp.data) {
      if (typeof resp.data === "string") aiResponse = resp.data;
      else aiResponse = resp.data.response || resp.data.result || resp.data.text || resp.data.reply || resp.data.data || JSON.stringify(resp.data);
    }

    if (!aiResponse) aiResponse = "I couldn't process that request at the moment.";

    // Prepare output (truncate if too long)
    const MAX_LEN = 1900;
    const out = (typeof aiResponse === "string") ? aiResponse : JSON.stringify(aiResponse, null, 2);
    const body = out.length > MAX_LEN ? out.slice(0, MAX_LEN - 3) + "..." : out;

    return api.sendMessage(`💬 ${senderName}, here's the AI response:\n\n${body}`, threadID, messageID);
  } catch (err) {
    console.error("ai command error:", err && (err.stack || err));
    return api.sendMessage("❗ An error occurred while contacting the AI service. Try again later.", threadID, messageID);
  }
};