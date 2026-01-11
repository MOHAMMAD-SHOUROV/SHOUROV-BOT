const axios = require("axios");

module.exports = {
  config: {
    name: "npx25",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return; // safety

      const lowerBody = body.toString().toLowerCase();

      // Trigger: message starts with "4" (you can extend this)
      if (lowerBody.startsWith("💔")) {
        const videoUrl = "https://files.catbox.moe/pe0jio.mp4";

        try {
          const response = await axios.get(videoUrl, {
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 30000
          });

          const msg = {
            body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
            attachment: response.data
          };

          // send message (stream)
          api.sendMessage(msg, threadID, (err, info) => {
            if (err) {
              console.error("Send message error:", err);
              return api.sendMessage("⚠️ ভিডিও পাঠানো যায়নি!", threadID, messageID);
            }

            // set reaction only if we have a messageID (info.messageID)
            const mid = info && info.messageID ? info.messageID : messageID;
            if (mid) {
              api.setMessageReaction("🥰", mid, () => {}, true);
            }
          }, messageID);

        } catch (err) {
          console.error("❌ ভিডিও লোড/ডাউনলোডে সমস্যা:", err.message || err);
          return api.sendMessage("⚠️ ভিডিও লোড করা যাচ্ছে না, পরে চেষ্টা করুন।", threadID, messageID);
        }
      }
    } catch (e) {
      console.error("npx25 handleEvent error:", e);
    }
  },

  start: () => {
    console.log("[npx25] loaded");
  },
};