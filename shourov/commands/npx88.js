const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "breakup",
    prefix: false
  },

  handleEvent: async ({ api, event }) => {
    if (!event.body) return;

    const triggers = ["💔", "🖤", "🥺", "😢"];
    if (!triggers.some(t => event.body.includes(t))) return;

    const audioPath = path.join(__dirname, "shourov", "brkup.mp3");
    if (!fs.existsSync(audioPath)) return;

    api.sendMessage(
      {
        body: "জাঁনেঁমাঁনঁ তোঁমাঁরঁ কিঁ breakup হঁয়ঁছেঁ 😢",
        attachment: fs.createReadStream(audioPath)
      },
      event.threadID,
      event.messageID
    );
  },

  run: async () => {}
};