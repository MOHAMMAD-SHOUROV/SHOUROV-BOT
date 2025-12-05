const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports.config = {
  name: "babu",
  version: "1.0.1",
  permission: 0,
  credits: "farhan (fixed)",
  description: "Random baby video",
  prefix: true,
  category: "Media",
  usages: "video",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async ({ api, event }) => {
  const videos = [
    "https://drive.google.com/uc?id=1ow-ovOSIJakvKK9MznNFE00hFXalVV49",
    "https://drive.google.com/uc?id=1p9bO4FUVY2MblvNBBloW9m127oQfhjEv",
    "https://drive.google.com/uc?id=1pTalyTBu6xEHUxYMAWq6ym7TOE7qe71-",
    "https://drive.google.com/uc?id=1pIJNNj5CIq29RVLdYsHc-s-anXSAMc_j",
    "https://drive.google.com/uc?id=1pWM16k9jlRrSa7-BPhI2SyIxN30V9Ji0",
    "https://drive.google.com/uc?id=1qMR0Aj9ImRqrlnETpO50iTqLFPnNsrJ4",
    "https://drive.google.com/uc?id=1q6u8MVJ2XvC9OIf5fOK-WqH7JNn5YHZ5",
    "https://drive.google.com/uc?id=1qCiT_GfxXxXOTb8vicJQIaS72Q_9Pxsb",
    "https://drive.google.com/uc?id=1qDrNXtrpbDrjkhl90-etaCsidGRM-eV-",
    "https://drive.google.com/uc?id=1ptCYaDb_DebvtcbG0yFivC_Vis_CfvjO",
    "https://drive.google.com/uc?id=1pC1Qqh30wIqo_XErnGtNbmquA3-HcR3M",
    "https://drive.google.com/uc?id=1pthPw6esQvMx_Kurbzk1KMhedryRYD40",
    "https://drive.google.com/uc?id=1qXK0VLfbVaes11tVCB8JxsEmelq90Dc7",
    "https://drive.google.com/uc?id=1qTBFIhjKiVysFIw7IL-o-enhz4QFuabl",
    "https://drive.google.com/uc?id=1pp7nTCuRlGEy4-CK3k4p4LPZkxA8xVWE",
    "https://drive.google.com/uc?id=1qIsNO4cSriiE_llkFCY6YGTqk-wEMsd0",
    "https://drive.google.com/uc?id=1ox5jQFrcFtlBkZQhnqEB8aDlAaxS2hGh",
  ];

  const quotes = [
    "-baby-𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓--"
  ];

  const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
  const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const cacheDir = path.join(__dirname, "cache");
  // unique temp filename to avoid collisions
  const tmpName = `babu_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const filePath = path.join(cacheDir, tmpName);

  try {
    // ensure cache dir exists
    await fs.ensureDir(cacheDir);

    // request video stream with timeout
    const res = await axios.get(selectedVideo, {
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      timeout: 30000
    });

    // save stream to temp file safely
    await streamPipeline(res.data, fs.createWriteStream(filePath));

    // send file and cleanup afterwards
    await new Promise((resolve, reject) => {
      api.sendMessage(
        {
          body: `「 ${selectedQuote} 」`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        (err) => {
          // attempt cleanup no matter success or failure
          fs.pathExists(filePath).then(exists => {
            if (exists) fs.unlink(filePath).catch(() => {});
          });
          if (err) return reject(err);
          resolve();
        }
      );
    });
  } catch (err) {
    console.error("babu command error:", err && (err.stack || err.message || err));
    // try to clean temp file if present
    try { if (await fs.pathExists(filePath)) await fs.unlink(filePath); } catch (e) {}
    return api.sendMessage("❌ ভিডিও লোড বা পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।", event.threadID);
  }
};