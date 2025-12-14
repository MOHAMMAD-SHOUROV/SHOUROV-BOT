module.exports.config = {
  name: "hug",
  version: "1.0.2",
  permission: 0,
  credits: "shourov)",
  description: "Send hug image (tag one user)",
  prefix: true,
  category: "love",
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
      await downloadFile(
        "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
        assetPath
      );
    }
  } catch (e) {
    console.error("hug onLoad error:", e);
  }
};

async function circle(imagePath) {
  const jimp = global.nodemodule["jimp"];
  const img = await jimp.read(imagePath);
  img.circle();
  return img.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];
  const jimp = global.nodemodule["jimp"];

  const dir = path.resolve(__dirname, "cache", "canvas");
  const basePath = path.join(dir, "hugv1.png");
  const outPath = path.join(dir, `hug_${Date.now()}.png`);

  const avt1 = path.join(dir, `avt_${one}.png`);
  const avt2 = path.join(dir, `avt_${two}.png`);

  // Facebook avatar (NO TOKEN)
  const url1 = `https://graph.facebook.com/${one}/picture?width=512&height=512`;
  const url2 = `https://graph.facebook.com/${two}/picture?width=512&height=512`;

  const r1 = await axios.get(url1, { responseType: "arraybuffer" });
  const r2 = await axios.get(url2, { responseType: "arraybuffer" });

  await fs.writeFile(avt1, Buffer.from(r1.data));
  await fs.writeFile(avt2, Buffer.from(r2.data));

  const base = await jimp.read(basePath);
  const c1 = await jimp.read(await circle(avt1));
  const c2 = await jimp.read(await circle(avt2));

  base
    .composite(c1.resize(150, 150), 320, 100)
    .composite(c2.resize(130, 130), 280, 280);

  await base.writeAsync(outPath);

  // cleanup
  fs.unlinkSync(avt1);
  fs.unlinkSync(avt2);

  return outPath;
}

module.exports.run = async function ({ event, api }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;

  try {
    const mentionIDs = Object.keys(event.mentions || {});
    if (!mentionIDs.length) {
      return api.sendMessage(
        "অনুগ্রহ করে একজনকে ট্যাগ করুন 🤍",
        threadID,
        messageID
      );
    }

    const targetID = mentionIDs[0];
    const targetName = event.mentions[targetID];

    const imgPath = await makeImage({
      one: senderID,
      two: targetID
    });

    api.sendMessage(
      {
        body: `🤗 ${targetName} কে একটি হাগ পাঠানো হলো!`,
        mentions: [{ id: targetID, tag: targetName }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  } catch (e) {
    console.error(e);
    api.sendMessage(
      "দুঃখিত, হাগ পাঠানো যায়নি 🥲",
      threadID,
      messageID
    );
  }
};
