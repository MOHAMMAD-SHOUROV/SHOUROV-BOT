const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov7",
    version: "1.0.2",
    prefix: false,
    permission: 0,      // fixed spelling
    credits: "nayan",
    description: "Fun",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = body.toLowerCase().trim();
      // a single trigger '6' is enough; change/add triggers as needed
      const triggers = ["6"];

      if (!triggers.some(trigger => text.includes(trigger))) return;

      try {
        const response = await axios.get("https://files.catbox.moe/h1c7pz.mp4", {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 30000
        });

        const msg = {
          body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
          attachment: response.data
        };

        // send message and use info.messageID to set reaction on the sent message
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
        console.error("❌ ভিডিও আনতে সমস্যা:", err.message || err);
        api.sendMessage("সবাই কি বস সৌরভ'র মতো একা🙂", threadID, messageID);
      }
    } catch (err) {
      console.error("Shourov7 handleEvent error:", err);
    }
  },

  start: function () {}
};