const request = require("request");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "npx3",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun auto video reply",
    category: "no prefix",
    usages: "10",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID } = event;
      const body = (event.body || "").toString();
      if (!body) return;

      const text = body.toLowerCase();

      // triggers (adjust as needed)
      const triggers = ["10"];
      const matched = triggers.some(trigger => text.startsWith(trigger) || text.includes(trigger));
      if (!matched) return;

      // list of videos to pick from
      const videos = [
        "https://files.catbox.moe/mrtvhb.mp4",
        "https://files.catbox.moe/env58m.mp4"
      ];
      const chosen = videos[Math.floor(Math.random() * videos.length)];

      // download as buffer
      request.get({ url: chosen, encoding: null, timeout: 20000 }, (err, res, buffer) => {
        if (err || !buffer || buffer.length === 0) {
          return api.sendMessage("আমার বস সৌরভকে একটু ভালোবাসা দাও 😍🙊", threadID, messageID);
        }

        const stream = Readable.from(buffer);
        const msg = {
          body: "🖤🥀 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
          attachment: stream
        };

        // send and react on the message the bot sends (info.messageID)
        api.sendMessage(msg, threadID, (sendErr, info) => {
          if (sendErr) {
            console.error("[npx3] sendMessage error:", sendErr);
            return;
          }
          try {
            api.setMessageReaction("🖤", info.messageID, () => {}, true);
          } catch (e) {
            console.error("[npx3] setMessageReaction error:", e);
          }
        }, messageID);
      });
    } catch (e) {
      console.error("[npx3] handleEvent error:", e && (e.stack || e));
      try { api.sendMessage("⚠️ একটি অপ্রত্যাশিত সমস্যা হয়েছে!", event.threadID); } catch (err) {}
    }
  },

  run: function () {}
};