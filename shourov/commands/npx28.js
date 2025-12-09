const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov7",
    version: "1.0.3",
    prefix: false,
    permission: 0,      // অনুমতি স্তর
    credits: "nayan",
    description: "Fun (no prefix) — sends video when trigger found",
    category: "no prefix",
    usages: "trigger: '6' (or customize)",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body).toLowerCase().trim();

      // Trigger list — চাইলে এখানে আরো যোগ/পরিবর্তন করুন
      const triggers = ["6"];

      if (!triggers.some(trigger => text.includes(trigger))) return;

      // মিডিয়া লিংক — প্রয়োজনে পরিবর্তন করুন
      const videoUrl = "https://files.catbox.moe/h1c7pz.mp4";

      // ভিডিও লোড (stream)
      const response = await axios.get(videoUrl, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });

      const msg = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: response.data
      };

      // পাঠানোর পরে reaction সেট করুন (info.messageID ব্যবহার করে)
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("Send message error:", err);
          return api.sendMessage("❌ ভিডিও পাঠানো যায়নি!", threadID, messageID);
        }
        try {
          api.setMessageReaction("😓", info.messageID, () => {}, true);
        } catch (e) {
          console.error("Reaction error:", e);
        }
      }, messageID);

    } catch (err) {
      console.error("Shourov7 handleEvent error:", err && (err.stack || err));
      try {
        api.sendMessage("সবাই কি বস সৌরভ'র মতো একা🙂", event.threadID, event.messageID);
      } catch (e) { /* ignore */ }
    }
  },

  start: function () {
    console.log("[Shourov7] module loaded");
  }
};