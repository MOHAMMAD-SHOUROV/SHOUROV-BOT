// commands/ai.js
module.exports = {
  config: {
    name: "ai",
    version: "1.0.1",
    permission: 0,
    credits: "shourov",
    description: "Send a query to remote GPT-like API and return the reply",
    prefix: true,
    category: "user",
    usages: "ai <query>",
    cooldowns: 5,
    dependencies: {}
  },

  start: async function (context = {}) {
    const axios = require("axios");

    // tolerate many loader names: nayan, shourov, api, SHOUROV, client...
    const client = context.nayan || context.shourov || context.api || context.NAYAN || context.client;
    const event = context.events || context.event;
    const args = Array.isArray(context.args) ? context.args : (context.argv || []);
    const Users = context.Users || {};

    if (!client || !event) {
      console.error("ai command: missing client or event in context");
      return;
    }

    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID || event.author || "");

    // validate prompt
    const prompt = (args || []).join(" ").trim();
    if (!prompt) {
      const missingMsg = "❗ Please provide a query. Usage: ai <your question>";
      // try a few send methods depending on client implementation
      try { if (typeof client.sendMessage === "function") return client.sendMessage(missingMsg, threadID, messageID); } catch (e) {}
      try { if (typeof client.reply === "function") return client.reply(missingMsg, threadID, messageID); } catch (e) {}
      return;
    }

    // optional: get sender name (best-effort)
    let senderName = senderID;
    try {
      if (Users && typeof Users.getNameUser === "function") senderName = await Users.getNameUser(senderID);
    } catch (e) { /* ignore */ }

    try {
      // fetch api base from remote JSON (graceful)
      let apiBase = null;
      try {
        const apis = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json', { timeout: 8000 });
        apiBase = apis && apis.data && (apis.data.api || apis.data.sim) ? (apis.data.api || apis.data.sim) : null;
      } catch (e) {
        console.warn("ai: couldn't fetch remote api.json, will try default endpoint if available.");
      }

      if (!apiBase) {
        const errMsg = "❗ AI service is currently unavailable. Try again later.";
        try { if (typeof client.sendMessage === "function") return client.sendMessage(errMsg, threadID, messageID); } catch (e) {}
        try { if (typeof client.reply === "function") return client.reply(errMsg, threadID, messageID); } catch (e) {}
        return;
      }

      // call remote GPT endpoint
      const url = `${apiBase.replace(/\/+$/,'')}/shourov/gpt3?prompt=${encodeURIComponent(prompt)}`;
      const resp = await axios.get(url, { timeout: 20000 });

      const aiResponseRaw = resp && resp.data ? (resp.data.response || resp.data.result || resp.data.text || resp.data) : null;
      let aiText = typeof aiResponseRaw === "string" ? aiResponseRaw : (JSON.stringify(aiResponseRaw || {}).slice(0, 2000));

      if (!aiText || aiText.length === 0) {
        aiText = "I couldn't process that request at the moment.";
      }

      // limit length to avoid platform limits
      const MAX_LEN = 1900;
      const body = aiText.length > MAX_LEN ? aiText.slice(0, MAX_LEN - 3) + "..." : aiText;

      // final message
      const out = `💬 ${senderName}, AI reply:\n\n${body}`;

      // send back (try multiple send methods)
      try {
        if (typeof client.sendMessage === "function") return client.sendMessage(out, threadID, messageID);
        if (typeof client.reply === "function") return client.reply(out, threadID, messageID);
        // some clients expose api.sendMessage
        if (client.api && typeof client.api.sendMessage === "function") return client.api.sendMessage(out, threadID, messageID);
      } catch (e) {
        console.warn("ai: failed to send with primary method:", e);
      }

      // last resort: log
      console.log("AI response:", out);

    } catch (err) {
      console.error("ai command error:", err && (err.stack || err));
      const failMsg = "❗ An error occurred while contacting the AI service. Try again later.";
      try { if (typeof client.sendMessage === "function") return client.sendMessage(failMsg, threadID, messageID); } catch (e) {}
      try { if (typeof client.reply === "function") return client.reply(failMsg, threadID, messageID); } catch (e) {}
    }
  }
};