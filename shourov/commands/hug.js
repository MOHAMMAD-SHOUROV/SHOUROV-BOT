module.exports.config = {
  name: "hug", // ✅ lowercase (important)
  version: "1.0.2",
  permission: 0,
  credits: " ALIHSAN SHOUROV",
  description: "Send hug image",
  prefix: true,
  category: "love",
  usages: "@mention",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

// ⚠️ onLoad optional – but we keep safe
module.exports.onLoad = async () => {
  try {
    const fs = global.nodemodule["fs-extra"];
    const path = global.nodemodule["path"];
    const { downloadFile } = global.utils;

    const dir = path.join(__dirname, "cache", "canvas");
    const imgPath = path.join(dir, "shourovh.png");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(imgPath)) {
      await downloadFile(
        "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
        imgPath
      );
    }
  } catch (e) {
    console.error("hug onLoad error:", e.message);
  }
};

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];
  const jimp = global.nodemodule["jimp"];

  const root = path.join(__dirname, "cache", "canvas");
  const basePath = path.join(root, "shourovh.png");
  const outPath = path.join(root, `hug_${Date.now()}.png`);
  const avt1 = path.join(root, `avt_${one}.png`);
  const avt2 = path.join(root, `avt_${two}.png`);

  // ✅ Facebook avatar WITHOUT token
  const url1 = `https://graph.facebook.com/${one}/picture?width=512&height=512`;
  const url2 = `https://graph.facebook.com/${two}/picture?width=512&height=512`;

  const r1 = await axios.get(url1, { responseType: "arraybuffer" });
  const r2 = await axios.get(url2, { responseType: "arraybuffer" });

  fs.writeFileSync(avt1, Buffer.from(r1.data));
  fs.writeFileSync(avt2, Buffer.from(r2.data));

  const base = await jimp.read(basePath);
  const img1 = await jimp.read(avt1);
  const img2 = await jimp.read(avt2);

  // ⚠️ NO circle() → GitHub safe
  base
    .composite(img1.resize(150, 150), 320, 100)
    .composite(img2.resize(130, 130), 280, 280);

  await base.writeAsync(outPath);

  fs.unlinkSync(avt1);
  fs.unlinkSync(avt2);

  return outPath;
}

module.exports.run = async function ({ event, api }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const { downloadFile } = global.utils;
  const { threadID, messageID, senderID } = event;

  try {
    const mentionIDs = Object.keys(event.mentions || {});
    if (mentionIDs.length === 0) {
      return api.sendMessage(
        "অনুগ্রহ করে একজনকে ট্যাগ করুন 🤍",
        threadID,
        messageID
      );
    }

    const targetID = mentionIDs[0];
    const targetName = event.mentions[targetID];

    // ✅ ensure base image (CI safe)
    const dir = path.join(__dirname, "cache", "canvas");
    const baseImg = path.join(dir, "shourovh.png");
    if (!fs.existsSync(baseImg)) {
      await fs.ensureDir(dir);
      await downloadFile(
        "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
        baseImg
      );
    }

    const imgPath = await makeImage({
      one: senderID,
      two: targetID
    });

    // ✅ IMPORTANT: return
    return api.sendMessage(
      {
        body: `🤗 ${targetName} কে একটি হাগ পাঠানো হলো!`,
        mentions: [{ id: targetID, tag: targetName }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (err) {
    console.error("HUG COMMAND ERROR:", err && (err.stack || err.message));
    return api.sendMessage(
      "দুঃখিত, হাগ পাঠানো যায়নি 🥲",
      threadID,
      messageID
    );
  }
};