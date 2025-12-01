// commands/auto.js
module.exports.config = {
  name: "auto",
  version: "0.0.3",
  permission: 0,
  prefix: true,
  credits: "shourov (fixed)",
  description: "Auto video downloader from a URL in chat message",
  category: "user",
  usages: "paste a direct video/short URL in chat",
  cooldowns: 5
};

module.exports.name = module.exports.config.name;

module.exports.start = async function ({ api, event, args }) {
  // kept for compatibility if loader calls start()
  return;
};

module.exports.handleEvent = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  try {
    const content = (event.body || "").trim();
    if (!content) return;
    // Only react to plain http(s) links (you can adapt to detect tiktok/youtube etc.)
    if (!content.startsWith("http://") && !content.startsWith("https://")) return;

    // quick reaction to show processing (if API supports)
    try { if (typeof api.setMessageReaction === "function") api.setMessageReaction("🔍", event.messageID, () => {}, true); } catch(e){}

    // safe require for downloader lib (may not be installed)
    let alldown = null;
    try {
      const mod = require("nayan-media-downloaders");
      alldown = mod.alldown || mod;
    } catch (e) {
      console.warn("nayan-media-downloaders not available:", e && e.message);
    }

    // If downloader not available, try a fallback: try to fetch content directly (best-effort)
    let downloadInfo = null;
    if (alldown) {
      try {
        downloadInfo = await alldown(content);
      } catch (e) {
        console.warn("alldown failed:", e && e.message);
      }
    }

    // If downloadInfo obtained and has URLs, prefer them
    let downloadUrl = null;
    let title = "video";
    if (downloadInfo && downloadInfo.data) {
      // handle common shapes: { data: { high, low, title } }
      const d = downloadInfo.data;
      downloadUrl = d.high || d.url || d.video || d.src || d.low || null;
      title = d.title || title;
    }

    // Fallback: if no downloader, or no url found, try using the provided link directly
    if (!downloadUrl) {
      downloadUrl = content;
    }

    // Fetch binary data
    let videoBuffer = null;
    try {
      const resp = await axios.get(downloadUrl, { responseType: "arraybuffer", timeout: 30000 });
      videoBuffer = Buffer.from(resp.data);
    } catch (e) {
      console.error("Failed to download video:", e && e.message ? e.message : e);
      try { if (typeof api.setMessageReaction === "function") api.setMessageReaction("❌", event.messageID, () => {}, true); } catch(e){}
      return api.sendMessage("❗ Failed to download the media. The link may be unsupported or the host blocked requests.", event.threadID, event.messageID);
    }

    // Save temp file
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    // choose extension heuristically
    const extMatch = (downloadUrl.match(/\.(mp4|mov|mkv|webm|mp3|m4a)(\?|$)/i) || [])[1] || "mp4";
    const outPath = path.join(cacheDir, `auto_${Date.now()}.${extMatch}`);
    await fs.writeFile(outPath, videoBuffer);

    // success reaction
    try { if (typeof api.setMessageReaction === "function") api.setMessageReaction("✔️", event.messageID, () => {}, true); } catch(e){}

    // send message with attachment
    await api.sendMessage({
      body: `《TITLE》: ${title}`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, event.messageID);

    // cleanup
    try { await fs.remove(outPath); } catch (e) { /* ignore */ }

  } catch (err) {
    console.error("auto.handleEvent error:", err && (err.stack || err));
    try { return api.sendMessage("❗ An unexpected error occurred while processing the link.", event.threadID); } catch (e) {}
  }
};
