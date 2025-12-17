// commands/hug.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "hug",
  version: "1.0.2",
  permission: 0,
  credits: "Shourov (fixed)",
  description: "Make a hug image with two profile pictures",
  prefix: true,
  category: "fun",
  usages: "@mention / reply",
  cooldowns: 5
};

// download image helper
async function downloadImage(url, filePath) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  fs.writeFileSync(filePath, Buffer.from(res.data));
}

// make avatar circle
async function circleImage(imgPath) {
  const img = await jimp.read(imgPath);
  img.circle();
  return img;
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    // target user
    let targetID = null;
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.type === "message_reply" && event.messageReply.senderID) {
      targetID = event.messageReply.senderID;
    } else {
      return api.sendMessage(
        "⚠️ একজনকে ট্যাগ করুন অথবা তার মেসেজে reply দিন!",
        threadID,
        messageID
      );
    }

    // paths
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const basePath = path.join(cacheDir, "shourovh.jpg);
    const avt1Path = path.join(cacheDir, `avt_${senderID}.png`);
    const avt2Path = path.join(cacheDir, `avt_${targetID}.png`);
    const outPath = path.join(cacheDir, `hug_${Date.now()}.png`);

    // base image (hug template)
    if (!fs.existsSync(basePath)) {
      await downloadImage(
        "https://i.imgur.com/BtSlsSS.jpg",
        basePath
      );
    }

    // download avatars (HD)
    await downloadImage(
      `https://graph.facebook.com/${senderID}/picture?width=720&height=720`,
      avt1Path
    );
    await downloadImage(
      `https://graph.facebook.com/${targetID}/picture?width=720&height=720`,
      avt2Path
    );

    // process images
    const base = await jimp.read(basePath);
    const avt1 = await circleImage(avt1Path);
    const avt2 = await circleImage(avt2Path);

    base.resize(700, jimp.AUTO);
    avt1.resize(200, 200);
    avt2.resize(200, 200);

    // positions (tuned for template)
    base
      .composite(avt1, 390, 40)  // sender
      .composite(avt2, 120, 90); // target

    await base.writeAsync(outPath);

    // get name
    let name = "someone";
    try {
      const info = await api.getUserInfo(targetID);
      if (info && info[targetID] && info[targetID].name) {
        name = info[targetID].name;
      }
    } catch {}

    // send message
    await api.sendMessage(
      {
        body: `🤗 Hug for ${name}`,
        mentions: [{ tag: name, id: targetID }],
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      messageID
    );

    // cleanup
    fs.unlinkSync(avt1Path);
    fs.unlinkSync(avt2Path);
    fs.unlinkSync(outPath);

  } catch (err) {
    console.error("HUG ERROR:", err);
    api.sendMessage("❌ Hug বানাতে সমস্যা হয়েছে!", threadID, messageID);
  }
};