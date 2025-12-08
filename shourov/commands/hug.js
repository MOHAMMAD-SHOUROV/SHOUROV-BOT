module.exports.config = {
  name: "hug",
  version: "1.0.1",
  permission: 0,
  credits: "Md Fahim Islam (adapted by you)",
  description: "Send hug image (tag one user)",
  prefix: true,
  category: "kiss",
  usages: "tag",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

module.exports.onLoad = async () => {
  try {
    const path = global.nodemodule["path"];
    const fs = global.nodemodule["fs-extra"];
    const { downloadFile } = global.utils;
    const dir = path.resolve(__dirname, "cache", "canvas");
    await fs.ensureDir(dir);
    const assetPath = path.join(dir, "hugv1.png");
    if (!fs.existsSync(assetPath)) {
      // source image (same as original)
      await downloadFile("https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg", assetPath);
    }
  } catch (e) {
    console.error("hug onLoad error:", e && (e.stack || e));
  }
};

async function circle(imagePath) {
  const jimp = global.nodemodule["jimp"];
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];
  const jimp = global.nodemodule["jimp"];

  const dir = path.resolve(__dirname, "cache", "canvas");
  const basePath = path.join(dir, "hugv1.png");
  const outPath = path.join(dir, `hug_${one}_${two}_${Date.now()}.png`);
  const avatarOnePath = path.join(dir, `avt_${one}.png`);
  const avatarTwoPath = path.join(dir, `avt_${two}.png`);

  // download avatars (use binary)
  const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
  const urlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=${token}`;
  const urlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=${token}`;

  const resp1 = await axios.get(encodeURI(urlOne), { responseType: "arraybuffer", timeout: 15000 });
  await fs.writeFile(avatarOnePath, Buffer.from(resp1.data, "binary"));

  const resp2 = await axios.get(encodeURI(urlTwo), { responseType: "arraybuffer", timeout: 15000 });
  await fs.writeFile(avatarTwoPath, Buffer.from(resp2.data, "binary"));

  // load base and avatars with jimp, make circles and composite
  const baseImg = await jimp.read(basePath);
  const circOneBuf = await circle(avatarOnePath);
  const circTwoBuf = await circle(avatarTwoPath);

  const circOne = await jimp.read(circOneBuf);
  const circTwo = await jimp.read(circTwoBuf);

  // Resize & composite (positions from original module)
  baseImg.composite(circOne.resize(150, 150), 320, 100).composite(circTwo.resize(130, 130), 280, 280);

  const outBuffer = await baseImg.getBufferAsync(jimp.MIME_PNG);
  await fs.writeFile(outPath, outBuffer);

  // cleanup avatar temp files
  try { if (fs.existsSync(avatarOnePath)) await fs.unlink(avatarOnePath); } catch (e) {}
  try { if (fs.existsSync(avatarTwoPath)) await fs.unlink(avatarTwoPath); } catch (e) {}

  return outPath;
}

module.exports.run = async function ({ event, api, args }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;

  try {
    const mentionIds = Object.keys(event.mentions || {});
    if (!mentionIds.length) {
      return api.sendMessage("অনুগ্রহ করে 1 জনকে ট্যাগ করুন।", threadID, messageID);
    }

    const targetId = mentionIds[0];
    const targetName = event.mentions[targetId] || "User";

    // prevent tagging self? Uncomment if you want:
    // if (targetId == senderID) return api.sendMessage("নিজেকে ট্যাগ করতে পারবেন না।", threadID, messageID);

    const imagePath = await makeImage({ one: senderID, two: targetId });

    const msgBody = `💞 @${targetName} কে হাগ পাঠানো হলো!`;
    const mentions = [{ tag: `@${targetName}`, id: targetId }];

    await api.sendMessage({
      body: msgBody,
      mentions,
      attachment: fs.createReadStream(imagePath)
    }, threadID, async (err) => {
      // cleanup generated image
      try { if (fs.existsSync(imagePath)) await fs.unlink(imagePath); } catch (e) {}
      if (err) console.error("hug send error:", err);
    }, messageID);

  } catch (err) {
    console.error("hug command error:", err && (err.stack || err));
    return api.sendMessage("কোনো সমস্যা হয়েছে। পরে চেষ্টা করুন।", threadID, messageID);
  }
};