// commands/spamban.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "warning",
  version: "1.1.1",
  permission: 0,
  credits: "(fixed by shourov)",
  prefix: true,
  description: "Automatically warns users when certain sensitive keywords are detected in the message.",
  category: "system",
  cooldowns: 1
};

const CACHE_DIR = path.join(__dirname, "cache");
const AVT_PATH = path.join(CACHE_DIR, "avt.png");
const WARN_PATH = path.join(CACHE_DIR, "warned_avt.png");

// ensure cache dir exists
fs.ensureDirSync(CACHE_DIR);

// initialize global map if missing
if (!global.data) global.data = {};
if (!global.data.userBanned || !(global.data.userBanned instanceof Map)) {
  global.data.userBanned = new Map();
}

module.exports.run = async ({ event, api }) => {
  // no-op for command invocation; this module reacts on messages via handleEvent
};

module.exports.handleEvent = async ({ event, api }) => {
  try {
    if (!event || !event.body) return;
    const raw = String(event.body || "");
    const message = raw.toLowerCase().trim();
    if (!message) return;

    const senderID = String(event.senderID || event.sender || "");
    const threadID = event.threadID;

    // check daily cooldown (1 day)
    const lastWarningTime = global.data.userBanned.get(senderID) || 0;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (now - lastWarningTime < ONE_DAY) {
      // already warned within day — do nothing (or optionally send a short notice)
      return;
    }

    // sensitive keywords (lowercase)
    const sensitiveKeywords = [
      "bal",
      "cudi",
      "sala abal",
      "sala",
      "fuck you",
      "xudi",
      "abal",
      " আবাল",
      // add more normalized keywords here
    ];

    // find match
    let matchedKeyword = null;
    for (const kw of sensitiveKeywords) {
      if (!kw) continue;
      if (message.includes(kw)) {
        matchedKeyword = kw;
        break;
      }
    }
    if (!matchedKeyword) return;

    // optional: show typing indicator if API supports it
    try {
      if (typeof api.sendTypingIndicator === "function") {
        api.sendTypingIndicator(threadID);
      }
    } catch (e) {
      // ignore if not supported
    }

    // fetch user info (best-effort)
    let userName = senderID;
    try {
      if (typeof api.getUserInfo === "function") {
        const info = await api.getUserInfo([senderID]);
        if (info && info[senderID] && info[senderID].name) userName = info[senderID].name;
      }
    } catch (e) {
      console.warn("getUserInfo failed:", e && e.message);
    }

    // download avatar (binary)
    try {
      const userAvatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(userAvatarUrl, { responseType: "arraybuffer", timeout: 10000 });
      fs.writeFileSync(AVT_PATH, Buffer.from(res.data)); // binary
    } catch (e) {
      console.warn("Failed to download avatar, continuing without avatar:", e && e.message);
    }

    // create warned image (if avatar exists)
    try {
      const imgExists = fs.existsSync(AVT_PATH);
      let img;
      if (imgExists) {
        img = await loadImage(AVT_PATH);
      } else {
        // create blank canvas if avatar not available
        const tmp = createCanvas(512, 512);
        const ctx = tmp.getContext("2d");
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, 512, 512);
        img = tmp;
      }

      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // draw avatar/background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // overlay semi-transparent dark layer for contrast
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // determine font size relative to image
      const baseSize = Math.floor(canvas.width / 8); // adjust as needed
      ctx.font = `bold ${baseSize}px Sans`;
      ctx.fillStyle = "rgba(255,80,80,1)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const warningText = "WARNING!";
      ctx.fillText(warningText, canvas.width / 2, canvas.height * 0.35);

      // smaller line for keyword
      ctx.font = `bold ${Math.floor(baseSize / 2.2)}px Sans`;
      ctx.fillStyle = "#fff";
      const kwText = `Keyword: "${matchedKeyword}"`;
      ctx.fillText(kwText, canvas.width / 2, canvas.height * 0.55);

      // footer with user name
      ctx.font = `${Math.floor(baseSize / 3.2)}px Sans`;
      ctx.fillStyle = "#ffdddd";
      ctx.fillText(`${userName} • ID: ${senderID}`, canvas.width / 2, canvas.height * 0.75);

      // save
      const out = fs.createWriteStream(WARN_PATH);
      const stream = canvas.createPNGStream();
      await new Promise((resolve, reject) => {
        stream.pipe(out);
        out.on("finish", resolve);
        out.on("error", reject);
      });
    } catch (e) {
      console.error("Failed to create warned image:", e && e.message);
    }

    // prepare warning message (Bangla)
    const warningMessage = `⚠️  সতর্কবার্তা!\n\nআপনি যে ভাষা ব্যবহার করেছেন তা গ্রহণযোগ্য নয়। দয়া করে ভদ্র ভাষা ব্যবহার করুন।\n\n⦿ নাম: ${userName}\n⦿ আইডি: ${senderID}\n⦿ শব্দ: ${matchedKeyword}`;

    // send message with attachment if exists
    try {
      if (fs.existsSync(WARN_PATH)) {
        await api.sendMessage({ body: warningMessage, attachment: fs.createReadStream(WARN_PATH) }, threadID);
      } else {
        await api.sendMessage(warningMessage, threadID);
      }
    } catch (e) {
      console.warn("Failed to send warning message:", e && e.message);
    }

    // set last warning time
    global.data.userBanned.set(senderID, Date.now());

    // cleanup temporary files (keep safe: check exists)
    try {
      if (fs.existsSync(AVT_PATH)) fs.unlinkSync(AVT_PATH);
      if (fs.existsSync(WARN_PATH)) fs.unlinkSync(WARN_PATH);
    } catch (e) {
      console.warn("Cleanup failed:", e && e.message);
    }
  } catch (err) {
    console.error("spamban handleEvent error:", err && (err.stack || err));
  }
};