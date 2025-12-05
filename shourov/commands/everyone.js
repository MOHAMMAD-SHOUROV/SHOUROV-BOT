const axios = require("axios");

module.exports = {
  config: {
    name: "everyone",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan",
    description: "Fun auto-reply with video",
    category: "no prefix",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = body.toLowerCase();
      const triggers = ["@everyone", "jikir", "জিকির"];

      // Trigger check
      if (!triggers.some(w => text.includes(w))) return;

      // Fetch video
      const video = (
        await axios.get("https://files.catbox.moe/omt6x5.mp4", {
          responseType: "stream"
        })
      ).data;

      const msg = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: video
      };

      api.sendMessage(msg, threadID, (err) => {
        api.setMessageReaction("🤣", messageID, () => {}, true);
      });

    } catch (err) {
      console.error("❌ ERROR:", err.message);
      api.sendMessage("⚠️ ভিডিও আনতে সমস্যা হয়েছে!", event.threadID, event.messageID);
    }
  },

  run: () => {}
};