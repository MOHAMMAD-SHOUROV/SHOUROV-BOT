// commands/kisss.js
const path = require("path");

// try to prefer global.nodemodule (if your loader uses that)
function tryRequire(name) {
  try { if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name]; } catch (e) {}
  try { return require(name); } catch (e) { return null; }
}

const axios = tryRequire("axios") || require("axios");
const fs = tryRequire("fs-extra") || tryRequire("fs") || require("fs");
const jimp = tryRequire("jimp") || require("jimp");

module.exports.config = {
  name: "hug",
  version: "1.0.1",
  permission: 0,
  credits: "Md Shourov Islam (adapted)",
  description: "Create a kissing image with tagged user",
  prefix: true,
  category: "hug",
  usages: "user (reply or mention)",
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
    const dirMaterial = path.resolve(__dirname, "cache");
    const imgPath = path.resolve(dirMaterial, "shourovh.jpg");

    if (!fs.existsSync(dirMaterial)) await fs.mkdirp(dirMaterial);

    // bse image url (you can change to your own)
    const baseUrl = "https://i.imgur.com/BtSlsSS.jpg";

    if (!fs.existsSync(imgPath)) {
      try {
        const res = await axios.get(baseUrl, { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));
        console.log("[hug] base image downloaded.");
      } catch (err) {
        console.warn("[hug] onLoad: failed to download base image:", err && err.message);
      }
    }
  } catch (e) {
    console.error("[kisss] onLoad unexpected error:", e && e.stack);
  }
};

async function makeCircleBuffer(imagePath) {
  const image = await jimp.read(imagePath);
  image.circle();
  return await image.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache");
  const basePath = path.join(__root, "shourovh.jpg");
  const outPath = path.join(__root, `kiss_${one}_${two}_${Date.now()}.png`);
  const avatarOnePath = path.join(__root, `avt_${one}.png`);
  const avatarTwoPath = path.join(__root, `avt_${two}.png`);

  if (!fs.existsSync(basePath)) throw new Error("Base image not found (onLoad may have failed).");

  // download avatars
  try {
    const [r1, r2] = await Promise.all([
      axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 }),
      axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 })
    ]);
    fs.writeFileSync(avatarOnePath, Buffer.from(r1.data, "binary"));
    fs.writeFileSync(avatarTwoPath, Buffer.from(r2.data, "binary"));
  } catch (err) {
    // cleanup partial
    try { if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath); } catch(e){}
    try { if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath); } catch(e){}
    throw new Error("Failed to download avatar(s): " + (err.message || err));
  }

  try {
    const baseImg = await jimp.read(basePath);
    const c1buf = await makeCircleBuffer(avatarOnePath);
    const c2buf = await makeCircleBuffer(avatarTwoPath);
    const c1 = await jimp.read(c1buf);
    const c2 = await jimp.read(c2buf);

    // you can tweak positions/sizes here to fit your base image
    baseImg.resize(700, jimp.AUTO)
      .composite(c1.resize(200, 200), 390, 23)  // sender
      .composite(c2.resize(180, 180), 140, 80); // mentioned

    await baseImg.writeAsync(outPath);

    // cleanup avatars
    try { if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath); } catch(e){}
    try { if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath); } catch(e){}

    return outPath;
  } catch (err) {
    // cleanup on error
    try { if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath); } catch(e){}
    try { if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath); } catch(e){}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch(e){}
    throw err;
  }
}

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, senderID } = event;
  try {
    // allow reply or mention
    let targetId = null;
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      targetId = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetId = Object.keys(event.mentions)[0];
    } else {
      return api.sendMessage("⚠️ দয়া করে একটি ইউজারকে ট্যাগ করুন বা তার মেসেজে রেপ্লাই করুন!", threadID, messageID);
    }

    // determine mention name (framework dependent)
    let mentionName = null;
    if (event.mentions && event.mentions[targetId]) {
      const v = event.mentions[targetId];
      // sometimes value is "Name" or object { id:..., name:... }
      mentionName = (typeof v === "object" && v !== null) ? (v.name || String(targetId)) : String(v);
    } else {
      mentionName = String(targetId);
    }

    await fs.ensureDir(path.join(__dirname, "cache"));
    const outImage = await makeImage({ one: senderID, two: targetId });

    await api.sendMessage({
      body: `🫂 ${mentionName} — `,
      mentions: [{ tag: mentionName, id: targetId }],
      attachment: fs.createReadStream(outImage)
    }, threadID, (err) => {
      // cleanup
      try { if (fs.existsSync(outImage)) fs.unlinkSync(outImage); } catch(e){}
      if (err) console.error("[kisss] sendMessage error:", err);
    }, messageID);

  } catch (err) {
    console.error("[kisss] error:", err && (err.stack || err));
    return api.sendMessage("কিছু ত্রুটি ঘটেছে — আবার চেষ্টা করুন।", threadID, messageID);
  }
};