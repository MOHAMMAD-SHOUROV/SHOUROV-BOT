// commands/shairi.js
/** I am doing this coding with a lot of difficulty, please don't post it yourself¯\_(ツ)_/¯ **/
module.exports.config = {
  name: "shairi",
  version: "1.0.1",
  permission: 0,
  credits: "(fixed by Shourov)",
  description: "Random shairi video",
  prefix: true,
  category: "Media",
  usages: "video",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async ({ api, event }) => {
  const axios = global.nodemodule && global.nodemodule["axios"] ? global.nodemodule["axios"] : require("axios");
  const fs = global.nodemodule && global.nodemodule["fs-extra"] ? global.nodemodule["fs-extra"] : require("fs-extra");
  const path = require("path");
  const { pipeline } = require("stream");
  const { promisify } = require("util");
  const streamPipeline = promisify(pipeline);

  // captions (আপনি চাইলে আরো যোগ করতে পারেন)
  const captions = [
    "--SHAIRI-VIDEO---",
    "❝ তুমি গল্প হইও গল্প না, তুমি সত্যি হইও কল্পনা ❞",
    "❝ ভাঙা মন আর ভাঙা বিশ্বাস কোনোদিন জোড়া লাগে না… ❞",
    "❝ হঠাৎ করে দূরে সরে যাবো একদিন, তখন খুঁজে পাবে… ❞",
    "❝ কোনো এক মায়াবতীর জন্য আজও ভিতরটা পোড়ে… 🤍🪽 ❞",
    "❝ সে বলেছিলো কোনোদিন সেরে যাবে না… তাহলে চলে গেছে কেন? ❞",
    "🌸 কিছু কথা বুকের মধ্যে চিরকালের জন্য জমা থেকে যায়…",
    "❝ তোমার অবহেলা আমাকে শিখিয়েছে—নিঃশব্দে চলে যাওয়া শিখেছি। ❞",
    "❝ জীবনটা তখনই সুন্দর ছিল, যখন ভাবতাম চাঁদটা আমার... ❞",
    "— 𝙺𝚒𝚗𝚐_𝚂𝚑𝚘𝚞𝚛𝚘𝚟 —"
  ];

  // media links (আপনি যে লিস্টটা দিলেন সেটাই রেখে দিলাম)
  const links = [
    "https://drive.google.com/uc?id=1GtiVmOs2VMH1FuryKDb_p864NGrLP_iK",
    "https://drive.google.com/uc?id=1HWBJDDQdJPqpEc7VwJux1STI4aRAta1L",
    "https://drive.google.com/uc?id=1HeE-vnNZdfrA-CLR6tInVftZhdelNUGB",
    "https://drive.google.com/uc?id=1GqP65X_yWywBc5D0mfjTh9mUfQzmh8fb",
    "https://drive.google.com/uc?id=1GRSc0p6O1O03be1EKx1DYrIg1BLqRCxs",
    "https://drive.google.com/uc?id=1GYJRHvr7MQuNv9edlg153ZzAJnvFQU_y",
    "https://drive.google.com/uc?id=114bQWGar2c_qAQ8xLcqwuxjr3YJxD7GR",
    "https://drive.google.com/uc?id=11B_AoQejKb11TRBugmySc3k25U5qkY5z",
    "https://drive.google.com/uc?id=10x0iIUbpV12DRMnC-anCf29PNcwuGZIU",
    "https://drive.google.com/uc?id=11DrJUgGla-bP6yg0G1hnQbA5Kj0EFlI5",
    "https://drive.google.com/uc?id=1sX1cBCQv4qppFdeORJpt1Tjf9qW7vfL5",
    "https://drive.google.com/uc?id=1sGyqYbRQD8dCOJugEV7eyPqJUTRO8LYH",
    "https://drive.google.com/uc?id=1sEye37kl21741pRAjoLxKJh4uctn3IGT",
    "https://drive.google.com/uc?id=1sRb7zhf68GfkdUEmOBr3qDoXxn9ThT6T",
    "https://drive.google.com/uc?id=1sSeQumcIINAS1RQzngs8IqmXikORSmRU",
    "https://drive.google.com/uc?id=1sMQwfiNWRqSKkh2FeMBc4kslOKhARgOe",
    "https://drive.google.com/uc?id=1sbI30bNjdgUOljU1BZRz5zSEqgjitkVZ",
    "https://drive.google.com/uc?id=1sQwXPnF3RXk_PVSIu1WJi4pSqGkkuqup",
    "https://drive.google.com/uc?id=1sAjzw4me9PdY12I74zyxQhqEjSX_uaYl",
    "https://drive.google.com/uc?id=1sHehVkqa5weubDxUhgmcpxXK0XYJC7li",
    "https://drive.google.com/uc?id=1sU-zi4PuvwiEiT8akTR6qRArM8Lpp-cM",
    "https://drive.google.com/uc?id=1sZkJajZxbAq5k0vp-Og0N-jt7XuJRec8",
    "https://drive.google.com/uc?id=1sIb8Djq4pdAwLi0YCqbmzHMpAip9DScA",
    "https://drive.google.com/uc?id=1s9OpuKFfkZHhDjka-On1-PtlsOupDeWp"
  ];

  // choose random caption + media
  const caption = captions[Math.floor(Math.random() * captions.length)];
  const chosenLink = links[Math.floor(Math.random() * links.length)];

  // prepare file path
  const cacheDir = path.join(__dirname, "cache");
  const tmpName = `shairi_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const filePath = path.join(cacheDir, tmpName);

  try {
    await fs.ensureDir(cacheDir);

    // request stream with timeout
    const res = await axios.get(encodeURI(chosenLink), {
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      timeout: 30000
    });

    // save to file (stream pipeline)
    await streamPipeline(res.data, fs.createWriteStream(filePath));

    // send the file with caption
    await new Promise((resolve, reject) => {
      api.sendMessage({
        body: `「 ${caption} 」\n\n⚜️ BOT OWNER: 𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓 ⚜️`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err) => {
        // cleanup file (best effort)
        fs.pathExists(filePath).then(exists => {
          if (exists) fs.unlink(filePath).catch(() => {});
        });
        if (err) return reject(err);
        resolve();
      }, event.messageID);
    });

  } catch (err) {
    console.error("shairi command error:", err && (err.stack || err.message || err));
    // try cleanup
    try { if (await fs.pathExists(filePath)) await fs.unlink(filePath); } catch (e) {}
    // friendly error to user
    return api.sendMessage("❌ ভিডিও লোড বা পাঠাতে সমস্যা হয়েছে। Google Drive লিঙ্কগুলো private বা dead হলে কাজ করবে না।", event.threadID, event.messageID);
  }
};