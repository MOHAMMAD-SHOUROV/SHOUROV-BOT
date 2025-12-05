// commands/Shourov11.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { finished } = require("stream/promises");

module.exports = {
  config: {
    name: "Shourov11",
    version: "1.0.2",
    prefix: false,
    permission: 0,           // fixed typo (was permssion)
    credits: "nayan",
    description: "Fun (no-prefix) — responds to a few triggers by sending a short video",
    category: "no prefix",
    usages: "send 'call a aso' or an 😡 emoji",
    cooldowns: 5
  },

  handleEvent: async function({ api, event }) {
    const { threadID, messageID } = event;
    const body = event.body || "";
    if (!body) return;

    const lower = body.toLowerCase().trim();

    // triggers: exact startsWith checks (adjust as needed)
    if (lower.startsWith("call a aso") || lower.startsWith("😡") || lower === "call a aso") {
      // direct MP4 URL (ensure it is a direct .mp4 URL)
      const videoURL = "https://i.imgur.com/hj4iPpe.mp4";
      const cacheDir = path.join(__dirname, "cache");
      const filePath = path.join(cacheDir, "shourov_video.mp4");

      try {
        // ensure cache directory exists
        await fs.ensureDir(cacheDir);

        // request video stream
        const res = await axios.get(videoURL, { responseType: "stream", timeout: 20000 });

        // pipe to file
        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);

        // wait for stream to finish or throw on error
        await finished(writer);

        // send message with attachment
        await api.sendMessage({
          body: "Md Fahim Islam",
          attachment: fs.createReadStream(filePath)
        }, threadID);

        // set reaction (best-effort)
        try {
          api.setMessageReaction("🤣", messageID, () => {}, true);
        } catch (e) {
          // ignore reaction errors
        }

      } catch (err) {
        console.error("[Shourov11] error:", err && err.stack ? err.stack : err);
        // Inform thread about the failure in a user-friendly way
        try {
          await api.sendMessage("❌ Failed to load the video. Please try again later.", threadID, messageID);
        } catch (e) { /* ignore send errors */ }
      } finally {
        // cleanup file if it exists
        try {
          if (await fs.pathExists(filePath)) await fs.unlink(filePath);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    } // end trigger check
  },

  start: function() {
    console.log("[Shourov11] module loaded");
  }
};