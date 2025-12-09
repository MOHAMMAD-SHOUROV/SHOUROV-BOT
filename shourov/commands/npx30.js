const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov9",
    version: "1.0.2",
    prefix: false,
    permission: 0,        // corrected
    credits: "nayan",
    description: "Fun (reply with video when 🤴 or 👸 present)",
    category: "no prefix",
    usages: "🤴 / 👸",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const text = String(body).toLowerCase();

    // trigger when message contains prince or princess emoji (or words)
    const triggered = text.includes("🤴") || text.includes("👸") || text.includes("prince") || text.includes("princess");

    if (!triggered) return;

    try {
      const res = await axios.get("https://files.catbox.moe/1bx2l9.mp4", {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });

      const msg = {
        body: "𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 👑",
        attachment: res.data
      };

      // send message and react to the actual sent message (info.messageID)
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("Send message failed:", err);
          return api.sendMessage("❌ ভিডিও পাঠানো যায়নি!", threadID, messageID);
        }
        try {
          api.setMessageReaction("😓", info.messageID, () => {}, true);
        } catch (e) {
          console.error("Reaction failed:", e);
        }
      });

    } catch (err) {
      console.error("Video load error:", err && (err.stack || err));
      // fallback text if the video can't be loaded
      try {
        api.sendMessage("❌ ভিডিও লোড করতে সমস্যা হয়েছে! পরে আবার চেষ্টা করুন।", threadID, messageID);
      } catch (e) {
        console.error("Fallback send failed:", e);
      }
    }
  },

  start: function () {}
};