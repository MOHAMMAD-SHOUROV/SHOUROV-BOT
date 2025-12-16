// commands/hug.js
const path = require("path");
const fs = require("fs-extra");
const axios = require("axios");
const Jimp = require("jimp");

module.exports.config = {
  name: "hug",
  version: "2.0.0",
  permission: 0,
  credits: "Md Shourov Islam (fixed & cleaned)",
  description: "Hug image with profile pictures",
  prefix: true,
  category: "fun",
  usages: "@mention / reply",
  cooldowns: 5
};

module.exports.onLoad = async () => {
  const dir = path.join(__dirname, "cache");
  const basePath = path.join(dir, "shourovh.jpg");
  const baseUrl = "https://i.imgur.com/BtSlsSS.jpg";

  await fs.ensureDir(dir);
  if (!fs.existsSync(basePath)) {
    const res = await axios.get(baseUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(basePath, Buffer.from(res.data));
    console.log("[hug] base image downloaded");
  }
};

async function circleAvatar(buffer, size = 400) {
  const img = await Jimp.read(buffer);
  img.cover(size, size).circle();
  return img;
}

async function getAvatar(userID) {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=1024&height=1024`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch {
    const fallback = new Jimp(1024, 1024, "#777777");
    return await fallback.getBufferAsync(Jimp.MIME_PNG);
  }
}

async function makeImage(one, two) {
  const dir = path.join(__dirname, "cache");
  const basePath = path.join(dir, "shourovh.jpg");
  const outPath = path.join(dir, `hug_${Date.now()}.png`);

  const base = await Jimp.read(basePath);

  const av1 = await circleAvatar(await getAvatar(one), 260);
  const av2 = await circleAvatar(await getAvatar(two), 240);

  base.resize(700, Jimp.AUTO)
    .composite(av1, 380, 40)
    .composite(av2, 120, 90);

  await base.writeAsync(outPath);
  return outPath;
}

module.exports.run = async ({ event, api }) => {
  const { threadID, messageID, senderID } = event;

  let targetID = null;
  if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
  } else if (event.mentions && Object.keys(event.mentions).length) {
    targetID = Object.keys(event.mentions)[0];
  }

  if (!targetID) {
    return api.sendMessage(
      "⚠️ কাউকে ট্যাগ করুন অথবা তার মেসেজে reply দিন",
      threadID,
      messageID
    );
  }

  try {
    const imgPath = await makeImage(senderID, targetID);
    await api.sendMessage(
      {
        body: "🫂 Hug time!",
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  } catch (e) {
    console.error("[hug] error:", e);
    api.sendMessage("❌ কিছু সমস্যা হয়েছে", threadID, messageID);
  }
};