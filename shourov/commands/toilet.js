module.exports.config = {
  name: "toilet",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "shourov",
  description: "Make user sit on toilet",
  category: "fun",
  usages: "@tag / self",
  cooldowns: 5
};

module.exports.run = async ({ event, api, args }) => {
  const fs = require("fs-extra");
  const axios = require("axios");
  const Canvas = require("canvas");
  const jimp = require("jimp");

  try {
    const cacheDir = __dirname + "/cache";
    await fs.ensureDir(cacheDir);

    const outPath = cacheDir + `/toilet_${Date.now()}.png`;

    // ---------- Target User ----------
    const mentions = event.mentions || {};
    const targetID = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : event.senderID;

    // ---------- Background (safe axios buffer) ----------
    const bgURL = "https://i.imgur.com/Kn7KpAr.jpg";
    const bgRes = await axios.get(bgURL, { responseType: "arraybuffer", timeout: 20000 });
    const bgBuffer = Buffer.from(bgRes.data);

    // ---------- Avatar ----------
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
    let avatarBuffer;
    try {
      const avRes = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 15000 });
      avatarBuffer = Buffer.from(avRes.data);
    } catch {
      // fallback blank avatar if blocked
      const img = new jimp(512, 512, "#333");
      avatarBuffer = await img.getBufferAsync(jimp.MIME_PNG);
    }

    // ---------- Circle Crop ----------
    const avatarImg = await jimp.read(avatarBuffer);
    avatarImg.circle();
    const circleAvatar = await avatarImg.getBufferAsync(jimp.MIME_PNG);

    // ---------- Canvas Draw ----------
    const bg = await Canvas.loadImage(bgBuffer);
    const ava = await Canvas.loadImage(circleAvatar);

    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, 500, 670);
    ctx.drawImage(ava, 135, 350, 205, 205);

    const finalBuffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outPath, finalBuffer);

    // ---------- Send ----------
    await api.sendMessage({
      body: "🚽🧻",
      attachment: fs.createReadStream(outPath)
    }, event.threadID, event.messageID);

    // ---------- Cleanup ----------
    try { fs.unlinkSync(outPath); } catch {}

  } catch (err) {
    console.error("TOILET ERROR:", err);
    return api.sendMessage("🔧 সার্ভার সমস্যা: " + (err.message || err), event.threadID, event.messageID);
  }
};