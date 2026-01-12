// commands/islam.js
"use strict";

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

module.exports.config = {
  name: "islamvideo",
  version: "1.1.0",
  permission: 0,
  credits: "Shourov (fixed)",
  description: "Random Islam video",
  prefix: true,
  category: "Media",
  usages: "islamvideo",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  const videos = [
    "https://drive.google.com/uc?id=1qkU11Pz0YM5YnkJUnqDj9l7o0Pk6LnO5",
    "https://drive.google.com/uc?id=1qspziP8dW7ksRvykkekZPZlFyLpGTeB5",
    "https://drive.google.com/uc?id=1Zl0IyIK_hWvtDip1UW4kHcg9EuAGQdmZ",
    "https://drive.google.com/uc?id=1qv8PRCjaTydXkILuZy5HUyI6wW4jtOW5",
    "https://drive.google.com/uc?id=1qwhnM75GeoKroHP2c1NOWcaUKlgIQUab",
    "https://drive.google.com/uc?id=1Zwg90Uest4IQViMiQB5bRYq5jJwitC6L",
    "https://drive.google.com/uc?id=1_PI6gtf-E0jrYv8n-k1s9YpsIC2AYxrk",
    "https://drive.google.com/uc?id=1qvT2dwO7dytupRRQcUdhDfHbqTFR21JI",
    "https://drive.google.com/uc?id=1ZhtkY8ZQI3cybm_GSv7aSTC--Mx3aB2p",
    "https://drive.google.com/uc?id=1qZGJGq5dOLDPDB1H8TqC0RBi4X9zCFER"
  ];

  const url = videos[Math.floor(Math.random() * videos.length)];

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const filePath = path.join(
    cacheDir,
    `islam_${Date.now()}_${Math.floor(Math.random() * 9999)}.mp4`
  );

  try {
    const res = await axios.get(encodeURI(url), {
      responseType: "stream",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    await streamPipeline(res.data, fs.createWriteStream(filePath));

    await api.sendMessage(
      {
        body: "🕌 ISLAM 🥀\n— 𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓",
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        // cleanup AFTER send
        fs.unlink(filePath).catch(() => {});
      },
      messageID
    );

  } catch (err) {
    console.error("[islam] error:", err.message || err);
    try { await fs.unlink(filePath); } catch {}
    return api.sendMessage(
      "❌ ইসলামিক ভিডিও লোড করা যায়নি। পরে আবার চেষ্টা করুন।",
      threadID,
      messageID
    );
  }
};