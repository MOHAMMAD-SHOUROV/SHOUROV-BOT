// commands/toilet.js
module.exports.config = {
  name: "toilet",
  version: "3.2.0",
  permission: 0,
  prefix: true,
  credits: "shourov (patched) + assistant",
  description: "Make user sit on toilet (shows profile pic in higher quality)",
  category: "fun",
  usages: "@tag / self / reply-to-image",
  cooldowns: 5
};

module.exports.run = async ({ event, api }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Canvas = require("canvas");
  const Jimp = require("jimp");

  const { threadID, messageID, senderID } = event;
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const log = (...a) => console.log("[toilet]", ...a);

  async function downloadBuffer(url, opts = {}) {
    const maxTry = opts.maxTry || 3;
    const timeout = opts.timeout || 15000;
    const ua = opts.userAgent || "Mozilla/5.0 (compatible; Bot/1.0)";
    let lastErr = null;
    for (let i = 0; i < maxTry; i++) {
      try {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout,
          headers: { "User-Agent": ua, Accept: "*/*" }
        });
        return Buffer.from(res.data);
      } catch (e) {
        lastErr = e;
        log(`downloadBuffer attempt ${i+1} failed for ${url}:`, e && (e.response && e.response.status) || e.message);
        const backoff = Math.min(1000 * Math.pow(2, i), 8000);
        await sleep(backoff);
        if (e.response && e.response.status === 429) {
          const ra = parseInt(e.response.headers["retry-after"]) || 2;
          await sleep(1000 * ra);
        }
      }
    }
    throw lastErr || new Error("downloadBuffer failed for " + url);
  }

  // Try multiple ways to fetch avatar image data (prefer high-res)
  async function fetchAvatarBuffer(targetId) {
    // 1) try api.getUserInfo
    try {
      if (typeof api.getUserInfo === "function") {
        log("trying api.getUserInfo for", targetId);
        const info = await api.getUserInfo(targetId);
        if (info && info[targetId]) {
          const cand = info[targetId].thumbSrc || info[targetId].profileUrl || info[targetId].avatarUrl || info[targetId].smallProfilePhoto;
          if (cand) {
            try {
              const buf = await downloadBuffer(cand, { maxTry: 3, timeout: 15000 });
              return { buffer: buf, source: "api.getUserInfo" };
            } catch (err) {
              log("getUserInfo candidate download failed:", err && err.message);
            }
          }
        }
      }
    } catch (e) { log("api.getUserInfo error:", e && e.message); }

    // 2) Graph API redirect=false (inspect is_silhouette) with optional app token
    try {
      log("trying graph redirect=false for", targetId);
      const appToken = process.env.APP_TOKEN || process.env.APP_ACCESS_TOKEN || null;
      let graphUrl = `https://graph.facebook.com/${targetID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      if (appToken) graphUrl += `&access_token=${encodeURIComponent(appToken)}`;
      const r = await axios.get(graphUrl, { timeout: 10000 });
      if (r && r.data && r.data.data && r.data.data.url) {
        const isSil = !!r.data.data.is_silhouette;
        const picUrl = r.data.data.url;
        log("graph metadata:", { is_silhouette: isSil, url: picUrl });
        if (!isSil && picUrl) {
          try {
            const buf = await downloadBuffer(picUrl, { maxTry: 3, timeout: 15000 });
            return { buffer: buf, source: "graph redirect=false (non-silhouette)" };
          } catch (err) {
            log("download from graph data.url failed:", err && err.message);
          }
        } else {
          log("graph says silhouette for", targetId);
        }
      }
    } catch (e) {
      log("graph redirect=false failed:", e && (e.response && e.response.status) || e.message);
    }

    // 3) Graph direct (may redirect to silhouette)
    try {
      log("trying graph direct for", targetId);
      const direct = `https://graph.facebook.com/${targetId}/picture?width=1024&height=1024`;
      const b = await downloadBuffer(direct, { maxTry: 3, timeout: 15000 });
      return { buffer: b, source: "graph direct" };
    } catch (e) {
      log("graph direct failed:", e && e.message);
    }

    // nothing worked
    return null;
  }

  try {
    const outPath = path.join(cacheDir, `toilet_${Date.now()}.png`);

    // determine target user (mention -> replied image -> sender)
    const mentionIds = Object.keys(event.mentions || {});
    const targetId = mentionIds.length ? mentionIds[0] : senderID;

    // background
    let bgBuffer = null;
    try {
      bgBuffer = await downloadBuffer("https://i.imgur.com/Kn7KpAr.jpg", { maxTry: 3, timeout: 20000 });
      log("background downloaded");
    } catch (e) {
      log("bg download failed, creating fallback bg:", e && e.message);
      const j = new Jimp(1000, 1340, "#f4f4f4");
      bgBuffer = await j.getBufferAsync(Jimp.MIME_PNG);
    }

    // if reply-to-image present, prefer that image as avatar
    let replyImagePath = null;
    if (event.type === "message_reply" && event.messageReply && Array.isArray(event.messageReply.attachments) && event.messageReply.attachments.length) {
      const att = event.messageReply.attachments[0];
      if (att.url && (/\.(jpe?g|png|gif)$/i.test(att.url) || (att.mimeType && att.mimeType.startsWith("image")))) {
        try {
          const rb = await downloadBuffer(att.url, { maxTry: 3, timeout: 15000 });
          replyImagePath = path.join(cacheDir, `reply_${Date.now()}.jpg`);
          fs.writeFileSync(replyImagePath, rb);
          log("reply image saved to", replyImagePath);
        } catch (e) {
          log("reply image download failed:", e && e.message);
          replyImagePath = null;
        }
      }
    }

    // fetch avatar
    let avatarBuffer = null;
    let avatarSource = "none";
    if (replyImagePath) {
      avatarBuffer = fs.readFileSync(replyImagePath);
      avatarSource = "replied-image";
    } else {
      const avRes = await fetchAvatarBuffer(targetId);
      if (avRes && avRes.buffer) {
        avatarBuffer = avRes.buffer;
        avatarSource = avRes.source || "graph";
      }
    }

    if (!avatarBuffer) {
      // make placeholder
      log("no avatar found, creating placeholder");
      const tmp = new Jimp(1024, 1024, "#777777");
      avatarBuffer = await tmp.getBufferAsync(Jimp.MIME_PNG);
      avatarSource = "placeholder";
    }

    log("avatar source:", avatarSource);

    // Process avatar with Jimp: ensure good quality, circle, add white border ring
    let avatarImg = await Jimp.read(avatarBuffer);
    // ensure square and high-res: cover to 800x800
    avatarImg.cover(800, 800);
    // circle
    avatarImg.circle();

    // create ring: draw slightly larger white circle behind
    const ring = new Jimp(880, 880, 0x00000000); // transparent
    // draw white filled circle using scan
    const center = 440, radius = 440;
    ring.scan(0, 0, ring.bitmap.width, ring.bitmap.height, function(x, y, idx) {
      const dx = x - center, dy = y - center;
      if (dx*dx + dy*dy <= radius*radius) {
        // set white pixel with full alpha
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
        this.bitmap.data[idx + 3] = 255;
      } else {
        // keep transparent
      }
    });

    // create composite: place avatar centered onto ring (avatar 800 => offset 40)
    ring.composite(avatarImg.resize(800, 800), 40, 40);

    const circBuffer = await ring.getBufferAsync(Jimp.MIME_PNG);

    // Compose with Canvas at larger resolution to preserve clarity
    const CANVAS_W = 1000;
    const CANVAS_H = 1340;
    const bgImg = await Canvas.loadImage(bgBuffer);
    const avImg = await Canvas.loadImage(circBuffer);

    const canvas = Canvas.createCanvas(CANVAS_W, CANVAS_H);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // draw background cover (fit)
    // calculate aspect cover
    const bw = bgImg.width, bh = bgImg.height;
    const br = bw / bh;
    const cr = CANVAS_W / CANVAS_H;
    let sx = 0, sy = 0, sw = bw, sh = bh;
    if (br > cr) {
      // bg wider -> crop sides
      sh = bh;
      sw = Math.round(bh * cr);
      sx = Math.round((bw - sw) / 2);
    } else {
      // bg taller -> crop top/bottom
      sw = bw;
      sh = Math.round(bw / cr);
      sy = Math.round((bh - sh) / 2);
    }
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);

    // position avatar in the toilet bowl area (tune coordinates)
    const AV_SIZE = 520; // on canvas
    const AV_X = Math.round((CANVAS_W - AV_SIZE) / 2); // center horizontally
    const AV_Y = 640; // vertical position (tweak as needed)
    ctx.drawImage(avImg, AV_X, AV_Y, AV_SIZE, AV_SIZE);

    // optional: display name under avatar
    let displayName = `User${String(targetId).slice(-4)}`;
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetId);
        if (info && info[targetId] && info[targetId].name) displayName = info[targetId].name;
      }
    } catch (e) { /* ignore */ }

    ctx.font = "42px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    // shadow for better contrast
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.strokeText(displayName, CANVAS_W / 2, AV_Y + AV_SIZE + 70);
    ctx.fillText(displayName, CANVAS_W / 2, AV_Y + AV_SIZE + 70);

    // save
    const finalBuf = canvas.toBuffer("image/png");
    await fs.writeFile(outPath, finalBuf);
    log("final image written:", outPath);

    // send
    const message = {
      body: mentionIds.length ? `${displayName}, বসে গেছো 🚽` : `${displayName}, বসে গেছো 🚽`,
      attachment: fs.createReadStream(outPath)
    };

    try {
      await new Promise((resolve, reject) => {
        api.sendMessage(message, threadID, (err, info) => {
          if (err) {
            log("send error:", err && (err.message || err));
            return reject(err);
          }
          resolve(info);
        }, messageID);
      });
      log("image sent to thread", threadID);
    } catch (e) {
      log("primary send failed:", e && e.message);
      try { api.sendMessage(message, threadID, messageID); } catch (e2) { log("fallback send failed:", e2 && e2.message); }
    }

    // cleanup
    try { if (fs.existsSync(outPath)) await fs.unlink(outPath); } catch (_) {}
    try { if (replyImagePath && fs.existsSync(replyImagePath)) await fs.unlink(replyImagePath); } catch (_) {}

  } catch (err) {
    console.error("[toilet] ERROR:", err && (err.stack || err.message));
    try { api.sendMessage("🔧 কিছু সমস্যা হয়েছে: " + (err.message || err), threadID, messageID); } catch (_) {}
  }
};
