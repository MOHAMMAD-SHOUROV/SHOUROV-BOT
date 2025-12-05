const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fun2",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "shourov",
    description: "Fun (send cached MP4 on trigger)",
    category: "no prefix",
    usages: "😒",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString().toLowerCase();

    // trigger: message starts with "@everyone"
    if (!body.startsWith("@everyone")) return;

    try {
      // ensure cache folder
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, "npx14.mp4");

      // if not downloaded yet, fetch and save
      if (!await fs.pathExists(filePath)) {
        const url = "https://i.imgur.com/sC58dAM.mp4"; // source mp4
        const res = await axios.get(url, { responseType: "stream", headers: { "User-Agent": "Mozilla/5.0" } });

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          res.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      }

      // send message with attachment (createReadStream so attachment can be reused)
      const msg = {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: fs.createReadStream(filePath)
      };

      api.sendMessage(msg, threadID, (err) => {
        if (err) {
          console.error("npx14: failed to send message:", err);
          return;
        }
        // add reaction (best-effort)
        try {
          api.setMessageReaction("😜", messageID, () => {}, true);
        } catch (e) { /* ignore reaction errors */ }
      });

    } catch (error) {
      console.error("npx14 handleEvent error:", error && (error.stack || error));
      try {
        api.sendMessage("⚠️ ভিডিও লোড করতে সমস্যা হয়েছে!", threadID, messageID);
      } catch (e) { /* ignore */ }
    }
  },

  start: function () {
    console.log("[fun2] Module loaded ✅");
  }
};