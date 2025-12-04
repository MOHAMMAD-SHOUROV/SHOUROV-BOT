module.exports = {
  config: {
    name: "tik",
    version: "2.0.1",
    permission: 0,
    credits: "shourov",
    description: "Download video from TikTok link",
    prefix: true,
    category: "admin",
    usages: "link",
    cooldowns: 5,
    dependencies: {}
  },

  run: async function({ api, event, args }) {
    const fs = require("fs-extra");
    const path = require("path");
    const request = require("request");
    const { tikdown } = require("nayan-media-downloaders");

    const { messageID, threadID } = event;
    const content = args.join(" ").trim();

    // Validate input
    if (!content) {
      return api.sendMessage("[ ! ] Input link.", threadID, messageID);
    }

    // Try react and typing (swallow errors)
    try { api.setMessageReaction("😘", messageID, () => {}, true); } catch(e){}
    try { api.sendTypingIndicator(threadID, true); } catch(e){}

    // Send a temporary "downloading" message so user knows progress
    let infoMsg;
    try {
      infoMsg = await new Promise((resolve) => {
        api.sendMessage("𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐈𝐍𝐆 𝐕𝐈𝐃𝐄𝐎 𝐅𝐎𝐑 𝐘𝐎𝐔…", threadID, (err, info) => resolve(info));
      });
    } catch (e) {
      infoMsg = null;
    }

    // Ensure cache dir
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const outPath = path.join(cacheDir, "tik.mp4");

    try {
      // Call downloader
      let res;
      try {
        res = await tikdown(content);
      } catch (err) {
        if (infoMsg && infoMsg.messageID) try { api.unsendMessage(infoMsg.messageID); } catch(e){}
        return api.sendMessage("Failed to fetch video from the provided link. Make sure the link is valid.", threadID, messageID);
      }

      if (!res || !res.data) {
        if (infoMsg && infoMsg.messageID) try { api.unsendMessage(infoMsg.messageID); } catch(e){}
        return api.sendMessage("No video found in the response.", threadID, messageID);
      }

      const videoUrl = res.data.video || res.data.HD || res.data.sd; // try common fields
      const title = res.data.title || "Untitled";

      if (!videoUrl) {
        if (infoMsg && infoMsg.messageID) try { api.unsendMessage(infoMsg.messageID); } catch(e){}
        return api.sendMessage("Video URL not found in the response.", threadID, messageID);
      }

      // Stream to file with proper error handling
      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(outPath);
        const r = request.get(encodeURI(videoUrl))
          .on("error", err => {
            try { writeStream.close(); } catch(e){}
            reject(err);
          })
          .pipe(writeStream);

        writeStream.on("finish", () => resolve());
        writeStream.on("error", err => reject(err));
      });

      // Send the video
      await new Promise((resolve) => {
        api.sendMessage({
          body: `TITLE: ${title}`,
          attachment: fs.createReadStream(outPath)
        }, threadID, (err, info) => {
          // cleanup file after small delay
          setTimeout(() => {
            try { fs.unlinkSync(outPath); } catch (e) {}
          }, 3000);

          // remove temporary info message
          if (infoMsg && infoMsg.messageID) try { api.unsendMessage(infoMsg.messageID); } catch(e){}
          resolve();
        }, messageID);
      });

    } catch (err) {
      console.error("tik error:", err);
      if (infoMsg && infoMsg.messageID) try { api.unsendMessage(infoMsg.messageID); } catch(e){}
      try { api.sendMessage("An error occurred while processing your request.", threadID, messageID); } catch(e){}
    } finally {
      // make sure typing indicator is turned off if possible
      try { api.sendTypingIndicator(threadID, false); } catch(e){}
    }
  }
};