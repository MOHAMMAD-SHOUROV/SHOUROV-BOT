// commands/caption.js
/**
 * caption.js
 * - Responds when user sends: "/"  OR  "/caption"  OR  "/cap"  OR  "caption"
 * - Works with loaders that call run/start OR handleEvent
 * - Saves downloaded image to commands/cache and deletes after sending
 *
 * Usage: just send a message with "/" or "/caption" or "/cap" or "caption"
 */

const path = require("path");

module.exports.config = {
  name: "caption",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  description: "Send random caption + image",
  prefix: false, // does not require prefix to trigger on "/" message
  category: "user",
  usages: "/ or /caption or /cap or caption",
  cooldowns: 2
};

// try require from global.nodemodule if bot loader uses that
function tryRequire(name) {
  try {
    if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name];
  } catch (e) {}
  try { return require(name); } catch (e) { return null; }
}

const fs = tryRequire("fs-extra") || tryRequire("fs") || require("fs");
const request = tryRequire("request") || tryRequire("axios");
const CACHE_DIR = path.join(__dirname, "cache");

async function ensureCache() {
  try {
    if (fs && fs.ensureDirSync) fs.ensureDirSync(CACHE_DIR);
    else if (fs && fs.mkdirSync && !fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (e) { console.warn("[caption] ensure cache error:", e && e.message); }
}

const CAPTIONS = [
  "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
  "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
  "❝ ভাঙা মন আর ভাঙা বিশ্বাস কখনো জোড়া লাগে না ❞",
  "❝ সে বলেছিলো ছাড়বে না… তাহলে চলে গেলো কেন? ❞",
  "❝ মানুষের মস্তিষ্ক হলো কবর… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
  "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… ❞",
  "❝ হঠাৎ করে দূরে সরে যাবো একদিন, তখন খুঁজে পাব… ❞",
  "❝ হাসতে হাসতে একদিন সবাইকে কাঁদিয়ে বিদায় নিবো 🙂💔 ❞"
];

const IMAGES = [
  "https://i.imgur.com/vnVjD6L.jpeg",
  "https://i.imgur.com/TG3rIiJ.jpeg",
  "https://i.imgur.com/CPK9lur.jpeg",
  "https://i.imgur.com/GggjGf9.jpeg",
  "https://i.imgur.com/xUNknmi.jpeg",
  "https://i.imgur.com/wzXgnwq.jpeg",
  "https://i.imgur.com/3MrSsoV.jpeg",
  "https://i.imgur.com/5BtyeEH.jpeg",
  "https://i.imgur.com/JuA7M0t.jpeg"
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Unified handler used by run/start/handleEvent
async function handle({ api, event, Users }) {
  try {
    if (!event) return;
    const body = (event.body || "").trim();
    if (!body) return;

    // triggers (accept either exact or single slash)
    const triggers = ["/", "/caption", "/cap", "caption"];
    if (!triggers.includes(body.toLowerCase())) return;

    // ensure deps
    const hasFsExtra = tryRequire("fs-extra");
    const hasRequest = tryRequire("request");
    if (!hasFsExtra && !fs) {
      return api.sendMessage("❌ Missing fs-extra. Run: npm i fs-extra", event.threadID);
    }
    if (!hasRequest && typeof request === "function" && !tryRequire("request")) {
      return api.sendMessage("❌ Missing request library. Run: npm i request", event.threadID);
    }

    await ensureCache();
    const caption = pick(CAPTIONS);
    const imageUrl = pick(IMAGES);
    const fileName = `caption_${Date.now()}.jpg`;
    const filePath = path.join(CACHE_DIR, fileName);

    // download with request if available, otherwise with axios
    if (tryRequire("request")) {
      const req = tryRequire("request")(imageUrl);
      const ws = fs.createWriteStream(filePath);
      req.pipe(ws);
      ws.on("close", async () => {
        const ownerLine = global.config && global.config.OWNER ? `⚜ BOT OWNER: ${global.config.OWNER}` : "⚜ BOT OWNER: SHOUROV ⚜";
        const bodyMsg = `╔═══『 Random Caption 』═══╗\n\n${caption}\n\n${ownerLine}\n╚════════════════════╝`;
        try {
          await api.sendMessage({ body: bodyMsg, attachment: fs.createReadStream(filePath) }, event.threadID, (err) => {
            if (err) console.error("[caption] sendMessage error:", err && err.message);
            try { fs.unlinkSync(filePath); } catch (e) {}
          });
        } catch (e) {
          console.error("[caption] send error:", e && e.stack);
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      });
      ws.on("error", (e) => {
        console.error("[caption] writeStream error:", e && e.message);
      });
      req.on("error", (e) => {
        console.error("[caption] request error:", e && e.message);
      });
    } else {
      // fallback via axios (no stream) - write buffer
      const axios = tryRequire("axios") || require("axios");
      const resp = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(resp.data, "binary"));
      const ownerLine = global.config && global.config.OWNER ? `⚜ BOT OWNER: ${global.config.OWNER}` : "⚜ BOT OWNER: SHOUROV ⚜";
      const bodyMsg = `╔═══『 Random Caption 』═══╗\n\n${caption}\n\n${ownerLine}\n╚════════════════════╝`;
      await api.sendMessage({ body: bodyMsg, attachment: fs.createReadStream(filePath) }, event.threadID, (err) => {
        if (err) console.error("[caption] sendMessage error:", err && err.message);
        try { fs.unlinkSync(filePath); } catch (e) {}
      });
    }
  } catch (err) {
    console.error("[caption] handler error:", err && (err.stack || err));
  }
}

module.exports.handleEvent = async function ({ event, api, Users }) {
  // called by event-driven loaders
  return handle({ api, event, Users });
};

module.exports.run = async function ({ event, api, args, Users }) {
  // called by command-run loaders
  // if user typed command without args, treat as "/"
  if ((!args || args.length === 0) && (!event.body || event.body.trim() === "")) event.body = "/";
  else if (args && args.length) event.body = (args.join(" ") || event.body);
  return handle({ api, event, Users });
};

module.exports.start = module.exports.run;