const axios = require("axios");

module.exports.config = {
  name: "married1",
  version: "1.0.1",
  permission: 2,
  credits: "Md Shourov Islam",
  description: "Create married/couple image (v02 template)",
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
  const dest = path.resolve(dirMaterial, "marriedv02.png");
  const baseURL = "https://i.ibb.co/mc9KNm1/1619885987-21-pibig-info-p-anime-romantika-svadba-anime-krasivo-24.jpg";

  try {
    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

    if (!fs.existsSync(dest)) {
      if (typeof downloadFile === "function") {
        await downloadFile(baseURL, dest);
      } else {
        const res = await axios.get(baseURL, { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(dest, Buffer.from(res.data, "binary"));
      }
      console.log("[married1] base template downloaded.");
    }
  } catch (err) {
    console.error("[married1:onLoad] failed to ensure base image:", err.message || err);
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
  const basePath = path.join(__root, "marriedv02.png");
  const outPath = path.join(__root, `married_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  if (!fs.existsSync(basePath)) throw new Error("Base template missing (cache/canvas/marriedv02.png).");

  try {
    // download avatars as binary
    const url1 = `https://graph.facebook.com/${one}/picture?width=512&height=512`;
    const url2 = `https://graph.facebook.com/${two}/picture?width=512&height=512`;

    const [r1, r2] = await Promise.all([
      axios.get(url1, { responseType: "arraybuffer", timeout: 15000 }),
      axios.get(url2, { responseType: "arraybuffer", timeout: 15000 })
    ]);

    fs.writeFileSync(avatarOne, Buffer.from(r1.data, "binary"));
    fs.writeFileSync(avatarTwo, Buffer.from(r2.data, "binary"));

    const baseImg = await jimp.read(basePath);
    const circ1buf = await circle(avatarOne);
    const circ2buf = await circle(avatarTwo);

    const circ1 = await jimp.read(circ1buf);
    const circ2 = await jimp.read(circ2buf);

    // composite at positions/sizes (you already used 100x100 and coords 55,48 + 190,40)
    baseImg
      .composite(circ1.resize(100, 100), 55, 48)
      .composite(circ2.resize(100, 100), 190, 40);

    const raw = await baseImg.getBufferAsync("image/png");
    fs.writeFileSync(outPath, raw);

    // cleanup avatar files
    if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne);
    if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo);

    return outPath;
  } catch (err) {
    // cleanup partials on error
    try { if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne); } catch (e) {}
    try { if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo); } catch (e) {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
    throw err;
  }
}

module.exports.run = async function ({ event, api, args }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID } = event;

  // validate mentions
  const mentions = event.mentions || {};
  const mentionKeys = Object.keys(mentions);
  if (!mentionKeys.length) {
    return api.sendMessage("⚠️ Vui lòng tag 1 người (Please mention 1 person).", threadID, messageID);
  }

  const mention = mentionKeys[0];
  const tagText = (mentions[mention] && mentions[mention].replace) ? mentions[mention].replace("@", "") : "user";

  try {
    // ensure cache dir
    const dir = require("path").resolve(__dirname, "cache", "canvas");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const pathImg = await makeImage({ one: senderID, two: mention });

    await api.sendMessage({
      body: `kiss `,
      mentions: [{ tag: tagText, id: mention }],
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      try { if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg); } catch (e) {}
    }, messageID);
  } catch (err) {
    console.error("[married1] error:", err);
    return api.sendMessage("কিছু সমস্যা হয়েছে — আবার চেষ্টা করুন।", threadID, messageID);
  }
};