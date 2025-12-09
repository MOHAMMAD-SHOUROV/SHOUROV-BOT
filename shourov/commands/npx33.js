// commands/shourov12.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
const FILE_PATH = path.join(CACHE_DIR, "shourov12.mp4");
// মিডিয়া লিংক (আপনি চাইলে পরিবর্তন করতে পারবেন)
const MEDIA_URL = "https://files.catbox.moe/dtp1ph.mp4";

module.exports = {
  config: {
    name: "shourov12",
    version: "1.0.3",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun audio trigger (cached, no stream reuse issues)",
    category: "no prefix",
    usages: "🥰 or 😍",
    cooldowns: 5,
  },

  handleEvent: async function({ api, event }) {
    try {
      const { threadID, messageID, body } = event;
      if (!body) return;

      const text = String(body);
      const triggers = ["🥰", "😍"];

      // include() ব্যবহার করে চেক করা হচ্ছে — emoji/partial match সবই ধরা পড়বে
      if (!triggers.some(t => text.includes(t))) return;

      // ensure cache dir exists
      await fs.ensureDir(CACHE_DIR);

      // যদি ফাইল না থাকে বা ফাইল খারাপ থাকে → ডাউনলোড করো
      let needDownload = true;
      if (await fs.pathExists(FILE_PATH)) {
        try {
          const stat = await fs.stat(FILE_PATH);
          if (stat.size > 0) needDownload = false;
        } catch (e) {
          needDownload = true;
        }
      }

      if (needDownload) {
        const res = await axios.get(MEDIA_URL, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 30000
        });
        const writer = fs.createWriteStream(FILE_PATH);
        res.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      }

      // প্রতিবার নতুন ReadStream দিয়ে পাঠাও (stream reuse সমস্যা থাকবে না)
      const msg = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓 💞",
        attachment: fs.createReadStream(FILE_PATH)
      };

      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("[shourov12] sendMessage error:", err);
          return;
        }
        // reaction to the bot's sent message
        try {
          api.setMessageReaction("🤭", info.messageID, () => {}, true);
        } catch (e) {
          // ignore reaction errors
        }
      });

    } catch (err) {
      console.error("[shourov12] ERROR:", err && (err.stack || err));
      try {
        api.sendMessage("🥺 মিডিয়া পাঠানো যায়নি!", event.threadID, event.messageID);
      } catch (e) {}
    }
  },

  start() {
    console.log("[shourov12] Loaded");
  }
};