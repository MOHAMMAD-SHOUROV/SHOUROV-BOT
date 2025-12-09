module.exports.config = {
  name: "cur",
  version: "1.0.1",
  permission: 0,
  credits: "SIDDIK (Improved by Shourov/ChatGPT)",
  description: "Nombar 1 Chor - Profile avatar draw on image",
  prefix: true,
  category: "Picture",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "jimp": "",
    "canvas": ""
  }
};

module.exports.circle = async (imageBuffer) => {
  const jimp = global.nodemodule['jimp'];
  const img = await jimp.read(imageBuffer);
  img.circle();
  return await img.getBufferAsync("image/png");
};

module.exports.run = async ({ event, api, args, Users }) => {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  try {
    // ensure cache folder exists
    const cacheDir = path.resolve(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const Canvas = global.nodemodule['canvas'];
    // prefer node-superfetch if available, otherwise axios
    const superfetch = global.nodemodule["node-superfetch"];
    const axios = global.nodemodule["axios"] || require("axios");
    const jimp = global.nodemodule["jimp"];

    const outPath = path.join(cacheDir, `cur_${Date.now()}.png`);
    const backgroundUrl = 'https://i.imgur.com/ES28alv.png';

    // get target id: mention first else sender
    const id = Object.keys(event.mentions || {})[0] || event.senderID;

    // create canvas
    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext('2d');

    // load background (from URL)
    let bgBuffer;
    try {
      if (superfetch) {
        const res = await superfetch.get(backgroundUrl);
        bgBuffer = res.body;
      } else {
        const res = await axios.get(backgroundUrl, { responseType: 'arraybuffer', timeout: 15000 });
        bgBuffer = Buffer.from(res.data, "binary");
      }
    } catch (err) {
      // fallback: draw a simple colored background if external fetch fails
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      bgBuffer = null;
    }

    if (bgBuffer) {
      const bgImg = await Canvas.loadImage(bgBuffer);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    }

    // download avatar
    let avatarBuf;
    const avatarUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512`;
    try {
      if (superfetch) {
        const r = await superfetch.get(avatarUrl);
        avatarBuf = r.body;
      } else {
        const r = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 15000 });
        avatarBuf = Buffer.from(r.data, "binary");
      }
    } catch (err) {
      // if avatar fails, create placeholder circle using jimp
      const placeholder = new jimp(512, 512, 0x999999FF);
      const phbuf = await placeholder.getBufferAsync(jimp.MIME_PNG);
      avatarBuf = phbuf;
    }

    // make circular avatar
    const circBuf = await this.circle(avatarBuf);

    // draw circular avatar at coordinates (48,410) with size 111x111 (like original)
    const avatarImg = await Canvas.loadImage(circBuf);
    ctx.drawImage(avatarImg, 48, 410, 111, 111);

    // optional: draw a small name text under avatar (fetch name)
    try {
      const name = await Users.getNameUser(id);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      // draw text with shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(name, 48, 525);
      ctx.shadowBlur = 0;
    } catch (e) {
      // ignore name drawing if fails
    }

    // export and save
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(outPath, imageBuffer);

    // send message and cleanup
    const bodyText = `╭─────•◈•─────╮\n\nমুরগির ডিম চুরি করতে গিয়া ধরা থাইসে_ 🐸👻\n\n╰─────•◈•─────╯`;
    await api.sendMessage({ body: bodyText, attachment: fs.createReadStream(outPath) }, event.threadID, () => {
      // cleanup
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);

  } catch (err) {
    console.error("cur command error:", err);
    // send readable error to admin (but polite)
    return api.sendMessage("কোথাও ত্রুটি হয়েছে — অনুগ্রহ করে পরে আবার চেষ্টা করুন।\n\nError: " + (err.message || err), event.threadID, event.messageID);
  }
};