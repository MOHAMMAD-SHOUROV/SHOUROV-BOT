/**
 * fingaring.js
 * Adapted for common bot loaders (uses global.nodemodule & global.utils.downloadFile)
 */

module.exports.config = {
  name: "fingaring",
  version: "1.0.1",
  permission: 2,
  credits: "Md Fahim Islam (adapted by Shourov)",
  description: "Create a fingaring-styled image with 2 avatars (tagged user)",
  prefix: true,
  category: "kiss",
  usages: "tag a user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

module.exports.onLoad = async () => {
  const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const down = (global.utils && typeof global.utils.downloadFile === "function") ? global.utils.downloadFile : null;

  const dirMaterial = __dirname + `/cache/canvas/`;
  const filePath = path.resolve(__dirname, "cache", "canvas", "fingeringv2.png");

  try {
    if (!fs.existsSync(dirMaterial)) fs.mkdirpSync(dirMaterial);
  } catch (e) {
    try { fs.ensureDirSync(dirMaterial); } catch (err) {/* ignore */ }
  }

  if (!fs.existsSync(filePath)) {
    const remote = "https://i.imgur.com/CQQZusa.jpeg";
    if (down) {
      try {
        await down(remote, filePath);
      } catch (err) {
        // fallback to axios if downloadFile fails
        try {
          const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
          const res = await axios.get(remote, { responseType: "arraybuffer", timeout: 20000 });
          fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));
        } catch (e) {
          console.error("fingaring onLoad: failed to fetch base image", e);
        }
      }
    } else {
      // no global.utils.downloadFile -> use axios
      try {
        const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
        const res = await axios.get(remote, { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));
      } catch (e) {
        console.error("fingaring onLoad: failed to download base image", e);
      }
    }
  }
};

async function circle(imagePath) {
  const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");
  const image = await jimp.read(imagePath);
  image.circle();
  return await image.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
  const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
  const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");

  const __root = path.resolve(__dirname, "cache", "canvas");
  const basePath = path.join(__root, "fingeringv2.png");
  if (!fs.existsSync(basePath)) throw new Error("Base image not found. onLoad may have failed.");

  const outPath = path.join(__root, `fingering_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  try {
    // download avatars from facebook graph
    const url1 = `https://graph.facebook.com/${one}/picture?width=512&height=512`;
    const url2 = `https://graph.facebook.com/${two}/picture?width=512&height=512`;

    const r1 = await axios.get(url1, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarOne, Buffer.from(r1.data, "binary"));

    const r2 = await axios.get(url2, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarTwo, Buffer.from(r2.data, "binary"));
  } catch (err) {
    // cleanup partial
    if (fs.existsSync(avatarOne)) try { fs.unlinkSync(avatarOne); } catch(e){}
    if (fs.existsSync(avatarTwo)) try { fs.unlinkSync(avatarTwo); } catch(e){}
    throw new Error("Failed downloading avatar(s): " + (err.message || err));
  }

  try {
    const baseImg = await jimp.read(basePath);
    const circ1 = await jimp.read(await circle(avatarOne));
    const circ2 = await jimp.read(await circle(avatarTwo));

    // composite positions (kept from original but can be adjusted)
    baseImg.composite(circ1.resize(70, 70), 180, 110).composite(circ2.resize(70, 70), 120, 140);

    const outBuf = await baseImg.getBufferAsync("image/png");
    fs.writeFileSync(outPath, outBuf);

    // cleanup avatars
    try { fs.unlinkSync(avatarOne); } catch (e) {}
    try { fs.unlinkSync(avatarTwo); } catch (e) {}

    return outPath;
  } catch (err) {
    // cleanup and rethrow
    if (fs.existsSync(avatarOne)) try { fs.unlinkSync(avatarOne); } catch(e){}
    if (fs.existsSync(avatarTwo)) try { fs.unlinkSync(avatarTwo); } catch(e){}
    if (fs.existsSync(outPath)) try { fs.unlinkSync(outPath); } catch(e){}
    throw err;
  }
}

module.exports.run = async function ({ event, api, args, Users }) {
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const { threadID, messageID, senderID, mentions } = event;

  // mention extraction (safer)
  const mentionIds = Object.keys(mentions || {});
  if (!mentionIds.length) {
    return api.sendMessage("⚠️ দয়া করে ১ জনকে ট্যাগ করুন।", threadID, messageID);
  }

  const targetId = mentionIds[0];

  // get readable tag/name for mention (best-effort)
  let tagName = null;
  try {
    if (Users && typeof Users.getNameUser === "function") {
      tagName = await Users.getNameUser(targetId);
    } else {
      // sometimes event.mentions[targetId] is the name string
      const rawMention = event.mentions && event.mentions[targetId];
      tagName = (typeof rawMention === "string") ? rawMention : (rawMention && rawMention.name) ? rawMention.name : `${targetId}`;
    }
  } catch (e) {
    tagName = `${targetId}`;
  }

  try {
    await fs.ensureDir(__dirname + "/cache/canvas");
    const out = await makeImage({ one: senderID, two: targetId });

    return api.sendMessage({
      body: `💋 ${tagName} তোমার জন্য!`,
      mentions: [{ tag: tagName, id: targetId }],
      attachment: fs.createReadStream(out)
    }, threadID, () => {
      try { fs.unlinkSync(out); } catch (e) {}
    }, messageID);
  } catch (err) {
    console.error("fingaring error:", err);
    return api.sendMessage("কিছু সমস্যা হয়েছে — পরে আবার চেষ্টা করুন।\n\n(Error: " + (err.message || err) + ")", threadID, messageID);
  }
};