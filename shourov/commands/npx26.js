const axios = require("axios");

module.exports = {
  config: {
    name: "Shourov5",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan",
    description: "Fun auto reply video",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const content = body.toLowerCase();

      // Trigger word → "5"
      if (content.startsWith("5")) {

        const url = "https://files.catbox.moe/qe7wlc.mp4";

        try {
          const response = await axios.get(url, { responseType: "stream" });

          const msg = {
            body: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 💙",
            attachment: response.data
          };

          api.sendMessage(msg, threadID, (err, info) => {
            if (err) {
              console.error("Send error:", err);
              return api.sendMessage("❌ ভিডিও পাঠানো যাচ্ছে না!", threadID);
            }

            // If msg sent successfully, set reaction
            api.setMessageReaction("😆", info.messageID, () => {}, true);
          });

        } catch (error) {
          console.error("⚠️ ভিডিও লোড করতে সমস্যা:", error.message);
          api.sendMessage("❌ ভিডিও লোড করতে সমস্যা হয়েছে!", threadID, messageID);
        }
      }
    } catch (err) {
      console.error("Shourov5 error:", err);
    }
  },

  start: () => {
    console.log("[Shourov5] Module loaded successfully!");
  }
};