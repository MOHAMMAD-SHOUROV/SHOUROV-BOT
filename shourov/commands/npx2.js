const request = require("request");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "npx2",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun auto video reply",
    category: "no prefix",
    usages: "love / ❤️‍🔥 / 💌 / 💘 / 💟 / i love you / valobashi / 🖤",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body).toLowerCase();

      // triggers (you can add/remove items)
      const triggers = [
        "love", "❤️‍🔥", "💌", "💘", "💟",
        "i love u", "i love you", "valobashi", "🖤"
      ];

      // match if message *starts with* or *includes* any trigger
      const matched = triggers.some(trigger => text.startsWith(trigger) || text.includes(trigger));
      if (!matched) return;

      // download media as buffer
      request.get({ url: "https://files.catbox.moe/6yzt2m.mp4", encoding: null, timeout: 20000 }, (err, res, buffer) => {
        if (err || !buffer || buffer.length === 0) {
          // fallback text if download fails
          return api.sendMessage("আমার বস সৌরভ'র পক্ষ থেকে i love you😍🙊", threadID, messageID);
        }

        // convert buffer to readable stream (some bot libs accept Buffer directly too)
        const stream = Readable.from(buffer);

        const msg = {
          body: "ভালোবাসা সুন্দর 🖤 𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
          attachment: stream
        };

        // send and react on the message the bot just sent (info.messageID)
        api.sendMessage(msg, threadID, (sendErr, info) => {
          if (sendErr) {
            console.error("[npx2] sendMessage error:", sendErr);
            return;
          }
          try {
            // react to the bot's own sent message
            api.setMessageReaction("🖤", info.messageID, () => {}, true);
          } catch (e) {
            // ignore reaction failures
            console.error("[npx2] setMessageReaction error:", e);
          }
        }, messageID);
      });
    } catch (error) {
      console.error("[npx2] handleEvent error:", error && (error.stack || error));
    }
  },

  run: function () {}
};