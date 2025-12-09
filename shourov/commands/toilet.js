// toilet.js
module.exports.config = {
  name: "toilet",
  version: "1.0.1",
  permission: 0,
  prefix: true,
  credits: "shourov (fixed)",
  description: "Make user sit on toilet (with real profile pic or fallback)",
  category: "fun",
  usages: "@tag / self / reply to image",
  cooldowns: 5
};

module.exports.run = async ({ event, api, args }) => {
  // Use global.nodemodule if available (some bot frameworks preload modules)
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
  const Canvas = (global.nodemodule && global.nodemodule["canvas"]) ? global.nodemodule["canvas"] : require("canvas");
  const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");
  const path = require("path");
  const request = (global.nodemodule && global.nodemodule["request"]) ? global.nodemodule["request"] : require("request");

  const { threadID, messageID, senderID } = event;

  // cache directories & TTL
  const CACHE_DIR = path.join(__dirname, "cache");
  const AVATAR_CACHE = path.join(CACHE_DIR, "avatars");
  const TEMPLATE_DIR = path.join(__dirname, "cache", "canvas");
  const BASE_TEMPLATE = path.join(TEMPLATE_DIR, "toilet_template.jpg"); // we'll try to download if missing
  const AVATAR_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // ensure dirs
  await fs.ensureDir(CACHE_DIR);
  await fs.ensureDir(AVATAR_CACHE);
  await fs.ensureDir(TEMPLATE_DIR);

  // helper: safe axios GET with retries
  async function axiosGet(url, opts = {}, retries = 1) {
    try {
      return await axios.get(url, opts);
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 800)); // small backoff
        return axiosGet(url, opts, retries - 1);
      }
      throw err;
    }
  }

  // helper: download base template if missing
  async function ensureBaseTemplate() {
    const fallbackUrl = "https://i.imgur.com/Kn7KpAr.jpg"; // original background used earlier
    if (!fs.existsSync(BASE_TEMPLATE)) {
      try {
        const resp = await axiosGet(fallbackUrl, { responseType: "arraybuffer", timeout: 20000 }, 2);
        fs.writeFileSync(BASE_TEMPLATE, Buffer.from(resp.data));
      } catch (e) {
        console.warn("Failed to download base template:", e && e.message);
        // create a simple blank background as fallback
        const c = Canvas.createCanvas(500, 670);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, c.width, c.height);
        const buffer = c.toBuffer("image/jpeg");
        fs.writeFileSync(BASE_TEMPLATE, buffer);
      }
    }
  }

  // helper: generate placeholder avatar (colored circle)
  async function createPlaceholderAvatar(outPath, size = 512, color = null) {
    const img = await jimp.create(size, size, color || JimpColorFromUid(String(Date.now())));
    // draw a white circle in center to mimic avatar silhouette
    const circle = await jimp.create(size, size, 0x00000000);
    circle.scan(0, 0, size, size, function (x, y, idx) {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 10;
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        // opaque white
        circle.bitmap.data[idx + 0] = 255;
        circle.bitmap.data[idx + 1] = 255;
        circle.bitmap.data[idx + 2] = 255;
        circle.bitmap.data[idx + 3] = 255;
      } else {
        // transparent
        circle.bitmap.data[idx + 3] = 0;
      }
    });
    await img.composite(circle, 0, 0);
    await img.writeAsync(outPath);
  }

  // small deterministic color generator for placeholder
  function JimpColorFromUid(str) {
    // return a hex number for jimp color (0xRRGGBBFF)
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    const r = (hash >> 16) & 0xff;
    const g = (hash >> 8) & 0xff;
    const b = (hash) & 0xff;
    // jimp expects hex ARGB (0xAARRGGBB) when using number, but jimp.create uses hex color string OK.
    // We'll return integer color with alpha full (0xFFFFFFFF)
    return (0xff << 24) | (r << 16) | (g << 8) | b;
  }

  // fetch avatar with redirect=false to check is_silhouette; cache result
  async function fetchAvatarForUid(uid) {
    const outFile = path.join(AVATAR_CACHE, `${uid}.png`);
    try {
      // if cached and recent, return it
      if (fs.existsSync(outFile)) {
        const stat = await fs.stat(outFile);
        if (Date.now() - stat.mtimeMs < AVATAR_TTL) {
          return outFile;
        }
      }

      // first check JSON (redirect=false)
      const infoUrl = `https://graph.facebook.com/${uid}/picture?redirect=false&width=512&height=512`;
      let dataResp;
      try {
        dataResp = await axiosGet(infoUrl, { timeout: 10000 });
      } catch (err) {
        // network error or rate-limited; fallback to direct picture URL try
        console.warn("Graph picture info error:", err && err.message);
      }

      if (dataResp && dataResp.data && dataResp.data.data) {
        const info = dataResp.data.data;
        if (info.is_silhouette) {
          // user has no public picture -> create placeholder
          await createPlaceholderAvatar(outFile, 512);
          return outFile;
        } else if (info.url) {
          // download the real image url
          try {
            const imgResp = await axiosGet(info.url, { responseType: "arraybuffer", timeout: 15000 }, 2);
            fs.writeFileSync(outFile, Buffer.from(imgResp.data));
            return outFile;
          } catch (err) {
            console.warn("Failed to download avatar url:", err && err.message);
            // fallback placeholder
            await createPlaceholderAvatar(outFile, 512);
            return outFile;
          }
        }
      }

      // If we reached here, either dataResp missing or unexpected -> try direct picture endpoint (may redirect)
      try {
        const directUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
        const resp = await axiosGet(directUrl, { responseType: "arraybuffer", timeout: 15000 }, 1);
        fs.writeFileSync(outFile, Buffer.from(resp.data));
        return outFile;
      } catch (err) {
        console.warn("Direct avatar fetch failed:", err && err.message);
        await createPlaceholderAvatar(outFile, 512);
        return outFile;
      }

    } catch (err) {
      console.error("fetchAvatarForUid error:", err && (err.stack || err));
      // ensure placeholder exists
      try {
        if (!fs.existsSync(outFile)) await createPlaceholderAvatar(outFile, 512);
      } catch (e) {}
      return outFile;
    }
  }

  // If user replied to an image, download and use that image as avatar
  async function fetchAvatarFromReplyImage(attach) {
    const ext = (attach.url && attach.url.split('.').pop().split('?')[0]) || 'jpg';
    const outFile = path.join(AVATAR_CACHE, `reply_${Date.now()}.${ext}`);
    try {
      await new Promise((resolve, reject) => {
        request.get(encodeURI(attach.url)).on('error', reject).pipe(fs.createWriteStream(outFile)).on('close', resolve);
      });
      return outFile;
    } catch (err) {
      console.warn("Failed to download replied image:", err && err.message);
      return null;
    }
  }

  // ---------- main ----------
  try {
    await ensureBaseTemplate();

    // 1) determine target id or replied image
    let targetID = senderID;
    let replyImagePath = null;

    // if mentions exist, pick first mentioned user
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.type === "message_reply" && event.messageReply && Array.isArray(event.messageReply.attachments) && event.messageReply.attachments.length) {
      // if reply to an attachment image, use that as avatar two
      const attach = event.messageReply.attachments[0];
      if ((attach.url && (/\.(jpg|jpeg|png|gif)$/i.test(attach.url))) || (attach.type && attach.type === "photo")) {
        try {
          replyImagePath = await fetchAvatarFromReplyImage(attach);
        } catch (e) {
          console.warn("Reply image fetch error:", e && e.message);
        }
      }
    }

    // If no mention and no reply-image, then bot requested to tag someone -> message
    if (!targetID && !replyImagePath) {
      return api.sendMessage("Please tag someone or reply to an image.", threadID, messageID);
    }

    // fetch avatar (either from uid or replyImagePath)
    let avatarPath;
    if (replyImagePath) {
      avatarPath = replyImagePath;
    } else {
      avatarPath = await fetchAvatarForUid(targetID);
    }

    // now compose final image using Canvas + Jimp circle
    const outPath = path.join(CACHE_DIR, `toilet_${targetID}_${Date.now()}.png`);

    // load base template and avatar (ensure proper sizing and circle crop)
    const bgBuf = fs.readFileSync(BASE_TEMPLATE);
    const bgImage = await Canvas.loadImage(bgBuf);

    // prepare avatar circular buffer via jimp to ensure circle
    const avatarJimp = await jimp.read(avatarPath);
    avatarJimp.cover(205, 205); // ensure square then circle
    avatarJimp.circle();
    const circBuf = await avatarJimp.getBufferAsync(jimp.MIME_PNG);
    const avaImage = await Canvas.loadImage(circBuf);

    // Canvas draw
    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bgImage, 0, 0, 500, 670);

    // previous code used positions 135,350 with 205x205
    ctx.drawImage(avaImage, 135, 350, 205, 205);

    // optional: draw a small username text under avatar (safe fallback)
    try {
      ctx.font = "18px Sans";
      ctx.fillStyle = "#111";
      const label = event.mentions && Object.keys(event.mentions).length ? (event.mentions[Object.keys(event.mentions)[0]] || "User") : "You";
      // center text under avatar
      const textW = ctx.measureText(label).width;
      ctx.fillText(label, 135 + (205 - textW) / 2, 350 + 205 + 22);
    } catch (e) {
      // ignore if fonts not available
    }

    const finalBuf = canvas.toBuffer("image/png");
    fs.writeFileSync(outPath, finalBuf);

    // send result
    await api.sendMessage({
      body: "🚽🧻",
      attachment: fs.createReadStream(outPath)
    }, threadID, async (err) => {
      // cleanup
      try { if (fs.existsSync(outPath)) await fs.unlink(outPath); } catch (e) {}
      // optional: remove replyImagePath if temp
      try { if (replyImagePath && fs.existsSync(replyImagePath)) await fs.unlink(replyImagePath); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("TOILET ERROR:", err && (err.stack || err));
    return api.sendMessage("🔧 সার্ভার সমস্যা: " + (err && err.message ? err.message : "unknown"), threadID, messageID);
  }
};