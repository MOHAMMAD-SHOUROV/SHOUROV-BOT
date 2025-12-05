const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "kisss",
  version: "1.0.0",
  permission: 0,
  credits: "Md Shourov Islam",
  description: "Create a kissing image with tagged user",
  prefix: true,
  category: "kiss",
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
  const dirMaterial = path.resolve(__dirname, "cache");
  const imgPath = path.resolve(dirMaterial, "IMG-20250615-WA0013.jpg");

  if (!fs.existsSync(dirMaterial)) await fs.mkdirp(dirMaterial);

  if (!fs.existsSync(imgPath)) {
    try {
      const res = await axios.get("https://i.imgur.com/BtSlsSS.jpg", { responseType: "arraybuffer", timeout: 20000 });
      fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));
    } catch (err) {
      console.error("onLoad: failed to download base image:", err.message || err);
    }
  }
};

async function circle(imagePath) {
  const image = await jimp.read(imagePath);
  image.circle(); // jimp circle (makes circular mask)
  return await image.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache");
  const basePath = path.join(__root, "IMG-20250615-WA0013.jpg");
  const outPath = path.join(__root, `kiss_${one}_${two}.png`);
  const avatarOnePath = path.join(__root, `avt_${one}.png`);
  const avatarTwoPath = path.join(__root, `avt_${two}.png`);

  // ensure base exists
  if (!fs.existsSync(basePath)) throw new Error("Base image not found, onLoad may have failed.");

  // download avatars (binary)
  try {
    const res1 = await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarOnePath, Buffer.from(res1.data, "binary"));

    const res2 = await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarTwoPath, Buffer.from(res2.data, "binary"));
  } catch (err) {
    // cleanup partials
    if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
    if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);
    throw new Error("Failed downloading avatar(s): " + (err.message || err));
  }

  // create circular avatars and compose
  try {
    const hon_img = await jimp.read(basePath);

    const circleBuf1 = await circle(avatarOnePath);
    const circleBuf2 = await circle(avatarTwoPath);

    const circleOne = await jimp.read(circleBuf1);
    const circleTwo = await jimp.read(circleBuf2);

    // resize base and composite avatars (positions can be adjusted)
    hon_img.resize(700, 440)
      .composite(circleOne.resize(200, 200), 390, 23)
      .composite(circleTwo.resize(180, 180), 140, 80);

    const raw = await hon_img.getBufferAsync("image/png");
    fs.writeFileSync(outPath, raw);

    // cleanup avatar files
    if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
    if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);

    return outPath;
  } catch (err) {
    // cleanup and rethrow
    if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
    if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    throw err;
  }
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID, mentions } = event || {};
  if (!mentions || Object.keys(mentions).length === 0) {
    return api.sendMessage("⚠️ দয়া করে একটি ইউজারকে ট্যাগ করুন!", threadID, messageID);
  }

  const mentionId = Object.keys(mentions)[0];

  // Extract a readable tag/name safely
  let tagName = mentions[mentionId];
  if (typeof tagName === "object" && tagName !== null) {
    // sometimes mention value is object like { id: '...', name: 'Name' } depending on framework
    tagName = tagName.name || tagName.tag || String(mentionId);
  }
  if (typeof tagName !== "string") tagName = String(mentionId);

  try {
    await fs.ensureDir(path.join(__dirname, "cache"));
    const imagePath = await makeImage({ one: senderID, two: mentionId });

    await api.sendMessage({
      body: `💋 ${tagName} তোমার জন্য এক চুমু!`,
      mentions: [{ tag: tagName, id: mentionId }],
      attachment: fs.createReadStream(imagePath)
    }, threadID, () => {
      // cleanup generated image
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }, messageID);
  } catch (err) {
    console.error("kisss error:", err);
    return api.sendMessage("কিছু ত্রুটি ঘটেছে — আবার চেষ্টা করুন।", threadID, messageID);
  }
};