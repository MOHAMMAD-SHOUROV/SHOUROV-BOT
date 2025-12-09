const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov8",
    version: "1.0.3",
    prefix: false,
    permission: 0,
    credits: "nayan (optimized by ChatGPT)",
    description: "Trigger-based fun reply with video",
    category: "no prefix",
    usages: "😒 / 8 / 🗯8",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    try {
      if (!event.body) return;

      const { threadID, messageID } = event;
      const text = event.body.toString().trim().toLowerCase();

      // 🎯 **Triggers**
      const triggers = ["8", "🗯8", "😒"];
      if (!triggers.some(t => text.includes(t))) return;

      // 🎬 Video link
      const videoURL = "https://files.catbox.moe/kp8t84.mp4";

      // 📥 Download stream
      const res = await axios.get(videoURL, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      // Message + video
      const msg = {
        body: "💀 𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 উপস্থিত 💀",
        attachment: res.data
      };

      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.log("❌ Send error:", err);
          return api.sendMessage("⚠️ ভিডিও পাঠানো গেল না!", threadID);
        }

        // 😂 Reaction on bot's message
        try {
          api.setMessageReaction("😓", info.messageID, () => {}, true);
        } catch {}
      });

    } catch (err) {
      console.error("❌ Error:", err.message || err);
      api.sendMessage("💔 বস সৌরভ'র পক্ষ থেকে উম্মাহ…", event.threadID);
    }
  },

  start: () => {}
};