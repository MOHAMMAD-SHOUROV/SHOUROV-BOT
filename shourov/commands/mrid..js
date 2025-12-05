const axios = require("axios");

module.exports.config = {
  name: "married",
  version: "1.0.0",
  permission: 2,
  credits: "Md Shourov Islam",
  description: "Create a married/couple image using two avatars",
  prefix: true,
  category: "married",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

module.exports.onLoad = async () => {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const { downloadFile } = global.utils || {};
  const dirMaterial = path.resolve(__dirname, "cache", "canvas");
  const dest = path.resolve(dirMaterial, "married.png");

  try {
    // ensure dir
    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

    // download base template if missing
    if (!fs.existsSync(dest)) {
      const url = "https://i.ibb.co/PjWvsBr/13bb9bb05e53ee24893940892b411ad2.png";
      if (typeof downloadFile === "function") {
        // use framework util if available (safer for large files)
        await downloadFile(url, dest);
      } else {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(dest, Buffer.from(res.data, "binary"));
      }
      console.log("[married] base image downloaded.");
    }
  } catch (err) {
    console.error("[married:onLoad] failed:", err.message || err);
  }
};

async function circle(imagePath) {
  const jimp = global.nodemodule["jimp"];
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];
  const jimp = global.nodemodule["jimp"];

  const __root = path.resolve(__dirname, "cache", "canvas");
  const basePath = path.join(__root, "married.png");
  const outPath = path.join(__root, `married_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  if (!fs.existsSync(basePath)) throw new Error("Base image (married.png) missing in cache/canvas. onLoad might have failed.");

  try {
    // download avatars as binary
    const avatarUrl1 = `https://graph.facebook.com/${one}/picture?width=512&height=512`;
    const avatarUrl2 = `https://graph.facebook.com/${two}/picture?width=512&height=512`;

    const [res1, res2] = await Promise.all([
      axios.get(avatarUrl1, { responseType: "arraybuffer", timeout: 15000 }),
      axios.get(avatarUrl2, { responseType: "arraybuffer", timeout: 15000 })
    ]);

    fs.writeFileSync(avatarOne, Buffer.from(res1.data, "binary"));
    fs.writeFileSync(avatarTwo, Buffer.from(res2.data, "binary"));

    // create circular avatars and composite
    const batgiam_img = await jimp.read(basePath);

    const circleBuf1 = await circle(avatarOne);
    const circleBuf2 = await circle(avatarTwo);

    const circleOne = await jimp.read(circleBuf1);
    const circleTwo = await jimp.read(circleBuf2);

    // composite positions & sizes — adjust if needed
    batgiam_img
      .composite(circleOne.resize(150, 150), 280, 45)
      .composite(circleTwo.resize(150, 150), 130, 90);

    const raw = await batgiam_img.getBufferAsync("image/png");
    fs.writeFileSync(outPath, raw);

    // cleanup avatars
    if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne);
    if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo);

    return outPath;
  } catch (err) {
    // cleanup partial files
    try { if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne); } catch (e) {}
    try { if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo); } catch (e) {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
    throw err;
  }
}

module.exports.run = async function ({ event, api }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;

  // event.mentions may be undefined or empty
  const mentions = event.mentions || {};
  const mentionKeys = Object.keys(mentions);
  if (!mentionKeys.length) {
    return api.sendMessage("⚠️ দয়া করে ১ জনকে মেনশন (tag) করুন।", threadID, messageID);
  }

  const targetId = mentionKeys[0];

  try {
    // ensure cache dir exists
    const dir = require("path").resolve(__dirname, "cache", "canvas");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const imgPath = await makeImage({ one: senderID, two: targetId });

    await api.sendMessage({
      body: "",
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => {
      // cleanup output file
      try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (e) {}
    }, messageID);
  } catch (err) {
    console.error("[married] error:", err);
    return api.sendMessage("কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
  }
};