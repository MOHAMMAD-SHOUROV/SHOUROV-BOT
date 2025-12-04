module.exports.config = {
  name: "tikmp3",
  version: "2.0.1",
  permission: 0,
  credits: " shourov",
  description: "Download audio from TikTok link",
  prefix: true,
  category: "admin",
  usages: "link",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "request": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  try {
    const fs = require("fs-extra");
    const path = require("path");
    const request = require("request");
    const { tikdown } = require("nayan-video-downloader");

    const { messageID, threadID } = event;
    const content = args.join(" ").trim();

    // Basic checks
    if (!content) return api.sendMessage("[ ! ] Please provide a TikTok link.", threadID, messageID);

    // React and typing
    try { api.setMessageReaction("✅", messageID, () => {}, true); } catch(e) {}
    try { api.sendTypingIndicator(threadID, true); } catch(e) {}

    // Inform user
    const infoMsg = await new Promise((resolve) =>
      api.sendMessage("𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 𝗔𝗨𝗗𝗜𝗢 𝐅𝐎𝐑 𝐘𝐎𝐔…", threadID, (err, info) => resolve(info))
    );

    // Ensure cache folder
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const outPath = path.join(cacheDir, "tik.mp3");

    // Call downloader
    let res;
    try {
      res = await tikdown(content);
    } catch (err) {
      await api.unsendMessage(infoMsg.messageID).catch(()=>{});
      return api.sendMessage("Failed to fetch audio from the provided link. Make sure the link is valid.", threadID, messageID);
    }

    if (!res || !res.data || !res.data.audio) {
      await api.unsendMessage(infoMsg.messageID).catch(()=>{});
      return api.sendMessage("No audio found in the TikTok response.", threadID, messageID);
    }

    const audioUrl = res.data.audio;
    const title = res.data.title || "Unknown title";
    const duration = res.data.duration || "Unknown";
    const author = (res.data.author && res.data.author.nickname) ? res.data.author.nickname : "Unknown";

    // Stream to file
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outPath);
      const r = request.get(encodeURI(audioUrl))
        .on("error", err => {
          writeStream.close();
          reject(err);
        })
        .pipe(writeStream);

      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err) => reject(err));
    });

    // send file
    await new Promise((resolve) => {
      api.sendMessage({
        body:
`==[ 𝐌𝐔𝐒𝐈𝐂 𝐓𝐈𝐊𝐓𝐎𝐊 ]====
━━━━━━━━━━━━━━

💬 Title: ${title}
✒ Author: ${author}
⏱ Duration: ${duration} second

⇆  ◁  ❚❚  ▷  ↻`,
        attachment: fs.createReadStream(outPath)
      }, threadID, (err, info) => {
        // cleanup
        setTimeout(() => {
          try { fs.unlinkSync(outPath); } catch (e) {}
        }, 3000);
        // unsend info message
        try { api.unsendMessage(infoMsg.messageID); } catch(e) {}
        resolve();
      }, messageID);
    });

  } catch (err) {
    console.error("tikmp3 error:", err);
    try { api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID); } catch(e){}
  }
};