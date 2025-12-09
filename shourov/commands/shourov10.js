const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_FILENAME = "shourov10.mp4";
const CACHE_DIR = path.join(__dirname, "cache");
const CACHE_PATH = path.join(CACHE_DIR, CACHE_FILENAME);

// Cache expires after 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;

module.exports.config = {
  name: "shourov10",
  version: "1.0.3",
  permission: 0,
  prefix: false, 
  credits: "SHOUROV",
  description: "No-prefix fun video trigger",
  category: "no prefix",
  usages: "🥹 or 1",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const body = event.body ? event.body.toLowerCase().trim() : "";
    if (!body) return;

    // 🔥 Trigger words / emojis
    const triggered =
      body.startsWith("1") ||
      body.startsWith("🥹");

    if (!triggered) return;

    const { threadID, messageID } = event;

    await fs.ensureDir(CACHE_DIR);

    const videoURL = "https://i.imgur.com/fPwwRS3.mp4";

    let needDownload = true;

    try {
      const stat = await fs.stat(CACHE_PATH);
      const age = Date.now() - stat.mtimeMs;
      if (age < CACHE_TTL) needDownload = false;
    } catch (_) {
      needDownload = true;
    }

    if (needDownload) {
      const tempPath = CACHE_PATH + ".tmp";

      const response = await axios.get(videoURL, {
        responseType: "stream",
        timeout: 20000
      });

      await new Promise((resolve, reject) => {
        const stream = response.data.pipe(fs.createWriteStream(tempPath));
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      await fs.move(tempPath, CACHE_PATH, { overwrite: true });
    }

    const attachment = fs.createReadStream(CACHE_PATH);

    api.sendMessage(
      {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment
      },
      threadID,
      (err) => {
        if (!err) {
          api.setMessageReaction("😭", messageID, () => {}, true);
        } else {
          api.sendMessage("❌ ভিডিও পাঠাতে সমস্যা হয়েছে!", threadID);
        }
      }
    );

  } catch (err) {
    console.error("[shourov10] error:", err);
    try {
      api.sendMessage("❌ একটি ত্রুটি ঘটেছে, পরে চেষ্টা করুন।", event.threadID);
    } catch (_) {}
  }
};

module.exports.run = function () {};