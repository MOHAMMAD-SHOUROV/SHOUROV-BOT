const axios = require("axios");

module.exports = {
  config: {
    name: "autovideo",
    version: "1.0.0",
    permission: 0,
    credits: "Shourov",
    prefix: false,
    description: "Auto video from API trigger",
    category: "media",
    cooldowns: 1
  },

  handleEvent: async function ({ api, event }) {
    try {
      if (!event.body) return;
      if (event.senderID === api.getCurrentUserID()) return;

      const text = event.body.trim().toLowerCase();

      // 🌐 YOUR API
      const API_URL = "https://shourov-video-api.onrender.com/video";

      const res = await axios.get(
        `${API_URL}?q=${encodeURIComponent(text)}`,
        { timeout: 7000 }
      );

      if (!res.data || res.data.status !== true) return;
      if (!res.data.video) return;

      // 🎬 Send video
      return api.sendMessage(
        {
          body: res.data.body || "𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕",
          attachment: await global.utils.getStreamFromURL(res.data.video)
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      return;
    }
  },

  run: async function () {
    // no prefix command needed
  }
};