const axios = require("axios");

module.exports = {
  config: {
    name: "npx9",
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
      const triggers = ["🤭", "🙈", "🙊", "🤫", "shy", "sorom", "শরম"];

      if (isTriggered) {
      const filePath = __dirname + "/shourov/sorom.mp3";
      if (!fs.existsSync(filePath)) return;

      const res = await axios.get(videoURL, {
        responseType: "stream",
        timeout: 30000
      });

      api.sendMessage(
        {
          body: "আঁমিঁ বলুঁম্ না — আমার শরম লাগে 😳",
          attachment: res.data
        },
        threadID,
        messageID
      );

    } catch (err) {
      console.error("[npx9] error:", err.message);
    }
  },

  // ❌ run খালি রাখো (loader error এড়াতে)
  run: async function () {}
};
