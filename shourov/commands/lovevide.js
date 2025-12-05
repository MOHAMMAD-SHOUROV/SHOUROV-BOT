// commands/npx23.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "npx23",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "(fixed by assistant)",
    description: "Responds with a video when people talk about love",
    category: "no prefix",
    usages: "type message containing valobasa / ভালোবাসা / maya etc.",
    cooldowns: 5,
  },

  // If your bot framework supports a start/onLoad hook you can pre-download the file there.
  // For portability we download on first need and then cache to ./cache/shourov23.mp4
  handleEvent: async function({ api, event }) {
    const { threadID, messageID } = event;
    const body = (event.body || "").toLowerCase();
    if (!body) return;

    // trigger keywords (checked as substring anywhere in message)
    const triggerWords = [
      "valobasa", "valo", "ভালোবাসা", "মায়া", "maya", "ভালো"
    ];

    const triggered = triggerWords.some(w => body.includes(w));
    if (!triggered) return;

    // video to send (direct downloadable link)
    const mediaUrl = "https://files.catbox.moe/8sctaw.mp4";

    // prepare cache folder and file path
    const cacheDir = path.join(__dirname, "cache");
    const cacheFile = path.join(cacheDir, "shourov23.mp4");

    try {
      // ensure cache dir
      await fs.ensureDir(cacheDir);

      // download only if file not present
      if (!await fs.pathExists(cacheFile)) {
        const res = await axios.get(mediaUrl, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        // pipe to file
        const writer = fs.createWriteStream(cacheFile);
        res.data.pipe(writer);

        // wait for finish
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      }

      // send from cached file
      await api.sendMessage(
        {
          body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
          attachment: fs.createReadStream(cacheFile)
        },
        threadID,
        // after send callback: react (best-effort)
        (err) => {
          try {
            api.setMessageReaction("😓", messageID, () => {}, true);
          } catch (e) { /* ignore reaction errors */ }
        }
      );

    } catch (error) {
      console.error("Fahim123 error:", error && error.stack ? error.stack : error);
      // fallback: simple text reply so user knows something happened
      try {
        await api.sendMessage("ভিডিও লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।", threadID, messageID);
      } catch (e) { /* ignore */ }
    }
  },

  start: function() {
    // optional: pre-warm cache on bot start (uncomment if you want)
    // preDownload();
  }
};

// Optional helper to pre-download at startup (uncomment use if desired)
/*
async function preDownload() {
  const cacheDir = path.join(__dirname, "cache");
  const cacheFile = path.join(cacheDir, "shourov23.mp4");
  if (!await fs.pathExists(cacheFile)) {
    await fs.ensureDir(cacheDir);
    const res = await axios.get("https://files.catbox.moe/8sctaw.mp4", { responseType: "stream" });
    const writer = fs.createWriteStream(cacheFile);
    res.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }
}
*/