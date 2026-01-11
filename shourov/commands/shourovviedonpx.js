const axios = require("axios");

module.exports = {
  config: {
    name: "npx36",
    version: "1.2.1",
    permission: 0,
    prefix: false,
    credits: "shourov",
    description: "Auto trigger multi video (single body)",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = body.toLowerCase();

      // 🔒 সব ভিডিওর জন্য একটাই body
      const BODY_TEXT = "🖤 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤";

      // 🔑 trigger + video rules
      const rules = [
        {
          triggers: ["king", "shourov", "সৌরভ"],
          videos: [
            "https://files.catbox.moe/8sctaw.mp4",
            "https://files.catbox.moe/omt6x5.mp4",
            "https://files.catbox.moe/1bx2l9.mp4"
          ]
        },
        {
          triggers: ["bura beti", "😵‍💫", "bura beti!", "😵"],
          videos: [
            "https://i.imgur.com/6EaYYaU.mp4"
          ]
        },
        {
          triggers: ["4"],
          videos: [
            "https://files.catbox.moe/pe0jio.mp4"
          ]
        },
        {
          triggers: [
            "love", "❤️‍🔥", "💌", "💘", "💟",
            "i love u", "i love you", "valobashi", "🖤"
          ],
          videos: [
            "https://files.catbox.moe/6yzt2m.mp4"
          ]
        }
      ];

      for (const rule of rules) {
        if (rule.triggers.some(t => text.includes(String(t).toLowerCase()))) {

          // 🎲 random video
          const videoURL =
            rule.videos[Math.floor(Math.random() * rule.videos.length)];

          const res = await axios.get(videoURL, {
            responseType: "stream",
            timeout: 30000
          });

          return api.sendMessage(
            {
              body: BODY_TEXT,
              attachment: res.data
            },
            threadID,
            messageID
          );
        }
      }

    } catch (err) {
      console.error("[npx36] error:", err.message);
    }
  },

  // loader error avoid
  run: async function () {}
};