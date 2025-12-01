// commands/anicouple.js
module.exports.config = {
  name: "anicouple",
  version: "1.0.6",
  permission: 0,
  prefix: true,
  credits: "shourov (fixed)",
  description: "Send two anime (waifu) images as a couple photo",
  category: "image",
  usages: "anicouple",
  cooldowns: 2
};

module.exports.name = module.exports.config.name;

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.run = async function ({ api, event, args, Users }) {
  const threadID = event.threadID;
  const tmpDir = path.join(__dirname, "cache", "anicouple");
  await fs.ensureDir(tmpDir);

  // public/safe endpoints that return image urls
  const sources = [
    "https://api.waifu.pics/sfw/waifu",
    "https://api.waifu.pics/sfw/waifu"
  ];

  const downloaded = [];

  try {
    // download two images (may be same endpoint called twice)
    for (let i = 0; i < sources.length; i++) {
      try {
        const res = await axios.get(sources[i], { timeout: 15000 });
        // many such APIs return { url: "..." } or direct url - handle both
        const imageUrl = (res && res.data && (res.data.url || res.data.image)) ? (res.data.url || res.data.image) : (typeof res.data === "string" ? res.data : null);
        if (!imageUrl) throw new Error("No image URL in API response");

        const imgResp = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 20000 });
        // determine ext
        const extMatch = (imageUrl.match(/\.(jpg|jpeg|png|gif)(\?|$)/i) || [])[1] || "jpg";
        const outPath = path.join(tmpDir, `anicouple_${Date.now()}_${i}.${extMatch}`);
        await fs.writeFile(outPath, imgResp.data);
        downloaded.push(outPath);
      } catch (innerErr) {
        console.warn("Failed to download image #" + (i+1) + ":", innerErr && innerErr.message ? innerErr.message : innerErr);
      }
    }

    if (downloaded.length === 0) {
      return api.sendMessage("Sorry, couldn't fetch anime images right now. Try again later.", threadID);
    }

    // If only one image was fetched, still send it. If two, send both as attachments.
    const attachments = downloaded.map(p => fs.createReadStream(p));

    const body = (downloaded.length > 1) ? "Here is your anime couple 💞" : "Here is an anime picture 💞";
    await api.sendMessage({ body, attachment: attachments }, threadID);

  } catch (err) {
    console.error("anicouple error:", err && (err.stack || err));
    try { await api.sendMessage("An error occurred while creating the anime couple image.", threadID); } catch(e) {}
  } finally {
    // cleanup temp files
    try {
      for (const f of downloaded) {
        try { await fs.remove(f); } catch(_) {}
      }
      // optional: remove tmpDir if empty
      const rem = await fs.readdir(tmpDir).catch(()=>[]);
      if (Array.isArray(rem) && rem.length === 0) {
        try { await fs.remove(tmpDir); } catch(_) {}
      }
    } catch (e) {}
  }
};
