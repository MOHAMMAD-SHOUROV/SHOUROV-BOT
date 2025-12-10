// commands/toilet.js
module.exports.config = {
  name: "toilet",
  version: "1.0.2",
  permission: 0,
  prefix: true,
  credits: "shourov (patched)",
  description: "Make user sit on toilet (shows profile pic if possible)",
  category: "fun",
  usages: "@tag / self / reply-to-image",
  cooldowns: 5
};

module.exports.run = async ({ event, api, args }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Canvas = require("canvas");
  const jimp = require("jimp");

  const { threadID, messageID, senderID } = event;

  // small sleep helper
  const sleep = ms => new Promise(res => setTimeout(res, ms));

  async function downloadBuffer(url, opts = {}) {
    const maxTry = opts.maxTry || 3;
    const timeout = opts.timeout || 15000;
    const ua = opts.userAgent || "Mozilla/5.0 (compatible; Bot/1.0)";
    let lastErr = null;
    for (let i = 0; i < maxTry; i++) {
      try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout, headers: { "User-Agent": ua, Accept: "*/*" } });
        return Buffer.from(res.data);
      } catch (e) {
        lastErr = e;
        // backoff a bit
        await sleep(500 * (i + 1));
        // if rate-limited, wait longer
        if (e.response && e.response.status === 429) {
          const ra = parseInt(e.response.headers["retry-after"]) || (2 ** i);
          await sleep(1000 * ra);
        }
      }
    }
    throw lastErr || new Error("downloadBuffer failed for " + url);
  }

  // Try to get a better avatar URL using available APIs:
  // 1) try api.getUserInfo (if available in this bot framework)
  // 2) try graph.facebook.com/<id>/picture?redirect=false&width=512&height=512&access_token=APPTOKEN (if APP_TOKEN provided)
  // 3) fallback to direct graph picture redirect (may be silhouette)
  async function fetchAvatarBuffer(targetID) {
    // 1) try framework getUserInfo -> some chats provide url/thumbSrc
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetID);
        if (info && info[targetID]) {
          // common fields: profileUrl, thumbSrc, avatarUrl, smallProfilePhoto
          const candidate = info[targetID].thumbSrc || info[targetID].profileUrl || info[targetID].avatarUrl || info[targetID].smallProfilePhoto;
          if (candidate) {
            try {
              const buf = await downloadBuffer(candidate);
              return { buffer: buf, source: "api.getUserInfo -> thumbSrc" };
            } catch (err) {
              // ignore and continue
              console.warn("avatar: getUserInfo candidate failed:", err && err.message);
            }
          }
        }
      }
    } catch (e) {
      // ignore, not fatal
      console.warn("avatar: api.getUserInfo failed:", e && e.message);
    }

    // 2) try graph API with redirect=false to examine is_silhouette
    // allow user to set APP_TOKEN in env: APP_TOKEN=appId|appSecret
    const appToken = process.env.APP_TOKEN || process.env.APP_ACCESS_TOKEN || null;
    try {
      let graphUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&redirect=false`;
      if (appToken) graphUrl += `&access_token=${encodeURIComponent(appToken)}`;
      const res = await axios.get(graphUrl, { timeout: 10000 });
      if (res && res.data && res.data.data && res.data.data.url) {
        const isSil = !!res.data.data.is_silhouette;
        const picUrl = res.data.data.url;
        if (!isSil && picUrl) {
          try {
            const buf = await downloadBuffer(picUrl);
            return { buffer: buf, source: "graph redirect=false (non-silhouette)" };
          } catch (err) {
            console.warn("avatar: download from graph data.url failed:", err && err.message);
          }
        } else {
          // silhouette -> real picture not available publically
          console.warn("avatar: graph reports silhouette for user", targetID);
          // still attempt direct redirect (may return same)
          try {
            const direct = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
            const b2 = await downloadBuffer(direct);
            return { buffer: b2, source: "graph direct (silhouette likely)" };
          } catch (err) {
            console.warn("avatar: direct graph fallback failed:", err && err.message);
          }
        }
      }
    } catch (e) {
      console.warn("avatar: graph redirect=false error:", e && (e.response && e.response.status) || e.message);
    }

    // 3) final attempt: direct Graph picture (may redirect to silhouette)
    try {
      const direct = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
      const b = await downloadBuffer(direct, { maxTry: 2 });
      return { buffer: b, source: "graph direct final" };
    } catch (e) {
      console.warn("avatar: final direct graph failed:", e && e.message);
    }

    // 4) nothing worked -> return null to indicate fallback required
    return null;
  }

  try {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const outPath = path.join(cacheDir, `toilet_${Date.now()}.png`);

    // determine target
    const mentions = event.mentions || {};
    const mentionIds = Object.keys(mentions);
    const targetID = mentionIds.length ? mentionIds[0] : senderID;

    // background (small retry)
    const bgURL = "https://i.imgur.com/Kn7KpAr.jpg";
    let bgBuffer = null;
    try {
      bgBuffer = await downloadBuffer(bgURL, { maxTry: 3, timeout: 20000 });
    } catch (e) {
      console.warn("TOILET: bg download failed:", e && e.message);
      // fallback bg with jimp
      const bmp = new jimp(500, 670, "#f2f2f2");
      bgBuffer = await bmp.getBufferAsync(jimp.MIME_PNG);
    }

    // check if user replied with an image; if so prefer that
    let replyImagePath = null;
    if (event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) {
      const att = event.messageReply.attachments[0];
      if (att.url && (/\.(jpg|jpeg|png|gif)$/i.test(att.url) || (att.mimeType && att.mimeType.startsWith("image")))) {
        try {
          replyImagePath = path.join(cacheDir, `reply_${Date.now()}.jpg`);
          // simple download
          const rb = await downloadBuffer(att.url, { maxTry: 3, timeout: 15000 });
          fs.writeFileSync(replyImagePath, rb);
        } catch (e) {
          console.warn("TOILET: reply image download failed:", e && e.message);
          replyImagePath = null;
        }
      }
    }

    // avatar fetch
    let avatarResult = null;
    if (replyImagePath) {
      avatarResult = { buffer: fs.readFileSync(replyImagePath), source: "replied-image" };
    } else {
      avatarResult = await fetchAvatarBuffer(targetID);
    }

    let avatarBuffer = null;
    if (avatarResult && avatarResult.buffer) avatarBuffer = avatarResult.buffer;
    else {
      // fallback placeholder
      const tmp = new jimp(512, 512, "#777777");
      avatarBuffer = await tmp.getBufferAsync(jimp.MIME_PNG);
      console.warn("TOILET: Using placeholder avatar for", targetID);
    }

    // circle crop
    const avatarImg = await jimp.read(avatarBuffer);
    avatarImg.circle();
    const circBuf = await avatarImg.getBufferAsync(jimp.MIME_PNG);

    // canvas compose
    const bgImg = await Canvas.loadImage(bgBuffer);
    const avaImg = await Canvas.loadImage(circBuf);

    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImg, 0, 0, 500, 670);
    // draw avatar in seat (coordinates same as earlier)
    ctx.drawImage(avaImg, 135, 350, 205, 205);

    // optional name under avatar (try get via api.getUserInfo)
    let displayName = `User${String(targetID).slice(-4)}`;
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetID);
        if (info && info[targetID] && info[targetID].name) displayName = info[targetID].name;
      }
    } catch (e) {
      // ignore
    }
    ctx.font = "18px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    const nameX = canvas.width / 2;
    ctx.strokeText(displayName, nameX, 580);
    ctx.fillText(displayName, nameX, 580);

    // write file
    const finalBuf = canvas.toBuffer("image/png");
    await fs.writeFile(outPath, finalBuf);

    // send
    const msg = {
      body: mentionIds.length ? `${displayName}, বসে গেছো 🚽` : `${displayName}, বসে গেছো 🚽`,
      attachment: fs.createReadStream(outPath)
    };

    try {
      await new Promise((resolve, reject) => {
        api.sendMessage(msg, threadID, (err, info) => {
          if (err) { console.error("TOILET send error:", err && (err.message || err)); return reject(err); }
          resolve(info);
        }, messageID);
      });
    } catch (e) {
      console.warn("TOILET: primary send failed, trying simple send:", e && e.message);
      try { api.sendMessage(msg, threadID, messageID); } catch (e2) { console.error("TOILET final send failed:", e2 && e2.message); }
    }

    // cleanup
    try { if (fs.existsSync(outPath)) await fs.unlink(outPath); } catch (e) {}
    try { if (replyImagePath && fs.existsSync(replyImagePath)) await fs.unlink(replyImagePath); } catch (e) {}

  } catch (err) {
    console.error("TOILET ERROR:", err && (err.stack || err.message));
    try { api.sendMessage("🔧 কিছু সমস্যা হয়েছে: " + (err.message || err), threadID, messageID); } catch (e) {}
  }
};