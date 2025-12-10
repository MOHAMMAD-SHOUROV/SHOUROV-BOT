// commands/toilet.js
module.exports.config = {
  name: "toilet",
  version: "1.0.3",
  permission: 0,
  prefix: true,
  credits: "shourov (patched, improved avatar quality)",
  description: "Make user sit on toilet (shows clearer profile pic)",
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
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

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
        await sleep(500 * (i + 1));
        if (e.response && e.response.status === 429) {
          const ra = parseInt(e.response.headers["retry-after"]) || (2 ** i);
          await sleep(1000 * ra);
        }
      }
    }
    throw lastErr || new Error("downloadBuffer failed for " + url);
  }

  // Try to fetch better avatar (same logic as before, but kept concise)
  async function fetchAvatarBuffer(targetID, replyImagePath = null) {
    if (replyImagePath && fs.existsSync(replyImagePath)) {
      return fs.readFileSync(replyImagePath);
    }

    // try api.getUserInfo if available
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetID);
        if (info && info[targetID]) {
          const candidate = info[targetID].thumbSrc || info[targetID].profileUrl || info[targetID].avatarUrl || info[targetID].smallProfilePhoto;
          if (candidate) {
            try { return await downloadBuffer(candidate, { maxTry: 3 }); } catch(e){ /* continue */ }
          }
        }
      }
    } catch(e){ /* ignore */ }

    // try graph redirect=false (requires optional APP_TOKEN in env)
    try {
      let graphUrl = `https://graph.facebook.com/${targetID}/picture?width=1024&height=1024&redirect=false`;
      const appToken = process.env.APP_TOKEN || process.env.APP_ACCESS_TOKEN || null;
      if (appToken) graphUrl += `&access_token=${encodeURIComponent(appToken)}`;
      const resp = await axios.get(graphUrl, { timeout: 10000 }).catch(()=>null);
      if (resp && resp.data && resp.data.data && resp.data.data.url) {
        const isSil = !!resp.data.data.is_silhouette;
        const picUrl = resp.data.data.url;
        if (!isSil && picUrl) {
          try { return await downloadBuffer(picUrl, { maxTry: 3, timeout: 15000 }); } catch(e){ /* continue */ }
        } else {
          // still try direct (may return silhouette)
          try { return await downloadBuffer(`https://graph.facebook.com/${targetID}/picture?width=1024&height=1024`, { maxTry: 2 }); } catch(e){ /* continue */ }
        }
      }
    } catch(e){ /* ignore */ }

    // fallback direct
    try {
      return await downloadBuffer(`https://graph.facebook.com/${targetID}/picture?width=1024&height=1024`, { maxTry: 2 });
    } catch (e) {
      // final fallback: create neutral avatar
      const tmp = new jimp(1024, 1024, "#777777");
      return await tmp.getBufferAsync(jimp.MIME_PNG);
    }
  }

  try {
    // target id
    const mentions = event.mentions || {};
    const mentionIds = Object.keys(mentions);
    const targetID = mentionIds.length ? mentionIds[0] : senderID;

    // reply image support
    let replyImagePath = null;
    if (event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) {
      const att = event.messageReply.attachments[0];
      if (att && att.url) {
        try {
          replyImagePath = path.join(cacheDir, `reply_img_${Date.now()}.jpg`);
          const b = await downloadBuffer(att.url, { maxTry: 3, timeout: 15000 });
          fs.writeFileSync(replyImagePath, b);
        } catch (e) {
          replyImagePath = null;
        }
      }
    }

    // background
    const bgURL = "https://i.imgur.com/Kn7KpAr.jpg";
    let bgBuffer = null;
    try { bgBuffer = await downloadBuffer(bgURL, { maxTry: 3, timeout: 20000 }); }
    catch (e) {
      const fallbackBg = await jimp.create(500, 670, "#e9eef2");
      bgBuffer = await fallbackBg.getBufferAsync(jimp.MIME_PNG);
    }

    // avatar (higher resolution)
    const rawAvatar = await fetchAvatarBuffer(targetID, replyImagePath);

    // Use jimp to process avatar at high resolution to avoid pixelation
    // Steps:
    // 1) read at 1024x1024 (or current size)
    // 2) optionally enhance: increase contrast/brightness/sharpness
    // 3) circle mask, then resize down to final size (this improves quality)
    const avatarJ = await jimp.read(rawAvatar);
    // ensure square
    const side = Math.max(avatarJ.bitmap.width, avatarJ.bitmap.height, 512);
    avatarJ.contain(side, side, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE);

    // gentle enhancements
    try {
      avatarJ.contrast(0.05);       // small contrast boost
      avatarJ.brightness(0.03);     // tiny brightness
      // apply a small convolution to sharpen a bit (unsharp-like)
      const sharpenKernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      avatarJ.convolute(sharpenKernel, 3, 3);
    } catch(e){ /* some jimp versions may not support */ }

    // make circle at high-res
    avatarJ.circle();
    // final avatar size to draw onto canvas (bigger than before to be clear)
    const finalAvatarSize = 260; // increase to 260 for clarity
    avatarJ.resize(finalAvatarSize, finalAvatarSize);

    // create ring/border: place avatar onto larger canvas with white border and subtle shadow
    const ringSize = finalAvatarSize + 32; // 16px border
    const ringImage = new jimp(ringSize, ringSize, 0x00000000);
    // draw blurred shadow behind
    const shadow = new jimp(ringSize, ringSize, 0x00000000);
    // draw a semi-transparent black circle for shadow then blur
    const shadowCircle = new jimp(ringSize, ringSize, 0x00000000);
    shadowCircle.circle();
    shadowCircle.opacity(0.18);
    shadowCircle.blur(8);
    shadow.composite(shadowCircle, 0, 6); // slight offset downwards

    // white border circle
    const border = new jimp(ringSize, ringSize, 0xffffffff);
    border.circle();
    // mask border so center is transparent
    const inner = new jimp(ringSize - 20, ringSize - 20, 0x00000000);
    inner.circle();
    border.composite(inner, 10, 10, { mode: jimp.BLEND_SOURCE_OVER });

    // compose final ringImage: shadow -> border -> avatar centered
    ringImage.composite(shadow, 0, 0);
    ringImage.composite(border, 0, 0);
    ringImage.composite(avatarJ, Math.floor((ringSize - finalAvatarSize) / 2), Math.floor((ringSize - finalAvatarSize) / 2));

    // export ringImage buffer as PNG
    const ringBuf = await ringImage.getBufferAsync(jimp.MIME_PNG);

    // Canvas compose: background (500x670) + ring image placed over seat
    const canvasW = 500;
    const canvasH = 670;
    const canvas = Canvas.createCanvas(canvasW, canvasH);
    const ctx = canvas.getContext("2d");

    // load images into Canvas
    const bgImg = await Canvas.loadImage(bgBuffer);
    const ringCanvasImg = await Canvas.loadImage(ringBuf);

    // draw bg
    ctx.drawImage(bgImg, 0, 0, canvasW, canvasH);

    // coordinates tuned to look centered in toilet bowl
    const ringX = 120; // tweak if necessary
    const ringY = 330;

    ctx.drawImage(ringCanvasImg, ringX, ringY, ringSize, ringSize);

    // optional: draw name label under the ring (centered)
    let displayName = `User${String(targetID).slice(-4)}`;
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo(targetID);
        if (info && info[targetID] && info[targetID].name) displayName = info[targetID].name;
      }
    } catch (e) {}

    ctx.font = "18px Sans";
    ctx.textAlign = "center";
    // draw outlined text for readability
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.strokeText(displayName, canvasW / 2, ringY + ringSize + 28);
    ctx.fillText(displayName, canvasW / 2, ringY + ringSize + 28);

    // save final
    const outPath = path.join(cacheDir, `toilet_${Date.now()}.png`);
    const buf = canvas.toBuffer("image/png");
    await fs.writeFile(outPath, buf);

    // send
    const bodyMsg = mentionIds.length ? `${displayName}, বসে গেছো 🚽` : `${displayName}, বসে গেছো 🚽`;
    try {
      await new Promise((resolve, reject) => {
        api.sendMessage({ body: bodyMsg, attachment: fs.createReadStream(outPath) }, threadID, (err, info) => {
          if (err) return reject(err);
          resolve(info);
        }, messageID);
      });
    } catch (e) {
      try { api.sendMessage({ body: bodyMsg, attachment: fs.createReadStream(outPath) }, threadID, messageID); } catch(err2) { /* ignore */ }
    }

    // cleanup
    try { if (fs.existsSync(outPath)) await fs.unlink(outPath); } catch(e){/*ignore*/}
    try { if (replyImagePath && fs.existsSync(replyImagePath)) await fs.unlink(replyImagePath); } catch(e){/*ignore*/}

  } catch (err) {
    console.error("TOILET ERROR:", err && (err.stack || err.message));
    try { api.sendMessage("🔧 কিছু সমস্যা হয়েছে: " + (err.message || err), threadID, messageID); } catch(e){/*ignore*/}
  }
};