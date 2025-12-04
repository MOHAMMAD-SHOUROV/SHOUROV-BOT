module.exports.config = {
  name: "twitter",
  version: "2.1.0",
  permission: 0,
  credits: "shourov",
  description: "Download video from Twitter",
  prefix: true,
  category: "admin",
  usages: "link",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  const { threadID, messageID } = event;

  // quick UX: react and typing
  try { api.setMessageReaction("😘", messageID, () => {}, true); } catch (e) {}
  try { api.sendTypingIndicator(threadID, true); } catch (e) {}

  if (!args || args.length === 0) {
    return api.sendMessage("[ ! ] Please provide a Twitter link.", threadID, messageID);
  }

  const link = args.join(" ").trim();
  const tmpDir = path.join(__dirname, "cache");
  await fs.ensureDir(tmpDir);
  const outPath = path.join(tmpDir, `twitter_${Date.now()}.mp4`);

  // small helper for safe cleanup
  const safeRemove = (p) => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) {} };

  // Inform the user download started (auto remove the message after a while)
  let infoMessage;
  try {
    infoMessage = await new Promise((resolve) => {
      api.sendMessage("⏬ Downloading video — please wait...", threadID, (err, info) => {
        if (err) return resolve(null);
        // auto unsend in 25s if still there
        setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (e) {} }, 25000);
        resolve(info);
      }, messageID);
    });
  } catch (e) {}

  try {
    // use the same downloader you previously used (nayan-video-downloader)
    // keep require inside try so we can catch missing module error
    const { twitterdown } = require("nayan-video-downloader");

    // Call the downloader library
    const res = await twitterdown(link);

    // Validate response structure and choose best available URL
    // common shapes: res.data.HD, res.data.SD, res.HD, res.SD
    const candidateUrls = [
      res?.data?.HD,
      res?.data?.SD,
      res?.HD,
      res?.SD,
      (res?.data && typeof res.data === "string") ? res.data : undefined
    ].filter(Boolean);

    if (candidateUrls.length === 0) {
      throw new Error("No downloadable video URL found.");
    }

    // prefer first candidate (usually HD)
    const videoUrl = candidateUrls[0];

    // download with axios stream (more robust than request)
    const response = await axios.get(videoUrl, { responseType: "stream", timeout: 120000 });

    // pipe to disk
    const writer = fs.createWriteStream(outPath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on("error", err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) resolve();
      });
    });

    // send the file
    await api.sendMessage({
      body: `🔰 API BY MOHAMMAD ALIHSAN SHOUROV\n🔗 Source: ${link}`,
      attachment: fs.createReadStream(outPath)
    }, threadID, (err) => {
      // best-effort cleanup
      safeRemove(outPath);
      // unsend the "downloading" info message if still present
      if (infoMessage && infoMessage.messageID) try { api.unsendMessage(infoMessage.messageID); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("twitter command error:", err);
    safeRemove(outPath);
    if (infoMessage && infoMessage.messageID) try { api.unsendMessage(infoMessage.messageID); } catch (e) {}
    // friendly error message
    let errText = "❗ Failed to download video.";
    if (err && err.message) errText += `\nDetails: ${err.message}`;
    return api.sendMessage(errText, threadID, messageID);
  } finally {
    try { api.sendTypingIndicator(threadID, false); } catch (e) {}
  }
};