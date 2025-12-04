// commands/caption.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "caption",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Send random caption + image when user sends '/' or uses the command",
  prefix: true,
  category: "user",
  usages: "/  OR  /caption",
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

async function sendCaption(api, threadID, messageID) {
  try {
    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
    const imageUrl = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    const ownerLine = "\n\n⚜️ 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑: 𝐊𝐈𝐍𝐆 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 ⚜️";
    const messageBody = `${caption}${ownerLine}`;

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
    }, threadID, () => {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }, messageID);

  } catch (err) {
    console.error("caption send error:", err && (err.stack || err));
    try { await api.sendMessage("⚠️ কিছু একটা ভুল হয়েছে, পরে আবার চেষ্টা করুন.", threadID, messageID); } catch (e) {}
  }
}

/**
 * run: called when user invokes command like /caption (prefix+name)
 */
module.exports.run = async function({ api, event }) {
  // simply call sendCaption
  return sendCaption(api, event.threadID, event.messageID);
};

/**
 * handleEvent: listens to ALL messages — we use this to catch single "/" input.
 * This will respond when user sends exactly "/" (or the configured global prefix if you want).
 */
module.exports.handleEvent = async function({ event, api, Threads }) {
  try {
    const body = (event.body || "").trim();
    if (!body) return;

    // decide trigger(s): accept "/" OR global config prefix alone
    const globalPrefix = (global.config && global.config.PREFIX) ? String(global.config.PREFIX) : "/";
    const triggers = ["/", globalPrefix];

    // if prefix is multiple chars (e.g. "awto"), you may not want to trigger on that — keep "/" always
    if (!triggers.includes(body)) return;

    // Prevent reacting to bot's own messages
    if (String(event.senderID) === String(api.getCurrentUserID && api.getCurrentUserID())) return;

    // send caption
    await sendCaption(api, event.threadID, event.messageID);
  } catch (err) {
    console.error("caption handleEvent error:", err && (err.stack || err));
  }
};