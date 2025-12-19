const axios = require("axios");

module.exports = {
  config: {
    name: "npx27",
    version: "1.0.2",
    prefix: false,
    permission: 0,           // fixed spelling
    credits: "nayan",
    description: "Trigger-based fun reply",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body).toLowerCase();
      const triggers = ["👻", "😈"];

      // check if any trigger exists in the message (emojis unaffected by toLowerCase)
      if (triggers.some(trigger => text.includes(trigger))) {
        try {
          const response = await axios.get("https://files.catbox.moe/1bx2l9.mp4", {
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 30000
          });

          const msg = {
            body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
            attachment: response.data
          };

          // send and then set reaction on the sent message (use info.messageID)
          api.sendMessage(msg, threadID, (err, info) => {
            if (err) {
              console.error("Send message error:", err);
              return api.sendMessage("❌ ভিডিও পাঠানো যাচ্ছে না!", threadID, messageID);
            }
            // set reaction on the message that was just sent
            try {
              api.setMessageReaction("😓", info.messageID, () => {}, true);
            } catch (e) {
              console.error("Reaction error:", e);
            }
          }, messageID);

        } catch (err) {
          console.error("ভিডিও লোড এ এরর:", err && (err.stack || err));
          api.sendMessage("ভিডিও লোড করতে সমস্যা হয়েছে!", threadID, messageID);
        }
      }
    } catch (error) {
      console.error("npx27 handleEvent error:", error && (error.stack || error));
    }
  },

  start: function () {
    console.log("[npx27] Module loaded.");
  }
};