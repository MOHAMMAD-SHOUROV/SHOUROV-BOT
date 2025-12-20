const axios = require("axios");

module.exports = {
  config: {
    name: "npx36",
    version: "1.0.0",
    permission: 0,
    prefix: false,
    credits: "shourov",
    description: "Auto trigger love video",
    category: "auto"
  },

  // 🔥 AUTO EVENT (NO PREFIX)
  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = body.toLowerCase();

      // 🔑 trigger words
      const triggers = ["king", "shourov", "সৌরভ"];

      if (!triggers.some(w => text.includes(w))) return;

      const videoURL = "https://files.catbox.moe/8sctaw.mp4";

      const res = await axios.get(videoURL, {
        responseType: "stream",
        timeout: 30000
      });

      api.sendMessage(
        {
          body: "🖤 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
          attachment: res.data
        },
        threadID,
        messageID
      );

    } catch (err) {
      console.error("[npx36] error:", err.message);
    }
  },

  // ❌ run খালি রাখো (loader error এড়াতে)
  run: async function () {}
};
