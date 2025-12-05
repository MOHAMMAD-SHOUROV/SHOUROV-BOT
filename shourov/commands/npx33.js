const axios = require("axios");

module.exports = {
  config: {
    name: "shourov12",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan",
    description: "Fun audio trigger",
    category: "no prefix",
    usages: "🥰 or 😍",
    cooldowns: 5,
  },

  handleEvent: async function({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const lowered = body.toLowerCase();

    // ✅ startsWith কাজ নাও করতে পারে— তাই includes ভালো
    const triggers = ["🥰", "😍"];

    if (!triggers.some(t => lowered.includes(t))) return;

    try {
      const url = "https://files.catbox.moe/dtp1ph.mp4";
      const response = await axios.get(url, { responseType: "stream" });

      const msg = {
        body: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 💞",
        attachment: response.data
      };

      // ✅ sent message-এর ID নিয়ে রিঅ্যাকশন দেওয়া
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;

        api.setMessageReaction("🤭", info.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("⚠️ মিডিয়া পাঠাতে সমস্যা:", err.message);
      api.sendMessage("🥺 মিডিয়া পাঠানো যায়নি!", threadID, messageID);
    }
  },

  start() {}
};