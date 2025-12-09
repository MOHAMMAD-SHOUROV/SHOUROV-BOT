// commands/couple.js
module.exports.config = {
  name: "couple",
  version: "1.0.2",
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
  // prepare base canvas image in cache
  const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
  const dirMaterial = path.resolve(__dirname, "cache", "canvas");
  const filePath = path.join(dirMaterial, "seophi.png");
  try {
    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(filePath)) {
      // try using a stable image; timeout to avoid hanging
      const url = "https://i.imgur.com/hmKmmam.jpg";
      try {
        const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
        fs.writeFileSync(filePath, Buffer.from(resp.data, "binary"));
      } catch (e) {
        // if download fails, create a simple placeholder with jimp
        try {
          const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");
          const img = new jimp(1024, 712, "#ffffff");
          const txt = "Template";
          // try to write placeholder
          await img.getBufferAsync(jimp.MIME_PNG).then(buf => fs.writeFileSync(filePath, buf));
        } catch (er) {
          // last resort: don't crash
          console.warn("couple.onLoad: could not create base image", er && er.message);
        }
      }
    }
  } catch (err) {
    console.error("couple onLoad error:", err && (err.stack || err));
  }
};

async function circle(imagePathOrBuffer) {
  const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");
  const img = await jimp.read(imagePathOrBuffer);
  img.circle();
  return await img.getBufferAsync(jimp.MIME_PNG);
}

async function makeImage({ one, two, replyImagePath }) {
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
  const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
  const jimp = (global.nodemodule && global.nodemodule["jimp"]) ? global.nodemodule["jimp"] : require("jimp");

  const __root = path.resolve(__dirname, "cache", "canvas");
  const basePath = path.join(__root, "seophi.png");
  if (!fs.existsSync(basePath)) throw new Error("Base template not found (seophi.png).");

  const outPath = path.join(__root, `couple_${one}_${two || "img"}_${Date.now()}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two || 'reply'}.png`);

  try {
    // ensure cache dir
    if (!fs.existsSync(__root)) fs.mkdirSync(__root, { recursive: true });

    // download avatarOne (sender)
    try {
      const res1 = await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(avatarOne, Buffer.from(res1.data, "binary"));
    } catch (e) {
      // fallback: create simple coloured placeholder
      const img = new jimp(512, 512, "#777777");
      const buff = await img.getBufferAsync(jimp.MIME_PNG);
      fs.writeFileSync(avatarOne, buff);
    }

    // avatarTwo: if replyImagePath provided, copy it. Else fetch FB profile pic for 'two'
    if (replyImagePath) {
      try {
        fs.copyFileSync(replyImagePath, avatarTwo);
      } catch (err) {
        // fallback create placeholder
        const img = new jimp(512, 512, "#555555");
        const buff = await img.getBufferAsync(jimp.MIME_PNG);
        fs.writeFileSync(avatarTwo, buff);
      }
    } else {
      try {
        const res2 = await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512`, { responseType: "arraybuffer", timeout: 15000 });
        fs.writeFileSync(avatarTwo, Buffer.from(res2.data, "binary"));
      } catch (e) {
        const img = new jimp(512, 512, "#555555");
        const buff = await img.getBufferAsync(jimp.MIME_PNG);
        fs.writeFileSync(avatarTwo, buff);
      }
    }

    // create circles and composite
    const baseImg = await jimp.read(basePath);
    const circ1Buf = await circle(avatarOne);
    const circ2Buf = await circle(avatarTwo);

    const circ1 = await jimp.read(circ1Buf);
    const circ2 = await jimp.read(circ2Buf);

    baseImg.resize(1024, 712);
    // positions same as original script (adjust if needed)
    baseImg.composite(circ1.resize(200, 200), 527, 141);
    baseImg.composite(circ2.resize(200, 200), 389, 407);

    const raw = await baseImg.getBufferAsync(jimp.MIME_PNG);
    fs.writeFileSync(outPath, raw);

    // cleanup avatars
    try { if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne); } catch (e) {}
    try { if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo); } catch (e) {}

    return outPath;
  } catch (err) {
    // cleanup partials on error
    try { if (fs.existsSync(avatarOne)) fs.unlinkSync(avatarOne); } catch (e) {}
    try { if (fs.existsSync(avatarTwo)) fs.unlinkSync(avatarTwo); } catch (e) {}
    throw err;
  }
}

module.exports.run = async function ({ event, api, args }) {
  const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
  const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
  const request = (global.nodemodule && global.nodemodule["request"]) ? global.nodemodule["request"] : require("request");
  const { threadID, messageID, senderID } = event;

  try {
    // determine mention or reply-to-image
    let mentionId = null;
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      mentionId = Object.keys(event.mentions)[0];
    }

    // support reply-to-image (if user replied to a message containing an image attachment)
    let replyImagePath = null;
    if (!mentionId && event.type === "message_reply" && event.messageReply && Array.isArray(event.messageReply.attachments) && event.messageReply.attachments.length) {
      const attach = event.messageReply.attachments[0];
      // only accept obvious image urls or image mime
      if (attach.url && (/(\.jpe?g|\.png|\.gif|\.webp)$/i.test(attach.url) || (attach.mimeType && attach.mimeType.startsWith("image")))) {
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        replyImagePath = path.join(cacheDir, `reply_image_${Date.now()}.jpg`);
        await new Promise((resolve, reject) => {
          request.get(encodeURI(attach.url)).on("error", reject).pipe(fs.createWriteStream(replyImagePath)).on("close", resolve);
        }).catch(e => {
          try { if (fs.existsSync(replyImagePath)) fs.unlinkSync(replyImagePath); } catch (er) {}
          replyImagePath = null;
        });
      }
    }

    if (!mentionId && !replyImagePath) {
      return api.sendMessage("দয়া করে কাউকে ট্যাগ করুন অথবা কারো ছবিতে reply করে কমান্ড টা চালান।", threadID, messageID);
    }

    const one = senderID;
    const two = mentionId || senderID; // if using reply image, fb fetch for 'two' will be skipped

    const outPath = await makeImage({ one, two, replyImagePath });

    // mention text handling
    let mentions = [];
    let bodyText = "Ship ❤";
    if (mentionId && event.mentions && event.mentions[mentionId]) {
      let tagText = event.mentions[mentionId];
      if (typeof tagText === "object" && tagText !== null) tagText = tagText.name || tagText.tag || String(mentionId);
      mentions.push({ tag: tagText, id: mentionId });
      bodyText = `Ship ${tagText} ❤`;
    }

    await api.sendMessage({ body: bodyText, mentions, attachment: fs.createReadStream(outPath) }, threadID, () => {
      // cleanup
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch (e) {}
      try { if (replyImagePath && fs.existsSync(replyImagePath)) fs.unlinkSync(replyImagePath); } catch (e) {}
    }, messageID);

  } catch (err) {
    console.error("couple error:", err && (err.stack || err));
    try {
      await api.sendMessage("কোনো সমস্যা হয়েছে — আবার চেষ্টা করুন।\n\nError: " + (err.message || String(err)).slice(0, 200), threadID, messageID);
    } catch (e) {}
  }
};