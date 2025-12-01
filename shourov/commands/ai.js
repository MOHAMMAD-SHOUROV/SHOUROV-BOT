// commands/ai.js
module.exports.config = {
  name: "ai",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Send a query to remote GPT-like API and return the reply",
  prefix: true,
  category: "user",
  usages: "ai <query>",
  cooldowns: 5,
  dependencies: {}
};

module.exports.name = module.exports.config.name;

module.exports.run = async function ({ api, event, args, Users }) {
  const axios = require("axios");

  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  // Validate input
  const prompt = (args || []).join(" ").trim();
  if (!prompt) return api.sendMessage("❗ Please provide a query. Usage: /ai <your question>", threadID, messageID);

  try {
    // get user display name (optional)
    let senderName = senderID;
    try {
      if (Users && typeof Users.getNameUser === "function") {
        senderName = await Users.getNameUser(senderID);
      }
    } catch (e) { /* ignore */ }

    // fetch API base from remote JSON (graceful fallback)
    let apiBase = null;
    try {
      const apis = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/main/api.json', { timeout: 8000 });
      apiBase = apis && apis.data && apis.data.api ? apis.data.api : null;
    } catch (e) {
      console.warn("Could not fetch api.json, will try default endpoint if available.");
    }

    if (!apiBase) {
      // fallback - set a default or return error
      return api.sendMessage("❗ AI service is currently unavailable. Try again later.", threadID, messageID);
    }

    // call GPT endpoint
    const url = `${apiBase}/shourov/gpt3?prompt=${encodeURIComponent(prompt)}`;
    const resp = await axios.get(url, { timeout: 15000 });
    const aiResponse = (resp && resp.data && (resp.data.response || resp.data.result || resp.data.text)) ?
      (resp.data.response || resp.data.result || resp.data.text) :
      "I couldn't process that request at the moment.";

    // send reply (truncate if extremely long)
    const MAX_LEN = 1900;
    const out = (typeof aiResponse === "string") ? aiResponse : JSON.stringify(aiResponse, null, 2);
    const body = out.length > MAX_LEN ? out.slice(0, MAX_LEN - 3) + "..." : out;

    return api.sendMessage(`💬 ${senderName}, here's the AI response:\n\n${body}`, threadID, messageID);
  } catch (err) {
    console.error("ai command error:", err && (err.stack || err));
    return api.sendMessage("❗ An error occurred while contacting the AI service. Try again later.", threadID, messageID);
  }
};
