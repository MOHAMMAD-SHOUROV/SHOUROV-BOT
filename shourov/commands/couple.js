// modules/commands/couple.js
module.exports.config = {
  name: "couple",
  version: "1.0.1",
  permission: 2,
  credits: "Md Shourov Islam (adapted)",
  description: "Create cute couple image with avatars (tag or reply-to-image supported)",
  prefix: true,
  category: "Love",
  usages: "tag / reply-to-image",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

module.exports.onLoad = async () => {
  const path = global.nodemodule["path"];
  const fs = global.nodemodule["fs-extra"];
  const { downloadFile } = global.utils || {};
  const dirMaterial = __dirname + `/cache/canvas/`;
  const filePath = path.resolve(__dirname, 'cache', 'canvas', 'seophi.png');

  try {
    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    // যদি কনফিগারেশনে downloadFile থাকে তাহলে লোডিং চেষ্টা করবো, না থাকলেও এখানে নীচের ইন-লাইন URL ব্যবহার করবো
    if (!fs.existsSync(filePath)) {
      if (typeof downloadFile === "function") {
        await downloadFile("https://i.imgur.com/hmKmmam.jpg", filePath);
      } else {
        // fallback: simple axios download
        const axios = global.nodemodule["axios"] || require("axios");
        const resp = await axios.get("https://i.imgur.com/hmKmmam.jpg", { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(filePath, Buffer.from(resp.data, "binary"));
      }
    }
  } catch (err) {
    console.error("couple onLoad error:", err && (err.stack || err));
  }
};

async function circle(imagePath) {
  const jimp = global.nodemodule["jimp"] || require("jimp");
  const img = await jimp.read(imagePath);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two, replyImagePath }) {
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const path = global.nodemodule["path"] || require("path");
  const axios = global.nodemodule["axios"] || require("axios");
  const jimp = global.nodemodule["jimp"] || require("jimp");

  const __root = path.resolve(__dirname, "cache", "canvas");
  const basePath = path.join(__root, "seophi.png");
  const outPath = path.join(__root, `couple_${one}_${two}_${Date.now()}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  // ensure base exists
  if (!fs.existsSync(basePath)) throw new Error("Base template not found (seophi.png).");

  try {
    // download avatar one (sender)
    const res1 = await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(avatarOne, Buffer.from(res1.data, "binary"));

    // avatar two: if replyImagePath is provided, use that file; otherwise fetch fb profile pic
    if (replyImagePath) {
      // copy the replied image into avatarTwo path
      fs.copyFileSync(replyImagePath, avatarTwo);
    } else {
      const res2 = await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(avatarTwo, Buffer.from(res2.data, "binary"));
    }

    // make circular avatars and composite
    const baseImg = await jimp.read(basePath);
    const circ1Buf = await circle(avatarOne);
    const circ2Buf = await circle(avatarTwo);

    const circ1 = await jimp.read(circ1Buf);
    const circ2 = await jimp.read(circ2Buf);

    // Resize base for consistent composition
    baseImg.resize(1024, 712)
      .composite(circ1.resize(200, 200), 527, 141)
      .composite(circ2.resize(200, 200), 389, 407);

    const raw = await baseImg.getBufferAsync("image/png");
    fs.writeFileSync(outPath, raw);

    // cleanup avatars
    if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne);
    if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo);

    return outPath;
  } catch (err) {
    // cleanup partials
    try { if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne); } catch (e) {}
    try { if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo); } catch (e) {}
    throw err;
  }
}

module.exports.run = async function ({ event, api, args }) {
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const path = global.nodemodule["path"] || require("path");
  const request = global.nodemodule["request"] || require("request");
  const { threadID, messageID, senderID } = event;

  try {
    // determine target: first check mentions, else if reply-to-image then use that image as second avatar
    let mentionId = null;
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      // take first mentioned id
      mentionId = Object.keys(event.mentions)[0];
    }

    // If user replied to a message that has an attachment (image), we can use that as the second avatar
    let replyImagePath = null;
    if (!mentionId && event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) {
      // only support image attachments
      const attach = event.messageReply.attachments[0];
      if (attach.url && (/(\.jpg|\.jpeg|\.png|\.gif)$/i.test(attach.url) || attach.mimeType && attach.mimeType.startsWith("image"))) {
        // download the replied image to cache
        const cacheDir = path.join(__dirname, "cache");
        try { fs.ensureDirSync(cacheDir); } catch (e) {}
        replyImagePath = path.join(cacheDir, `reply_image_${Date.now()}.jpg`);
        await new Promise((resolve, reject) => {
          request.get(encodeURI(attach.url)).on("error", reject).pipe(fs.createWriteStream(replyImagePath)).on("close", resolve);
        });
      }
    }

    if (!mentionId && !replyImagePath) {
      return api.sendMessage("দয়া করে কাউকে ট্যাগ করুন অথবা কারো ছবিতে reply করে কমান্ড টা চালান।", threadID, messageID);
    }

    const one = senderID;
    const two = mentionId || senderID; // if mentionId null but replyImagePath present, two won't be used for fb fetch

    // Generate image
    const outPath = await makeImage({ one, two, replyImagePath });

    // prepare mention text (if mentioned)
    let mentions = [];
    let bodyText = "Ship ❤";
    if (mentionId && event.mentions && event.mentions[mentionId]) {
      let tagText = event.mentions[mentionId];
      // sometimes mention value can be object; ensure tag string
      if (typeof tagText === "object" && tagText !== null) tagText = tagText.name || tagText.tag || String(mentionId);
      mentions.push({ tag: tagText, id: mentionId });
      bodyText = `Ship ${tagText} ❤`;
    }

    // send
    await api.sendMessage({ body: bodyText, mentions, attachment: fs.createReadStream(outPath) }, threadID, () => {
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
      try { if (replyImagePath && fs.existsSync(replyImagePath)) fs.unlinkSync(replyImagePath); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("couple error:", err && (err.stack || err));
    return api.sendMessage("কোনো সমস্যা হয়েছে — আবার চেষ্টা করুন।", threadID, messageID);
  }
};