const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov5",
    version: "1.0.3",
    prefix: false,
    permission: 0,
    credits: "nayan + optimized by shourov",
    description: "Fun auto reply video when message starts with '5'",
    category: "no prefix",
    usages: "auto trigger",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const content = body.toLowerCase().trim();

      // 🔥 Trigger condition → message starts with "5"
      if (!content.startsWith("5")) return;

      const videoURL = "https://files.catbox.moe/qe7wlc.mp4";

      try {
        const res = await axios.get(videoURL, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 25000
        });

        const msg = {
          body: "💙 𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓💙",
          attachment: res.data
        };

        api.sendMessage(msg, threadID, (err, info) => {
          if (err) {
            console.error("Send Error:", err);
            return api.sendMessage("❌ ভিডিও পাঠানো যাচ্ছে না!", threadID, messageID);
          }

          // ✔ Correct: react to bot's own message
          try {
            api.setMessageReaction("😆", info.messageID, () => {}, true);
          } catch (e) {
            console.error("Reaction Error:", e);
          }
        });

      } catch (e) {
        console.error("Video Load Error:", e.message);
        api.sendMessage("⚠️ ভিডিও লোড করতে সমস্যা হয়েছে!", threadID, messageID);
      }

    } catch (err) {
      console.error("[Shourov5] Fatal Error:", err);
    }
  },

  start: () => console.log("[Shourov5] Module loaded successfully!")
};