const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov8",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan",
    description: "Trigger-based fun reply with video",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const text = body.toLowerCase().trim();

    // triggers (improved)
    const triggers = ["8", "🗯8"];
    if (!triggers.some(t => text.includes(t))) return;

    try {
      const response = await axios.get("https://files.catbox.moe/kp8t84.mp4", {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });

      const msg = {
        body: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
        attachment: response.data
      };

      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.log("❌ Send failed:", err);
          return api.sendMessage("⚠️ ভিডিও পাঠানো যায়নি!", threadID);
        }

        // Correct: reaction on SENT message
        api.setMessageReaction("😓", info.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("🔴 ভিডিও লোড সমস্যা:", err.message);
      api.sendMessage("💔 বস সৌরভ'র পক্ষ থেকে উম্মাহ…", threadID);
    }
  },

  start: () => {}
};