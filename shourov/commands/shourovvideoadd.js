const axios = require("axios");

module.exports = {
  config: {
    name: "autovideo_api",
    version: "1.0.0",
    permission: 0,
    prefix: false,
    credits: "shourov",
    description: "Auto video from external API",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      if (!event.body) return;
      if (event.senderID === api.getCurrentUserID()) return;

      const text = event.body.toLowerCase();

      // 🔗 আপনার API URL (local হলে 127.0.0.1)
      const API_URL = `http://127.0.0.1:3000/video?q=${encodeURIComponent(text)}`;

      const res = await axios.get(API_URL, { timeout: 5000 });
      const data = res.data;

      if (!data || !data.status || !data.video) return;

      // 🎥 video stream
      const videoStream = await axios.get(data.video, {
        responseType: "stream",
        timeout: 30000
      });

      return api.sendMessage(
        {
          body: data.body || "",
          attachment: videoStream.data
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      // silent fail (auto command)
      console.error("[autoVideoAPI]", err.message);
    }
  },

  run: async function () {}
};