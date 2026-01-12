module.exports.config = {
  name: "hack",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed by assistant)",
  description: "Fake hack profile image",
  prefix: true,
  category: "Fun",
  usages: "@user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "canvas": ""
  }
};

module.exports.wrapText = async (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width < maxWidth) return [text];
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
};

module.exports.run = async function ({ api, event, Users }) {
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const axios = global.nodemodule["axios"] || require("axios");
  const { createCanvas, loadImage } = global.nodemodule["canvas"] || require("canvas");
  const path = require("path");

  const { threadID, messageID } = event;

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const bgPath = path.join(cacheDir, "bg.png");
  const avtPath = path.join(cacheDir, "avt.png");
  const outPath = path.join(cacheDir, "out.png");

  try {
    // target user
    const mentionIDs = Object.keys(event.mentions || {});
    const uid = mentionIDs.length ? mentionIDs[0] : event.senderID;
    const name = await Users.getNameUser(uid);

    // background image
    const bgURL =
      "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ";

    // download background
    const bgRes = await axios.get(bgURL, { responseType: "arraybuffer" });
    await fs.writeFile(bgPath, bgRes.data);

    // download avatar
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
    const avtRes = await axios.get(avatarURL, { responseType: "arraybuffer" });
    await fs.writeFile(avtPath, avtRes.data);

    // load images
    const bgImg = await loadImage(bgPath);
    const avtImg = await loadImage(avtPath);

    // canvas
    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // ===== TEXT =====
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "left";

    const textX = 220;
    const textY = 500;
    const maxWidth = 900;

    const lines = await this.wrapText(ctx, name, maxWidth);
    lines.forEach((l, i) => {
      ctx.fillText(l, textX, textY + i * 32);
    });

    // ===== CIRCULAR AVATAR (FIXED) =====
    const avtX = 83;
    const avtY = 437;
    const size = 100;
    const r = size / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avtX + r, avtY + r, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avtImg, avtX, avtY, size, size);
    ctx.restore();

    // optional border
    ctx.beginPath();
    ctx.arc(avtX + r, avtY + r, r + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#1878F3";
    ctx.lineWidth = 4;
    ctx.stroke();

    // export image
    await fs.writeFile(outPath, canvas.toBuffer());

    // send
    await api.sendMessage(
      {
        body: "",
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      () => {
        // cleanup
        try { fs.unlinkSync(bgPath); } catch {}
        try { fs.unlinkSync(avtPath); } catch {}
        try { fs.unlinkSync(outPath); } catch {}
      },
      messageID
    );

  } catch (err) {
    console.error("hack command error:", err);
    return api.sendMessage("❌ কিছু সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।", threadID, messageID);
  }
};