const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_FILENAME = "shourov10.mp4";
const CACHE_DIR = path.join(__dirname, "cache");
const CACHE_PATH = path.join(CACHE_DIR, CACHE_FILENAME);
// re-download if older than this (ms). Default: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

module.exports = {
  config: {
    name: ".shourov10",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5,
  },

  // event handler: listens for messages (no-prefix command)
  handleEvent: async function ({ api, event }) {
    try {
      const { threadID, messageID } = event;
      const content = event.body ? String(event.body).trim().toLowerCase() : "";

      // trigger tokens: starting with "1" or the emoji 🥹
      if (!(content.startsWith("1") || content.startsWith("🥹"))) return;

      // ensure cache dir exists
      await fs.ensureDir(CACHE_DIR);

      // URL of the video (replace if you want another)
      const videoURL = "https://i.imgur.com/fPwwRS3.mp4";

      // decide whether to (re)download
      let needDownload = true;
      try {
        const stat = await fs.stat(CACHE_PATH);
        const age = Date.now() - stat.mtimeMs;
        if (age < CACHE_TTL) needDownload = false;
      } catch (e) {
        // file doesn't exist or unreadable -> download
        needDownload = true;
      }

      if (needDownload) {
        // download to temp file then rename
        const tmpPath = CACHE_PATH + ".tmp";
        const resp = await axios.get(videoURL, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 20000
        });

        await new Promise((resolve, reject) => {
          const stream = resp.data.pipe(fs.createWriteStream(tmpPath));
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

        // move tmp to cache path (atomic-ish)
        await fs.move(tmpPath, CACHE_PATH, { overwrite: true });
      }

      // send message with attachment from cached file
      const readStream = fs.createReadStream(CACHE_PATH);
      const msg = {
        body: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
        attachment: readStream,
      };

      api.sendMessage(msg, threadID, (err, info) => {
        try {
          if (err) {
            console.error("[.shourov10] sendMessage error:", err);
            return api.sendMessage("❌ ভিডিও পাঠাতে সমস্যা হয়েছে!", threadID, messageID);
          }
          // add reaction (best-effort)
          try {
            api.setMessageReaction("😭", messageID, () => {}, true);
          } catch (e) {
            // some libs might not support reactions or require different params
          }
        } catch (e) {
          console.error("[.shourov10] after-send error:", e);
        } finally {
          // close stream if still open
          try { readStream.close && readStream.close(); } catch(e){}
        }
      });
    } catch (err) {
      console.error("[.shourov10] handler error:", err && err.stack ? err.stack : err);
      try { await api.sendMessage("❌ একটি ত্রুটি ঘটেছে — পরে চেষ্টা করুন।", event.threadID); } catch(e){}
    }
  },

  start: function () {
    console.log("[.shourov10] Module loaded.");
  }
};