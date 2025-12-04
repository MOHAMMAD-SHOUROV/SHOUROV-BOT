// commands/caption.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "caption",
  version: "1.0.0",
  permission: 0,
  credits: "shourov (cleaned)",
  description: "Send random caption + image when user sends '/'",
  prefix: true,
  category: "user",
  usages: "/",
  cooldowns: 5
};

const CAPTIONS = [
  "❝ Life Is Beautiful If You Don’t Fall In Love ❞\n♡︎ _জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔",
  "❝ হঠাৎ করে দূরে সরে যাবো একদিন, তখন খুঁজে পাবে… ❞",
  "❝ হঠাৎ একদিন দেখা হবে °কিন্তু° কথা হবে না 🖤 ❞",
  "🌸 কোনো এক মায়াবতীর জন্য আজও ভিতরটা পুড়ে ︵😌🤍🪽",
  "❝ তুমি গল্প হলেও গল্প না, তুমি সত্যি হলেও কল্পনা ❞",
  "❝ ভাঙা মন আর ভাঙা বিশ্বাস কোনোদিন জোড়া লাগে না… ❞",
  "❝ সে বলেছিলো কোনোদিন সেরে যাবে না… তাহলে চলে গেছে কেন? ❞",
  "❝ আমি তোমাকে ভালোবাসতাম… কিন্তু তুমি তো বুঝোনি ❞",
  "❝ মানুষের মস্তিষ্কই হলো একটা কবরস্থান, যেখানে হাজারো স্বপ্নের মৃত্যু ঘটে.. 💔 ❞",
  "❝ জীবনটা তখনই সুন্দর ছিল, যখন ভাবতাম চাঁদটা আমার... ❞",
  "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… চেনা মানুষগুলো অচেনা হয়ে যায় রোজ ❞",
  "❝ যে যত বেশি চাও সে তত বেশি ইগনোর করবে… এটাই বাস্তব 🙂 ❞"
];

const IMAGES = [
  "https://i.imgur.com/vnVjD6L.jpeg",
  "https://i.imgur.com/xUNknmi.jpeg",
  "https://i.imgur.com/wzXgnwq.jpeg",
  "https://i.imgur.com/e1X4FL9.jpeg",
  "https://i.imgur.com/CPK9lur.jpeg",
  "https://i.imgur.com/3MrSsoV.jpeg",
  "https://i.imgur.com/5BtyeEH.jpeg",
  "https://i.imgur.com/aWntUvL.jpeg",
  "https://i.imgur.com/GggjGf9.jpeg",
  "https://i.imgur.com/JuA7M0t.jpeg",
  "https://i.imgur.com/XOeAkn1.jpeg",
  "https://i.imgur.com/Te7k6sV.jpeg",
  "https://i.imgur.com/TG3rIiJ.jpeg",
  "https://i.imgur.com/1w4Zec2.jpeg"
];

module.exports.run = async function({ api, event }) {
  try {
    // Only trigger when user sends exactly the prefix slash "/" (or change to your desired trigger)
    const text = (event.body || "").trim();
    const trigger = global.config && global.config.PREFIX ? String(global.config.PREFIX) : "/";
    // If you only want "/" specifically regardless of configured prefix, replace the condition with: if (text !== "/") return;
    if (text !== trigger && text !== "/") return;

    // pick random caption and image
    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
    const imageUrl = IMAGES[Math.floor(Math.random() * IMAGES.length)];

    // build message (styled + owner credit)
    const ownerLine = "\n\n⚜️ 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑: 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 ⚜️";
    const messageBody = `${caption}${ownerLine}`;

    // download image to cache then send
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `caption_${Date.now()}.jpg`);

    await new Promise((resolve, reject) => {
      request(encodeURI(imageUrl))
        .pipe(fs.createWriteStream(filePath))
        .on("close", resolve)
        .on("error", reject);
    });

    await api.sendMessage({
      body: messageBody,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      // cleanup
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }, event.messageID);

  } catch (err) {
    console.error("caption command error:", err && (err.stack || err));
    try { await api.sendMessage("⚠️ কিছু একটা ভুল হয়েছে, পরে আবার চেষ্টা করুন.", event.threadID, event.messageID); } catch (e) {}
  }
};