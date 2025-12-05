const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "npx21",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov (fixed by assistant)",
    description: "Reply with a fun video when trigger words appear (robust + cached).",
    category: "no prefix",
    usages: "type trigger words (see triggers array)",
    cooldowns: 5,
  },

  // handleEvent is called for every incoming message (no-prefix behavior)
  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID } = event;
      const body = (event.body || "").toString().trim();
      if (!body) return;

      const lower = body.toLowerCase();

      // triggers - add or remove any phrases/emojis you want to respond to
      const triggers = [
        "bura beti",
        "😵‍💫",
        "bura beti!",
        "bura beti ",
        // add more variants if needed
      ];

      // if none matched, skip
      if (!triggers.some(t => lower.startsWith(t) || lower === t)) return;

      // prepare cache path
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filename = "shourov21.mp4";
      const filePath = path.join(cacheDir, filename);

      // remote video url (direct .mp4 link)
      const remoteUrl = "https://i.imgur.com/6EaYYaU.mp4";

      // if file is not cached, download it
      if (!await fs.pathExists(filePath)) {
        const res = await axios.get(remoteUrl, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
          timeout: 20000
        });

        // stream to temp file
        const writer = fs.createWriteStream(filePath);
        await new Promise((resolve, reject) => {
          res.data.pipe(writer);
          let handled = false;
          writer.on("finish", () => { if (!handled) { handled = true; resolve(); } });
          writer.on("close", () => { if (!handled) { handled = true; resolve(); } });
          writer.on("error", err => { if (!handled) { handled = true; reject(err); } });
          res.data.on("error", err => { if (!handled) { handled = true; reject(err); } });
        });
      }

      // send the video as attachment (use createReadStream to avoid memory spikes)
      const message = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: fs.createReadStream(filePath)
      };

      // send and react (best-effort)
      api.sendMessage(message, threadID, async (err, info) => {
        if (err) {
          console.error("Failed to send video:", err);
          try { await api.sendMessage("😕 ভিডিও পাঠাতে সমস্যা হয়েছে!", threadID, messageID); } catch (e) {}
          return;
        }
        // try to set a reaction (ignore errors)
        try { api.setMessageReaction("😓", info.messageID || messageID, () => {}, true); } catch (e) {}
      });

      // NOTE: we keep cached file to speed up later sends.
      // If you want to remove file after sending, uncomment the line below:
      // await fs.unlink(filePath).catch(()=>{});

    } catch (error) {
      console.error("npx21 handleEvent error:", error && (error.stack || error));
      try { api.sendMessage("❗ কিছু ভুল হয়েছে (npx21)।", event.threadID); } catch (e) {}
    }
  },

  // optional start hook
  start: function () {
    console.log("[fahim6] Module loaded.");
  }
};