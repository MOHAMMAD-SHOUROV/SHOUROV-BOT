const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

/* ================= CONFIG ================= */
module.exports.config = {
  name: "hack",
  version: "2.0.0",
  permission: 0,
  credits: "shourov (fully fixed)",
  description: "Fake hack image with real name & profile picture",
  prefix: true,
  category: "Fun",
  usages: "hack @user",
  cooldowns: 5
};

/* ================= HELPER ================= */
async function getSafeUserInfo({ api, Users, event }) {
  let uid = event.senderID;
  const mentionIDs = Object.keys(event.mentions || {});
  if (mentionIDs.length > 0) uid = mentionIDs[0];

  // get name
  let name = "Facebook User";
  try {
    name = await Users.getNameUser(uid);
    if (!name || name.startsWith("User")) throw new Error();
  } catch {
    try {
      const info = await api.getUserInfo(uid);
      if (info?.[uid]?.name) name = info[uid].name;
    } catch {}
  }

  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;

  return { uid, name, avatarURL };
}

/* ================= RUN ================= */
module.exports.run = async function ({ api, event, Users }) {
  const { threadID, messageID } = event;

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const bgPath = path.join(cacheDir, "hack_bg.png");
  const avtPath = path.join(cacheDir, "hack_avt.png");
  const outPath = path.join(cacheDir, "hack_result.png");

  try {
    /* ==== USER INFO ==== */
    const { name, avatarURL } = await getSafeUserInfo({ api, Users, event });

    /* ==== BACKGROUND ==== */
    const bgURL =
      "https://i.imgur.com/4M34hi2.png"; // তুমি চাইলে নিজের background দিতে পারো
    const bgRes = await axios.get(bgURL, { responseType: "arraybuffer" });
    await fs.writeFile(bgPath, bgRes.data);

    /* ==== AVATAR ==== */
    const avtRes = await axios.get(avatarURL, {
      responseType: "arraybuffer",
      timeout: 15000
    });
    await fs.writeFile(avtPath, avtRes.data);

    /* ==== CANVAS ==== */
    const bgImg = await loadImage(bgPath);
    const avtImg = await loadImage(avtPath);

    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImg, 0, 0);

    /* ==== DRAW AVATAR (CIRCLE) ==== */
    const avX = 80;
    const avY = 420;
    const avSize = 110;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avtImg, avX, avY, avSize, avSize);
    ctx.restore();

    /* ==== DRAW NAME ==== */
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#1877F2";
    ctx.textAlign = "left";
    ctx.fillText(name, 220, 480);

    /* ==== SAVE ==== */
    await fs.writeFile(outPath, canvas.toBuffer());

    /* ==== SEND ==== */
    await api.sendMessage(
      {
        body: "💻 HACK IN PROGRESS...",
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      messageID
    );

  } catch (err) {
    console.error("hack.js error:", err);
    api.sendMessage("❌ Hack failed, try again later.", threadID, messageID);
  } finally {
    // cleanup
    [bgPath, avtPath, outPath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }
};