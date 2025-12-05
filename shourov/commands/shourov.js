// commands/01shourov.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "01shourov",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov (fixed)",
    description: "Respond to mentions of Shourov with a video",
    category: "no prefix",
    usages: "no prefix",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    try {
      if (!event || !event.body) return;
      const { threadID, messageID } = event;
      const body = String(event.body).toLowerCase();

      // trigger words (all lowered for comparison)
      const triggerWords = [
        "সৌরভ", "shourov", "bos k", "sourov", "sowrov", "sad"
      ];

      const matched = triggerWords.some(w => {
        // startsWith OR whole-body equals OR includes — adjust as desired
        return body.startsWith(w) || body === w || body.includes(w);
      });

      if (!matched) return;

      // ensure cache dir
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, "01shourov.mp4");

      // if file not present or is empty, download it
      const needDownload = !(await fs.pathExists(filePath)) || (await fs.stat(filePath)).size === 0;
      if (needDownload) {
        // <-- REPLACE THIS URL with your working direct .mp4 link if needed -->
        const videoURL = "https://i.imgur.com/23eTYBu.mp4";

        const res = await axios.get(videoURL, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 30000
        });

        // write to file
        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);

        // wait for finish
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      }

      // send message using a fresh stream each time
      const msg = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: fs.createReadStream(filePath)
      };

      await api.sendMessage(msg, threadID);
      // add reaction (best-effort)
      try { api.setMessageReaction("😓", messageID, () => {}, true); } catch (e) { /* ignore */ }

    } catch (err) {
      console.error("[01shourov] handleEvent error:", err && (err.stack || err));
      try {
        // fallback short reply
        if (event && event.threadID) await api.sendMessage("😈 Alihsan Shourov my boss", event.threadID, event.messageID);
      } catch (e) { /* ignore */ }
    }
  },

  start: function () {
    console.log("[shourov] Module loaded ✅");
  }
};