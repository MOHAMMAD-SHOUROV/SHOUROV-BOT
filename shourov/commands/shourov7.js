const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "shourov7",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun command with media",
    category: "no prefix",
    usages: "😒 or call a aso",
    cooldowns: 5
  },

  handleEvent: async function({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body || typeof body !== "string") return;

      const lowerBody = body.trim().toLowerCase();

      // triggers: phrase or emoji
      if (lowerBody.startsWith("call a aso") || lowerBody.startsWith("😡") || lowerBody === "😡") {
        const mediaUrl = "https://i.imgur.com/hj4iPpe.mp4";
        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);
        const outPath = path.join(cacheDir, `shourov7_${Date.now()}.mp4`);

        // download binary
        const resp = await axios.get(mediaUrl, { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(outPath, Buffer.from(resp.data));

        // prepare message
        const msg = {
          body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
          attachment: fs.createReadStream(outPath)
        };

        // send and cleanup
        api.sendMessage(msg, threadID, (err, info) => {
          // remove temporary file
          try { fs.unlinkSync(outPath); } catch (e) { /* ignore */ }

          if (err) {
            console.error("Error sending media:", err);
            return;
          }

          // React to the ORIGINAL incoming message (optional)
          try {
            api.setMessageReaction("🤣", messageID, () => {}, true);
          } catch (e) {
            // some api implementations differ — ignore reaction errors
          }
        });
      }
    } catch (error) {
      console.error("shourov7 handleEvent error:", error && (error.stack || error));
    }
  },

  // kept for loader compatibility (no-prefix module)
  start: function () {}
};