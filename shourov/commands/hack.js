module.exports.config = {
  name: "hack",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  description: "example",
  prefix: true,
  category: "Fun",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "canvas": ""
  }
};

module.exports.wrapText = (ctx, name, maxWidth) => {
  return new Promise(resolve => {
    if (ctx.measureText(name).width < maxWidth) return resolve([name]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = name.split(' ');
    const lines = [];
    let line = '';
    while (words.length > 0) {
      let split = false;
      while (ctx.measureText(words[0]).width >= maxWidth) {
        const temp = words[0];
        words[0] = temp.slice(0, -1);
        if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
        else {
          split = true;
          words.splice(1, 0, temp.slice(-1));
        }
      }
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
}

module.exports.run = async function ({ args, Users, Threads, api, event, Currencies }) {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const { loadImage, createCanvas } = global.nodemodule["canvas"];
  const path = require("path");

  const { threadID, messageID } = event;

  // ensure cache dir
  const cacheDir = path.join(__dirname, "cache");
  try {
    await fs.ensureDir(cacheDir);
  } catch (e) { /* ignore */ }

  const pathImg = path.join(cacheDir, "background.png");
  const pathAvt1 = path.join(cacheDir, "Avtmot.png");

  try {
    // get target id (mention or sender)
    const mentionIDs = Object.keys(event.mentions || {});
    const id = mentionIDs.length > 0 ? mentionIDs[0] : event.senderID;
    const name = await Users.getNameUser(id);

    // random background list (আপনি চাইলে আরও url যোগ করতে পারেন)
    const background = [
      "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ"
    ];
    const rd = background[Math.floor(Math.random() * background.length)];

    // download avatar
    const graphUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720`;
    const avResp = await axios.get(graphUrl, { responseType: "arraybuffer", timeout: 15000 });
    await fs.writeFile(pathAvt1, Buffer.from(avResp.data));

    // download background
    const bgResp = await axios.get(rd, { responseType: "arraybuffer", timeout: 15000 });
    await fs.writeFile(pathImg, Buffer.from(bgResp.data));

    // load images
    const baseImage = await loadImage(pathImg);
    const baseAvt1 = await loadImage(pathAvt1);

    // create canvas
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // text settings (আপনি চাইলে ফন্ট/সাইজ অ্যাডজাস্ট করতে পারেন)
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";

    // wrap text to fit a box width (আপনি maxWidth বদলে দিতে পারেন)
    const maxWidth = 1160;
    const lines = await this.wrapText(ctx, name, maxWidth);
    const textX = 200;
    const textY = 497;

    if (Array.isArray(lines)) {
      // draw multiple lines — adjust line height if দরকার
      const lineHeight = 30;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], textX, textY + (i * lineHeight));
      }
    } else {
      ctx.fillText(name, textX, textY);
    }

    // draw avatar
    ctx.beginPath();
    ctx.drawImage(baseAvt1, 83, 437, 100, 101);

    // export image
    const imageBuffer = canvas.toBuffer();
    await fs.writeFile(pathImg, imageBuffer);

    // send message with attachment
    await api.sendMessage({
      body: ` `,
      attachment: fs.createReadStream(pathImg)
    }, threadID, (err, info) => {
      // cleanup files
      try { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); } catch (e) {}
      try { if (fs.existsSync(pathAvt1)) fs.unlinkSync(pathAvt1); } catch (e) {}
      if (err) console.error("sendMessage error (hack):", err);
    }, messageID);

  } catch (error) {
    console.error("hack command error:", error && (error.stack || error));
    // try to cleanup partial files
    try { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); } catch (e) {}
    try { if (fs.existsSync(pathAvt1)) fs.unlinkSync(pathAvt1); } catch (e) {}
    return api.sendMessage("কোনো সমস্যা হয়েছে — আবার চেষ্টা করুন।", threadID, messageID);
  }
};