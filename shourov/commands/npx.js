const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "emoji_sound",
    version: "1.0.1",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Responds to certain emojis by sending an MP3",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body).toLowerCase();

      // triggers — change / add emojis or words here
      const triggers = ["😒", "🙄", "😳", "👀", "👁️"];

      // check if any trigger is at start or contained — choose your behavior
      const isTriggered = triggers.some(trigger => text.startsWith(trigger) || text.includes(trigger));

      if (!isTriggered) return;

      // relative path to your audio file (adjust if you keep it somewhere else)
      const filePath = path.join(__dirname, "Nayan", "Mayabi.mp3");

      if (!fs.existsSync(filePath)) return; // if file missing, do nothing

      const stream = fs.createReadStream(filePath);
      const msg = {
        body: "এঁভাঁবেঁ তাঁকাঁসঁ নাঁ প্রেঁমেঁ পঁরেঁ যাঁবোঁ 😚🥀 𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: stream
      };

      // send message and react to the message the bot just sent
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("[emoji_sound] sendMessage error:", err);
          return;
        }
        try {
          // react to the message that was sent by the bot
          api.setMessageReaction("😁", info.messageID, () => {}, true);
        } catch (e) {
          // ignore reaction errors
        }
      }, messageID);
    } catch (error) {
      console.error("[emoji_sound] handleEvent error:", error && (error.stack || error));
    }
  },

  start: function () {
    console.log("[emoji_sound] module loaded");
  }
};