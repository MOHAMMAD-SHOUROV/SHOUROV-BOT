// commands/attitude.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports.config = {
  name: "attitude",
  version: "1.0.1",
  permission: 0,
  credits: "SK-SIDDIK-KHAN (fixed by shourov)",
  description: "Attitude Short video",
  prefix: true,
  category: "media",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

// in-memory download locks to avoid concurrent downloads of same file
const downloadLocks = new Map();

module.exports.run = async ({ api, event, args, client, Users, Threads, __GLOBAL, Currencies }) => {
  const { threadID, messageID } = event;
  const quotes = [
    "--𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞 𝐕𝐢𝐝𝐞𝐨 𝐁𝐲 😇\n\n[» 𒄬 𓆩𝐊𝐈𝐍𝐆 𝐒𝐇𝐎𝐔𝐑𝐎𝐕⁽๏̬̬̬̬̽̽̈⁾𓆪』"
  ];
  const links = [
    "https://drive.google.com/uc?id=14tb-XgVWGcS63Jw0oNbm2hsqrQLw_gzL",
    "https://drive.google.com/uc?id=1520dma_yKw2ixGpb7wnktzrM20Kjo_3v",
    "https://drive.google.com/uc?id=1513P_XukMB6gPDf9lr20t8re3ScCL5Rw",
    "https://drive.google.com/uc?id=1-4yGIC7A0GKJHSUzaECF3d_bAWSp4Tl8",
    "https://drive.google.com/uc?id=1-xItCYLhq2oaR4tfiU8ap11CMDaJvMLq",
    "https://drive.google.com/uc?id=13qfO0aoXblNXXS-voJWj-8LqdYV4Gltu",
    "https://drive.google.com/uc?id=1-zgBe2_gCLh_Rl7DRBzKAG_CA914QbTQ",
    "https://drive.google.com/uc?id=10D9HinfwrtMjYo4fI7lWQYSStWrVllBQ",
    "https://drive.google.com/uc?id=107EjQ_uLg2Q5812NBux6QpAwx8ncS6JR",
    "https://drive.google.com/uc?id=14gr6fIUTYsF0nMOKtuOQqQmJ8Ggf71Tn",
    "https://drive.google.com/uc?id=14PgaietaupKI5jy89Y_VbENC_Zluy3D_",
    "https://drive.google.com/uc?id=13G9hyUkfx7oWWTbdD4AYQ6Vlk2f4EQ1Y",
    "https://drive.google.com/uc?id=13uE2XejtfWUJW6uzc83rXvcsPKoU3rek"
  ];

  // pick random quote & link
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const videoUrl = links[Math.floor(Math.random() * links.length)];

  // prepare cache paths
  const cacheDir = path.join(__dirname, "cache");
  const fileName = "attitude.mp4";
  const filePath = path.join(cacheDir, fileName);
  const tmpPath = filePath + ".download";

  try {
    // ensure cache folder exists
    await fs.ensureDir(cacheDir);

    // if file not exists, download (with lock)
    if (!(await fs.pathExists(filePath))) {
      // if another process is downloading, wait for it
      if (downloadLocks.has(filePath)) {
        await downloadLocks.get(filePath);
      } else {
        const downloadPromise = (async () => {
          // remove any stale tmp
          try { await fs.remove(tmpPath); } catch (e) { /* ignore */ }

          // axios stream download
          const res = await axios.get(videoUrl, {
            responseType: "stream",
            timeout: 30000,
            headers: { "User-Agent": "Mozilla/5.0" },
            maxContentLength: 1024 * 1024 * 500 // guard ~500MB
          });

          // write to tmp then move
          await streamPipeline(res.data, fs.createWriteStream(tmpPath));
          await fs.move(tmpPath, filePath, { overwrite: true });
        })();

        downloadLocks.set(filePath, downloadPromise);
        try {
          await downloadPromise;
        } finally {
          downloadLocks.delete(filePath);
        }
      }
    }

    // send from cache
    await api.sendMessage(
      {
        body: `「 ${quote} 」`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      (err) => {
        // attempt reaction, ignore failure
        try { api.setMessageReaction("😎", messageID, () => {}, true); } catch (e) {}
      }
    );

    // optional: remove file after send to save disk (uncomment if you want)
    // await fs.remove(filePath);

  } catch (err) {
    console.error("[attitude] error:", err && err.stack ? err.stack : err);
    try {
      await api.sendMessage("ভিডিও লোড করতে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।", threadID, messageID);
    } catch (e) { /* ignore */ }
  }
};