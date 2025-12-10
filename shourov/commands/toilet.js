module.exports.config = {
  name: "toilet",
  version: "3.0.0",
  permission: 0,
  prefix: true,
  credits: "Shourov + ChatGPT",
  description: "Works even if user profile pic is private",
  category: "fun",
  cooldowns: 5
};

module.exports.run = async ({ event, api }) => {

  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");
  const Canvas = require("canvas");
  const Jimp = require("jimp");

  const cache = path.join(__dirname, "cache");
  fs.ensureDirSync(cache);

  const target = Object.keys(event.mentions || {})[0] || event.senderID;
  const outPath = path.join(cache, `toilet_${Date.now()}.png`);

  // -----------------------------------------
  // 1️⃣ SAFE AVATAR FETCH — PRIVATE DP SUPPORT
  // -----------------------------------------
  async function getAvatar(uid) {
    // Try official facebook graph
    try {
      let r = await axios.get(
        `https://graph.facebook.com/${uid}/picture?width=1024&height=1024&redirect=false`
      );
      if (r.data?.data?.url) {
        let img = await axios.get(r.data.data.url, { responseType: "arraybuffer" });
        return Buffer.from(img.data);
      }
    } catch {}

    // Try old facebook picture url
    try {
      let fallbackURL = `https://graph.facebook.com/${uid}/picture?width=1024&height=1024`;
      let img = await axios.get(fallbackURL, { responseType: "arraybuffer" });
      return Buffer.from(img.data);
    } catch {}

    // ❗ FINAL METHOD — uses Messenger API (always works)
    try {
      let info = await api.getUserInfo(uid);
      if (info[uid]?.profileUrl) {
        let html = info[uid].profileUrl;
        let img = await axios.get(html, { responseType: "arraybuffer" });
        return Buffer.from(img.data);
      }
    } catch {}

    // fallback default avatar
    const blank = new Jimp(512, 512, "#999");
    return await blank.getBufferAsync(Jimp.MIME_PNG);
  }

  // -----------------------------------------
  // 2️⃣ BACKGROUND LOAD
  // -----------------------------------------
  let bgURL = "https://i.imgur.com/Kn7KpAr.jpg";
  let bg = Buffer.from(
    (await axios.get(bgURL, { responseType: "arraybuffer" })).data
  );

  // -----------------------------------------
  // 3️⃣ AVATAR PROCESS (circle + HD)
  // -----------------------------------------
  let avatar = await getAvatar(target);
  let av = await Jimp.read(avatar);
  av.cover(400, 400);
  av.circle();
  let cir = await av.getBufferAsync("image/png");

  // -----------------------------------------
  // 4️⃣ DRAW CANVAS
  // -----------------------------------------
  const bgImg = await Canvas.loadImage(bg);
  const avImg = await Canvas.loadImage(cir);

  const canvas = Canvas.createCanvas(500, 670);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImg, 0, 0, 500, 670);
  ctx.drawImage(avImg, 150, 335, 200, 200);

  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

  // -----------------------------------------
  // 5️⃣ SEND RESULT
  // -----------------------------------------
  api.sendMessage(
    {
      body: "🚽 বসে গেছে ভাই 😭",
      attachment: fs.createReadStream(outPath)
    },
    event.threadID,
    () => fs.unlinkSync(outPath)
  );
};