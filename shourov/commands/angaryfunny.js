// commands/shourovvideo.js
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports = {
  config: {
    name: "shourovvideo",
    version: "1.0.1",
    permission: 0,
    credits: "Shourov (fixed by assistant)",
    prefix: false,
    category: "media",
    usages: "",
    cooldowns: 5
  },

  // in-memory locks to avoid concurrent downloads of same file
  _downloadLocks: new Map(),

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const input = body.toLowerCase().trim();
    if (!(input.startsWith("call a aso") || input.startsWith("😡"))) return;

    const cacheFolder = path.join(__dirname, "cache");
    const fileName = "hj4iPpe.mp4";
    const filePath = path.join(cacheFolder, fileName);
    const videoUrl = "https://i.imgur.com/hj4iPpe.mp4";

    try {
      // ensure cache dir exists
      await fs.ensureDir(cacheFolder);

      // if file already exists -> send immediately
      if (!(await fs.pathExists(filePath))) {
        // if a download for this file is already in progress, await it
        if (this._downloadLocks.has(filePath)) {
          await this._downloadLocks.get(filePath);
        } else {
          // create a promise and store as lock
          const downloadPromise = (async () => {
            // download to a temporary file first
            const tmpPath = filePath + ".download";
            // remove any stale tmp
            try { await fs.remove(tmpPath); } catch (e) { /* ignore */ }

            const response = await axios.get(videoUrl, {
              responseType: "stream",
              timeout: 30000,
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible)"
              },
              maxContentLength: 1024 * 1024 * 500 // 500MB limit as guard (adjust if needed)
            });

            // pipe safely
            await streamPipeline(response.data, fs.createWriteStream(tmpPath));

            // move tmp to final (atomic-ish)
            await fs.move(tmpPath, filePath, { overwrite: true });
          })();

          // set lock
          this._downloadLocks.set(filePath, downloadPromise);
          try {
            await downloadPromise;
          } finally {
            // remove lock always
            this._downloadLocks.delete(filePath);
          }
        }
      }

      // send video from cache
      await api.sendMessage(
        {
          body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓 🤍",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        // callback optional - not relied upon
        (err) => {
          // attempt to react; ignore reaction errors
          try {
            api.setMessageReaction("🤣", messageID, () => {}, true);
          } catch (e) { /* ignore */ }
        }
      );
    } catch (err) {
      // log full error server-side
      console.error("[shourovvideo] error:", err && err.stack ? err.stack : err);

      // try to give user a friendly fallback
      try {
        await api.sendMessage("ভিডিও লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।", threadID, messageID);
      } catch (e) { /* ignore */ }
    }
  },

  start: () => {}
};