const axios = require("axios");

module.exports = {
  config: {
    name: "shourov11",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan",
    description: "Fun command on emoji or message",
    category: "no prefix",
    usages: "😡 or 'call a aso'",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const lowered = body.toLowerCase();

    if (lowered.startsWith("call a aso") || lowered.startsWith("😡")) {
      try {
        const videoUrl = "https://files.catbox.moe/6c0keb.mp4";

        const response = await axios.get(videoUrl, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 30000
        });

        const msg = {
          body: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 ",
          attachment: response.data
        };

        // sendMessage callback returns (err, info) where info.messageID is the sent message id
        api.sendMessage(msg, threadID, (err, info) => {
          if (err) {
            console.error("Send message failed:", err);
            // fallback: notify in chat
            return api.sendMessage("❌ ভিডিও পাঠানো যায়নি!", threadID, messageID);
          }
          try {
            api.setMessageReaction("🤣", info.messageID, () => {}, true);
          } catch (e) {
            console.error("Reaction failed:", e);
          }
        });

      } catch (error) {
        console.error("Video fetch error:", error && error.message ? error.message : error);
        // user-friendly fallback
        api.sendMessage("🤣 (ভিডিও লোড করতে সমস্যা হয়েছে)", threadID, messageID);
      }
    }
  },

  start() {} // Empty start function
};