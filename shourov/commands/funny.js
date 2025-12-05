// commands/funny.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports.config = {
  name: "funny",
  version: "1.0.1",
  permission: 0,
  credits: "farhan (fixed)",
  description: "Random funny video",
  prefix: true,
  category: "Media",
  usages: "funny",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async ({ api, event }) => {
  const links = [
    "https://drive.google.com/uc?id=1Zg6YCrfLNFVPuIarV3ZBvyg9NW9vKf-i",
    "https://drive.google.com/uc?id=1Tu7vjhlkUls3SKSTl-pGK3y69NYgeGMe",
    "https://drive.google.com/uc?id=1vHhwiHHDRJpflMGCU0Alg7A5ARkugLya",
    "https://drive.google.com/uc?id=1KrHanrUqkqr0kFjFh1abl72xlmZ0_18a",
    "https://drive.google.com/uc?id=1rs6cbx8oOYg2Zgi_0UZHfbDhEz8LjFlU",
    "https://drive.google.com/uc?id=1thJh4_fG8DYdgKiOhsy8Jkp98O0m-23b",
    "https://drive.google.com/uc?id=1T5x_hAEu5yozou0HeNrCHC6GS3XbgTSx",
    "https://drive.google.com/uc?id=1CRvedhuz9z2JWLY6LH2dNgtt7cwuBBsG",
    "https://drive.google.com/uc?id=1RbPFrHj4y7eno8OsAuYElOfdOsJ75eZp",
    "https://drive.google.com/uc?id=1mY0B0yGi90h0K1GvxVdZ7eLkj-Q-W2Eq",
    "https://drive.google.com/uc?id=1xgh5EePrQq62zeDRu2YAkJTrAXSCXpOp",
    "https://drive.google.com/uc?id=1-aZjX6vnC1HDn25jBoexmyLBlm6bLwli",
    "https://drive.google.com/uc?id=1znMcAJbcDnS0oDG6LCUH8PN0gZOJxhRC",
    "https://drive.google.com/uc?id=1teEOVYZwvGuz75_Is_ZEEvZwroB1IZW8",
    "https://drive.google.com/uc?id=10gQjKcAL8MkXOqi8vLYqPYiFg0_Qh-rR",
    "https://drive.google.com/uc?id=1b0xOpxhPq0xZO7QDpU4BZ-OnRKYPMdLD",
    "https://drive.google.com/uc?id=1-KLse2-7YKacnPGL7zHH5_KOHQUbVUt0",
  ];

  const quote = "--FUNNY-VIDEO-𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓--";
  const chosenLink = links[Math.floor(Math.random() * links.length)];

  const cacheDir = path.join(__dirname, "cache");
  const tmpName = `funny_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const filePath = path.join(cacheDir, tmpName);

  try {
    await fs.ensureDir(cacheDir);

    const res = await axios.get(chosenLink, {
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      timeout: 30000
    });

    // save to temp file (safe pipeline)
    await streamPipeline(res.data, fs.createWriteStream(filePath));

    // send and remove file after sending (best-effort cleanup)
    await new Promise((resolve, reject) => {
      api.sendMessage({
        body: `「 ${quote} 」`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err) => {
        // cleanup
        fs.pathExists(filePath).then(exists => {
          if (exists) fs.unlink(filePath).catch(() => {});
        });
        if (err) return reject(err);
        resolve();
      });
    });

  } catch (err) {
    console.error("funny command error:", err && (err.stack || err.message || err));
    // cleanup on error
    try { if (await fs.pathExists(filePath)) await fs.unlink(filePath); } catch(e) {}
    return api.sendMessage("❌ ভিডিও লোড বা পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।", event.threadID);
  }
};