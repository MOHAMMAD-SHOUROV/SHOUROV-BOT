// shourov/events/shourovlove99.js
const axios = require("axios");

module.exports = {
  name: "npx36",

  run: async function ({ api, event }) {
    try {
      if (!event.body) return;

      const text = String(event.body).toLowerCase();

      // 🔥 trigger words
      const triggers = ["shourov", "সৌরভ", "king"];

      if (!triggers.some(w => text.includes(w))) return;

      const videos = [
        "https://i.imgur.com/23eTYBu.mp4",
        "https://files.catbox.moe/8sctaw.mp4",
        "https://files.catbox.moe/omt6x5.mp4"
      ];

      const videoURL = videos[Math.floor(Math.random() * videos.length)];

      const res = await axios.get(videoURL, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });

      api.sendMessage({
        body: "🖤 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
        attachment: res.data
      }, event.threadID);

    } catch (err) {
      console.error("[npx36 EVENT ERROR]", err);
    }
  }
};