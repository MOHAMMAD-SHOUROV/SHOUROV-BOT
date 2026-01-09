const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "loveauto",
    version: "1.0.4",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Love emoji auto audio reply",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body);

      const triggers = ["😍", "🥰", "🤩", "❤️"];
      if (!triggers.some(t => text.includes(t))) return;

      const audioPath = path.join(
        __dirname,
        "shourov",
        "এত ভালোবাসা কই পাও আ (1).m4a"
      );

      if (!fs.existsSync(audioPath)) {
        console.log("[loveauto] Audio not found:", audioPath);
        return;
      }

      api.sendMessage(
        {
          body: "এঁতঁ ভাঁলোঁবাঁসাঁ পাঁওঁ আঁমাঁরঁ বঁসঁ সৌঁরঁভঁ কেঁ এঁকঁটুঁ দেঁওঁ 😘",
          attachment: fs.createReadStream(audioPath)
        },
        threadID,
        messageID
      );

    } catch (e) {
      console.error("[loveauto] error:", e);
    }
  },

  run: async function () {}
};