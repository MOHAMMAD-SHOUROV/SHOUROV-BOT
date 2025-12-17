const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "hug",
  version: "1.0.2",
  permission: 0,
  credits: "Shourov (fixed by ChatGPT)",
  description: "Create hug image with profile pictures",
  prefix: true,
  category: "fun",
  usages: "@mention / reply",
  cooldowns: 5
};

// download helper
async function download(url, filePath) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  fs.writeFileSync(filePath, Buffer.from(res.data));
}

// circle avatar
async function circleImage(filePath) {
  const img = await jimp.read(filePath);
  img.circle();
  return img;
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID } = event;

  try {
    // detect target
    let targetID;
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.type === "message_reply" && event.messageReply.senderID) {
      targetID = event.messageReply.senderID;
    } else {
      return api.sendMessage(
        "⚠️ কাউকে ট্যাগ করুন অথবা তার মেসেজে reply দিন!",
        threadID,
        messageID
      );
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const basePath = path.join(cacheDir, "shourovh.jpg");
    const av1 = path.join(cacheDir, `avt_${senderID}.png`);
    const av2 = path.join(cacheDir, `avt_${targetID}.png`);
    const outPath = path.join(cacheDir, `hug_${Date.now()}.png`);

    // base image
    if (!fs.existsSync(basePath)) {
      await download("https://i.imgur.com/BtSlsSS.jpg", basePath);
    }

    // avatars (HD)
    await download(
      `https://graph.facebook.com/${senderID}/picture?width=720&height=720`,
      av1
    );
    await download(
      `https://graph.facebook.com/${targetID}/picture?width=720&height=720`,
      av2
    );

    // process
    const base = await jimp.read(basePath);
    const c1 = await circleImage(av1);
    const c2 = await circleImage(av2);

    base.resize(700, jimp.AUTO);
    c1.resize(200, 200);
    c2.resize(200, 200);

    // positions tuned
    base
      .composite(c1, 390, 40) // sender
      .composite(c2, 120, 90); // target

    await base.writeAsync(outPath);

    // get name
    let name = "Someone";
    try {
      const info = await api.getUserInfo(targetID);
      if (info[targetID]?.name) name = info[targetID].name;
    } catch {}

    // send
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
    [av1, av2, outPath].forEach(f => {
      try { fs.unlinkSync(f); } catch {}
    });

  } catch (err) {
    console.error("HUG ERROR:", err);
    api.sendMessage("❌ Hug বানাতে সমস্যা হয়েছে!", threadID, messageID);
  }
};