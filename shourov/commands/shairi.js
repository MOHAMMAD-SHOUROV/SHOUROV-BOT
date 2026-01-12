// commands/shairi.js
'use strict';

module.exports.config = {
  name: "shairi",
  version: "1.1.0",
  permission: 0,
  credits: "Shourov (fixed & optimized)",
  description: "Random shairi video",
  prefix: true,
  category: "Media",
  usages: "shairi",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const axios = (global.nodemodule && global.nodemodule.axios)
    ? global.nodemodule.axios
    : require("axios");

  const fs = (global.nodemodule && global.nodemodule["fs-extra"])
    ? global.nodemodule["fs-extra"]
    : require("fs-extra");

  const path = require("path");
  const { pipeline } = require("stream");
  const { promisify } = require("util");
  const streamPipeline = promisify(pipeline);

  // 📜 captions
  const captions = [
    "❝ তুমি গল্প হইও গল্প না, তুমি সত্যি হইও কল্পনা ❞",
    "❝ ভাঙা মন আর ভাঙা বিশ্বাস কোনোদিন জোড়া লাগে না… ❞",
    "❝ কোনো এক মায়াবতীর জন্য আজও ভিতরটা পোড়ে… 🤍🪽 ❞",
    "❝ জীবনটা তখনই সুন্দর ছিল, যখন ভাবতাম চাঁদটা আমার... ❞",
    "❝ তোমার অবহেলা আমাকে শিখিয়েছে—নিঃশব্দে চলে যাওয়া ❞",
    "🌸 কিছু কথা বুকের মধ্যে চিরকালের জন্য জমা থাকে…",
    "— 𝙺𝚒𝚗𝚐 𝚂𝚑𝚘𝚞𝚛𝚘𝚟 —"
  ];

  // 🎬 video links
  const links = [
    "https://drive.google.com/uc?id=1GtiVmOs2VMH1FuryKDb_p864NGrLP_iK",
    "https://drive.google.com/uc?id=1HWBJDDQdJPqpEc7VwJux1STI4aRAta1L",
    "https://drive.google.com/uc?id=1HeE-vnNZdfrA-CLR6tInVftZhdelNUGB",
    "https://drive.google.com/uc?id=1GqP65X_yWywBc5D0mfjTh9mUfQzmh8fb",
    "https://drive.google.com/uc?id=1GRSc0p6O1O03be1EKx1DYrIg1BLqRCxs"
  ];

  const caption = captions[Math.floor(Math.random() * captions.length)];
  const videoUrl = links[Math.floor(Math.random() * links.length)];

  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(
    cacheDir,
    `shairi_${Date.now()}.mp4`
  );

  try {
    await fs.ensureDir(cacheDir);

    const res = await axios.get(videoUrl, {
      responseType: "stream",
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    await streamPipeline(res.data, fs.createWriteStream(filePath));

    await api.sendMessage(
      {
        body: `「 ${caption} 」\n\n⚜️ BOT OWNER: SHOUROV ⚜️`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("❌ shairi error:", err?.message || err);
    api.sendMessage(
      "❌ ভিডিও পাঠাতে সমস্যা হয়েছে। কিছু Drive লিঙ্ক private বা dead হতে পারে।",
      event.threadID,
      event.messageID
    );
  } finally {
    // 🧹 cleanup
    try {
      if (await fs.pathExists(filePath)) await fs.unlink(filePath);
    } catch {}
  }
};