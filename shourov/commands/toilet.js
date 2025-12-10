// commands/toilet.js
module.exports.config = {
  name: "toilet",
  version: "1.0.1",
  permission: 0,
  prefix: true,
  credits: "shourov (patched)",
  description: "Make user sit on toilet",
  category: "fun",
  usages: "@tag / self",
  cooldowns: 5
};

module.exports.run = async ({ event, api, args }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Canvas = require("canvas");
  const jimp = require("jimp");

  // Helper: sleep
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Robust download to buffer with retry/backoff (handles 429)
  async function downloadToBufferWithRetry(url, options = {}) {
    const maxAttempts = options.maxAttempts || 4;
    const timeout = options.timeout || 20000;
    const userAgent = options.userAgent || "Mozilla/5.0 (compatible; Bot/1.0)";

    let attempt = 0;
    let lastErr = null;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout,
          headers: {
            "User-Agent": userAgent,
            "Accept": "*/*"
          },
          validateStatus: status => (status >= 200 && status < 300) || status === 429
        });

        if (res.status === 429) {
          // server rate limited us -> backoff and retry
          const ra = parseInt(res.headers["retry-after"]) || null;
          const wait = ra ? ra * 1000 : Math.min(1000 * Math.pow(2, attempt), 10000);
          await sleep(wait);
          lastErr = new Error("HTTP 429 Too Many Requests");
          continue;
        }

        // success
        return Buffer.from(res.data);
      } catch (err) {
        lastErr = err;
        // exponential backoff before next attempt
        const wait = Math.min(1000 * Math.pow(2, attempt), 15000);
        await sleep(wait);
      }
    }

    throw lastErr || new Error("Failed to download: " + url);
  }

  // Safe sendMessage: check thread accessibility first to avoid 1545012
  async function safeSendMessage(api, threadID, message, replyMessageID) {
    try {
      // try getThreadInfo; if it errors, we assume we can't send
      let info = null;
      try {
        info = await api.getThreadInfo(threadID);
      } catch (e) {
        // can't access thread info
        console.warn("safeSendMessage: getThreadInfo failed:", e && e.message);
        return null;
      }
      if (!info || !info.threadID) {
        console.warn("safeSendMessage: cannot access thread:", threadID);
        return null;
      }

      return await new Promise((resolve, reject) => {
        api.sendMessage(message, threadID, (err, info2) => {
          if (err) {
            console.error("safeSendMessage send error:", err);
            return reject(err);
          }
          resolve(info2);
        }, replyMessageID);
      });
    } catch (e) {
      console.error("safeSendMessage unexpected error:", e && e.message);
      return null;
    }
  }

  try {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const outPath = path.join(cacheDir, `toilet_${Date.now()}.png`);

    // ---------- Target User ----------
    const mentions = event.mentions || {};
    const targetID = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : event.senderID;

    // ---------- Background ----------
    const bgURL = "https://i.imgur.com/Kn7KpAr.jpg";
    let bgBuffer = null;
    try {
      bgBuffer = await downloadToBufferWithRetry(bgURL, { maxAttempts: 4, timeout: 20000 });
    } catch (e) {
      console.warn("TOILET: background download failed, using local fallback or blank:", e && e.message);
      // fallback: create a simple colored background with jimp if remote fails
      const fallbackBg = await jimp.create(500, 670, "#b5e1e0");
      bgBuffer = await fallbackBg.getBufferAsync(jimp.MIME_PNG);
    }

    // ---------- Avatar ----------
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
    let avatarBuffer = null;
    try {
      avatarBuffer = await downloadToBufferWithRetry(avatarUrl, { maxAttempts: 3, timeout: 15000 });
    } catch (e) {
      console.warn("TOILET: avatar download failed, using fallback avatar:", e && e.message);
      // fallback: create neutral avatar
      const av = new jimp(512, 512, "#666");
      avatarBuffer = await av.getBufferAsync(jimp.MIME_PNG);
    }

    // ---------- Circle Crop using jimp ----------
    const avatarImg = await jimp.read(avatarBuffer);
    avatarImg.circle();
    const circleAvatar = await avatarImg.getBufferAsync(jimp.MIME_PNG);

    // ---------- Canvas Draw ----------
    const bg = await Canvas.loadImage(bgBuffer);
    const ava = await Canvas.loadImage(circleAvatar);

    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, 500, 670);

    // place avatar - adjust coordinates if you want different placement
    ctx.drawImage(ava, 135, 350, 205, 205);

    const finalBuffer = canvas.toBuffer("image/png");
    await fs.writeFile(outPath, finalBuffer);

    // ---------- Send (safe) ----------
    const msg = {
      body: "🚽🧻",
      attachment: fs.createReadStream(outPath)
    };

    try {
      await safeSendMessage(api, event.threadID, msg, event.messageID);
    } catch (e) {
      console.error("TOILET send failed:", e && e.message);
      // try fallback direct send (best-effort)
      try {
        api.sendMessage(msg, event.threadID, event.messageID);
      } catch (err2) {
        console.error("TOILET fallback direct send failed:", err2 && err2.message);
      }
    }

    // ---------- Cleanup ----------
    try { await fs.remove(outPath); } catch (_) {}

  } catch (err) {
    console.error("TOILET ERROR:", err && (err.stack || err));
    try {
      await safeSendMessage(api, event.threadID, { body: "🔧 সার্ভার সমস্যা: " + (err.message || err) }, event.messageID);
    } catch (e) {
      // ignore
    }
  }
};