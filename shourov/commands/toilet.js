module.exports.config = {
  name: "toilet",
  version: "2.0.0",
  permission: 0,
  prefix: true,
  credits: "Shourov (Fixed by ChatGPT)",
  description: "Make user sit in toilet — clear HD avatar",
  category: "fun",
  cooldowns: 5
};

module.exports.run = async ({ event, api }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Canvas = require("canvas");
  const Jimp = require("jimp");

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const target =
    Object.keys(event.mentions || {})[0] || event.senderID;

  const outPath = path.join(cacheDir, `toilet_${Date.now()}.png`);

  // -------------------------
  // SAFE IMAGE DOWNLOAD
  // -------------------------
  async function fetchBuffer(url) {
    try {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      return Buffer.from(res.data);
    } catch {
      return null;
    }
  }

  // -------------------------
  // FETCH PROFILE PIC (WEBP FIX)
  // -------------------------
  async function getAvatar(uid) {
    let url =
      `https://graph.facebook.com/${uid}/picture?width=1024&height=1024&redirect=false`;

    let realUrl = null;
    try {
      const r = await axios.get(url);
      realUrl = r.data.data.url;
    } catch {}

    if (!realUrl)
      realUrl =
        `https://graph.facebook.com/${uid}/picture?width=1024&height=1024`;

    let buffer = await fetchBuffer(realUrl);
    if (!buffer) {
      const fallback = new Jimp(512, 512, "#999");
      return await fallback.getBufferAsync(Jimp.MIME_PNG);
    }

    // 👉 Convert WEBP → PNG always
    const img = await Jimp.read(buffer);
    return await img.getBufferAsync(Jimp.MIME_PNG);
  }

  // -------------------------
  // LOAD BACKGROUND
  // -------------------------
  let bgBuffer = await fetchBuffer("https://i.imgur.com/Kn7KpAr.jpg");
  if (!bgBuffer) {
    const fallback = new Jimp(500, 670, "#ffffff");
    bgBuffer = await fallback.getBufferAsync(Jimp.MIME_PNG);
  }

  // -------------------------
  // PREPARE AVATAR CLEANLY
  // -------------------------
  let avatarBuf = await getAvatar(target);

  let av = await Jimp.read(avatarBuf);
  
  // ensure HD
  av.cover(400, 400);

  // circle mask clean
  av.circle();

  // export avatar PNG
  const finalAvatar = await av.getBufferAsync(Jimp.MIME_PNG);

  // -------------------------
  // CANVAS DRAW
  // -------------------------
  const bg = await Canvas.loadImage(bgBuffer);
  const ava = await Canvas.loadImage(finalAvatar);

  const canvas = Canvas.createCanvas(500, 670);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bg, 0, 0, 500, 670);

  // Avatar position tuned
  ctx.drawImage(ava, 150, 335, 200, 200);

  const final = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, final);

  // -------------------------
  // SEND
  // -------------------------
  api.sendMessage(
    {
      body: "🚽 বসে গেছো ভাই 😭",
      attachment: fs.createReadStream(outPath)
    },
    event.threadID,
    event.messageID
  );

  // cleanup
  setTimeout(() => fs.unlinkSync(outPath), 5000);
};