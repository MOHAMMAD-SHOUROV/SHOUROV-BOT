module.exports.config = {
  name: "fuckv2",
  version: "3.1.1",
  permssion: 0,
  prefix: true,
  credits: "shourov",
  description: "Get fuck",
  category: "img",
  usages: "[@mention]",
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
    const { downloadFile } = global.utils || {};
    const dirMaterial = path.resolve(__dirname, "cache", "canvas");
    const basePath = path.resolve(dirMaterial, "fuckv3.png");

    fs.ensureDirSync(dirMaterial);

    if (!fs.existsSync(basePath)) {
      if (typeof downloadFile === "function") {
        await downloadFile("https://i.ibb.co/TW9Kbwr/images-2022-08-14-T183542-356.jpg", basePath);
      } else {
        // fallback to axios
        const axios = global.nodemodule["axios"];
        const resp = await axios.get("https://i.ibb.co/TW9Kbwr/images-2022-08-14-T183542-356.jpg", { responseType: "arraybuffer", timeout: 15000 });
        fs.writeFileSync(basePath, Buffer.from(resp.data, "binary"));
      }
    }
  } catch (e) {
    console.warn("fuckv2 onLoad warning:", e && (e.message || e));
  }
};

async function circle(imagePath) {
  const jimp = require("jimp");
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
  fs.ensureDirSync(__root);

  const baseFile = path.join(__root, "fuckv3.png");
  if (!fs.existsSync(baseFile)) throw new Error("Base image missing. Try restarting the bot or run onLoad again.");

  const outFile = path.join(__root, `fuckv3_${one}_${two}_${Date.now()}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  try {
    // download avatars (binary)
    const a1 = await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarOne, Buffer.from(a1.data, "binary"));

    const a2 = await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarTwo, Buffer.from(a2.data, "binary"));

    // prepare circular avatars
    const circ1Buf = await circle(avatarOne);
    const circ2Buf = await circle(avatarTwo);

    const baseImg = await jimp.read(baseFile);
    const circ1 = await jimp.read(circ1Buf);
    const circ2 = await jimp.read(circ2Buf);

    // adjust sizes/positions if you want different layout
    baseImg
      .composite(circ1.resize(100, 100), 20, 300)   // left small
      .composite(circ2.resize(150, 150), 100, 20);  // top bigger

    const raw = await baseImg.getBufferAsync("image/png");
    fs.writeFileSync(outFile, raw);

    // cleanup avatars
    if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne);
    if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo);

    return outFile;
  } catch (err) {
    // try cleanup on error
    try { if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne); } catch(e) {}
    try { if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo); } catch(e) {}
    try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch(e) {}
    throw err;
  }
}

module.exports.run = async function ({ event, api, args }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;
  try {
    // collect mention id (works with most loaders)
    const mentions = event.mentions && Object.keys(event.mentions).length ? Object.keys(event.mentions) : [];
    const target = mentions[0];

    if (!target) {
      return api.sendMessage("⚠️ দয়া করে অন্তত একজনকে ট্যাগ/মেনশন করুন।\nUsage: /fuckv2 @user", threadID, messageID);
    }

    // create image
    const outPath = await makeImage({ one: senderID, two: target });

    // try to include mention in text (name may not be available in some loaders)
    let mentionName = (event.mentions && event.mentions[target]) ? event.mentions[target] : (target);
    if (typeof mentionName === "object" && mentionName.name) mentionName = mentionName.name;

    await api.sendMessage({
      body: `🖼️ ${mentionName}`,
      mentions: [{ tag: mentionName, id: target }],
      attachment: fs.createReadStream(outPath)
    }, threadID, () => {
      // cleanup
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("fuckv2 error:", err && (err.stack || err));
    return api.sendMessage("❌ কিছু ভুল হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
  }
};