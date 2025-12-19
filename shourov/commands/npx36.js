// shourov/commands/shourovlove99.js
const axios = require("axios");

module.exports.config = {
  name: "shourovlove99",
  version: "1.0.3",
  permission: 0,
  prefix: false, // ❗ no prefix
  credits: "shourov",
  description: "Auto love video when keyword detected",
  category: "no prefix",
  usages: "auto",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    if (!event.body) return;

    const text = String(event.body).toLowerCase();

    // ✅ triggers
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

    const msg = {
      body: "🖤 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
      attachment: res.data
    };

    api.sendMessage(msg, event.threadID, (err, info) => {
      if (err) {
        console.error("shourovlove99 send error:", err);
        return;
      }
      // reaction on bot message
      try {
        api.setMessageReaction("🖤", info.messageID, () => {}, true);
      } catch (e) {}
    });

  } catch (err) {
    console.error("shourovlove99 error:", err);
  }
};