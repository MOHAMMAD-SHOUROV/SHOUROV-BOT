const axios = require('axios');

module.exports = {
  config: {
    name: "shourov7",
    version: "1.0.1",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun command with media",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5
  },

  handleEvent: async function({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const lowerBody = body.toLowerCase();

    if (lowerBody.startsWith("call a aso") || lowerBody.startsWith("😡")) {
      try {
        const mediaUrl = "https://i.imgur.com/hj4iPpe.mp4";

        // download video as stream
        const response = await axios.get(mediaUrl, {
          responseType: "stream"
        });

        const msg = {
          body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
          attachment: response.data
        };

        // Correct sendMessage format
        api.sendMessage(msg, threadID, (err, info) => {
          if (!err) {
            api.setMessageReaction("🤣", messageID, () => {}, true);
          }
        });

      } catch (error) {
        console.error("Video Send Error:", error.message);
      }
    }
  },

  start: function () {}
};