// commands/shourov13.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
const FILE_PATH = path.join(CACHE_DIR, "shourov13.mp4");
const VIDEO_URL = "https://files.catbox.moe/7cf5c9.mp4"; // আপনার ভিডিও লিঙ্ক

module.exports = {
  config: {
    name: "shourov13",
    version: "1.0.3",
    prefix: false,
    permission: 0,
    credits: "nayan (fixed by ChatGPT)",
    description: "Sad reacts video (no prefix)",
    category: "no prefix",
    usages: "😭 or 🤧 or 3",
    cooldowns: 5,
  },

  handleEvent: async function({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const text = body.toString();
    const triggers = ["😭", "🤧", "3"];

    // ট্রিগার মিলছে কি?
    if (!triggers.some(t => text.includes(t))) return;

    try {
      // cache folder create
      await fs.ensureDir(CACHE_DIR);

      // যদি ফাইল নাই বা empty → download
      if (!await fs.pathExists(FILE_PATH) || (await fs.stat(FILE_PATH)).size === 0) {
        const res = await axios.get(VIDEO_URL, {
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

      // প্রতিবার নতুন stream → perfect for fbchat API
      const msg = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: fs.createReadStream(FILE_PATH)
      };

      api.sendMessage(msg, threadID, (err, info) => {
        if (err) return console.error("[shourov13] Send Error:", err);

        // react to bot’s message (not to user)
        api.setMessageReaction("😂", info.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("[shourov13] ERROR:", err.message || err);
      api.sendMessage("⚠️ ভিডিও পাঠানো যায়নি!", threadID, messageID);
    }
  },

  start() {
    console.log("[shourov13] Loaded successfully!");
  }
};