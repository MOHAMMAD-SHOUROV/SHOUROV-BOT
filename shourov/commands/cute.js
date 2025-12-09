// cute.js — SAFE VERSION (For your bot loader)

module.exports.config = {
  name: "cute",
  version: "1.0.1",
  permission: 0,
  credits: "Shourov (safe adaptation)",
  description: "Send a random cute (safe) image",
  prefix: true,
  category: "cute-pic",
  usages: "cute",
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ api, event }) => {
  const axios = global.nodemodule["axios"] || require("axios");
  const request = global.nodemodule["request"] || require("request");
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const path = require("path");

  const { threadID, messageID, senderID } = event;

  // SAFE IMAGE LINKS ONLY
  const safeLinks = [
    "https://picsum.photos/800/600",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504198266280-5b2d4b58b2a0?w=1200&q=80&auto=format&fit=crop"
  ];

  // ensure cache directory exists
  const cacheDir = path.join(__dirname, "cache");
  try { fs.ensureDirSync(cacheDir); } catch (e) {}

  const output = path.join(cacheDir, `cute_${Date.now()}.jpg`);
  const imageURL = safeLinks[Math.floor(Math.random() * safeLinks.length)];

  // TRY USING REQUEST FIRST
  const downloadImage = () =>
    new Promise((resolve, reject) => {
      try {
        request
          .get({ url: imageURL, encoding: null })
          .on("error", (err) => reject(err))
          .pipe(fs.createWriteStream(output))
          .on("finish", resolve)
          .on("error", reject);
      } catch (err) {
        reject(err);
      }
    });

  try {
    await downloadImage();

    return api.sendMessage(
      {
        body: `✨ Cute Image For You! ✨`,
        attachment: fs.createReadStream(output)
      },
      threadID,
      () => fs.unlinkSync(output),
      messageID
    );
  } catch (e) {
    // FALLBACK USING AXIOS
    try {
      const img = await axios.get(imageURL, { responseType: "arraybuffer" });
      fs.writeFileSync(output, Buffer.from(img.data));

      return api.sendMessage(
        {
          body: `✨ Cute Image (Fallback)`,
          attachment: fs.createReadStream(output)
        },
        threadID,
        () => fs.unlinkSync(output),
        messageID
      );
    } catch (err) {
      console.log(err);
      return api.sendMessage("⚠️ সমস্যা হয়েছে, আবার চেষ্টা করুন!", threadID, messageID);
    }
  }
};