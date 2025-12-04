// commands/slashcaption.js
/**
 * Maximum-compatible caption command
 * Responds to: "/", "/caption", "/cap", "caption" (with or without prefix)
 * Works with loaders that call handleEvent OR run/start.
 *
 * Requires: request (or built-in fallback), fs-extra
 */

const path = require("path");

module.exports.config = {
  name: "slashcaption",
  version: "1.0.3",
  permission: 0,
  credits: "Shourov",
  description: "Send random caption + image when user sends '/' or '/caption' or '/cap'",
  prefix: false,
  category: "user",
  usages: "/  or  /caption  or  /cap",
  cooldowns: 2
};

// Unified handler (for frameworks that pass a single object)
async function unifiedHandler(api, event, Users) {
  try {
    if (!event) return;
    const body = (event.body || "").trim();
    if (!body) return;

    // triggers: exact matches or single-character '/'
    const triggers = ["/", "/caption", "/cap", "caption"];
    if (!triggers.includes(body.toLowerCase())) return;

    await sendCaption({ api, event, Users });
  } catch (e) {
    console.error("[slashcaption.unifiedHandler] error:", e && (e.stack || e));
  }
}

// handleEvent signature used by many frameworks
module.exports.handleEvent = async function ({ event, api, Users }) {
  console.log("[slashcaption] handleEvent received for thread:", event && event.threadID);
  return unifiedHandler(api, event, Users).catch(err => console.error(err));
};

// run/start for command-based loaders
module.exports.run = async function ({ api, event, args, Users }) {
  console.log("[slashcaption] run called. args:", args);
  // allow calling like: /slashcaption or run with "/" or "caption"
  const body = (args || []).join(" ").trim();
  const fakeEvent = event;
  // if user typed nothing (i.e. just called command), treat as "/"
  if (!body) fakeEvent.body = "/";
  else fakeEvent.body = body;
  return unifiedHandler(api, fakeEvent, Users).catch(err => console.error(err));
};

module.exports.start = module.exports.run; // some loaders call start

// Actual send function
async function sendCaption({ api, event, Users }) {
  const fs = tryRequire("fs-extra");
  const request = tryRequire("request");
  if (!fs || !request) {
    console.error("[slashcaption] Missing dependencies: npm i fs-extra request");
    return api.sendMessage("❌ Bot missing dependencies (fs-extra or request). Ask admin to run: npm i fs-extra request", event.threadID);
  }

  const cacheDir = path.join(__dirname, "cache");
  try { fs.ensureDirSync(cacheDir); } catch (e) { console.warn("[slashcaption] ensureDir error:", e); }

  const captions = [
    "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
    "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
    "❝ ভাঙা মন আর ভাঙা বিশ্বাস কখনো জোড়া লাগে না ❞",
    "❝ সে বলেছিলো ছাড়বে না… তাহলে চলে গেলো কেন? ❞",
    "❝ মানুষের মস্তিষ্ক হলো কবর… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
    "❝ চাঁদটা আমার ভেবেছিলাম… ❞",
    "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… ❞",
    "❝ হঠাৎ করে দূরে সরে যাবো একদিন, তখন খুঁজে পাব… ❞",
    "❝ হাসতে হাসতে একদিন সবাইকে কাঁদিয়ে বিদায় নিবো 🙂💔 ❞"
  ];

  const images = [
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

  const caption = captions[Math.floor(Math.random() * captions.length)];
  const imgURL = images[Math.floor(Math.random() * images.length)];
  const filePath = path.join(cacheDir, `slash_${Date.now()}.jpg`);

  console.log(`[slashcaption] downloading ${imgURL}`);
  const writeStream = fs.createWriteStream(filePath);
  const r = request(imgURL);

  r.on("error", err => {
    console.error("[slashcaption] request error:", err);
  });

  r.pipe(writeStream)
    .on("error", err => {
      console.error("[slashcaption] writeStream error:", err);
    })
    .on("close", async () => {
      try {
        const ownerLine = "⚜ BOT OWNER: SHOUROV ⚜";
        const body = `╔═══『 Random Caption 』═══╗\n\n${caption}\n\n${ownerLine}\n╚════════════════════╝`;

        await api.sendMessage({
          body,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, (err) => {
          if (err) console.error("[slashcaption] sendMessage error:", err && (err.stack || err));
          try { fs.unlinkSync(filePath); } catch (e) { console.warn("[slashcaption] cleanup failed:", e && e.message); }
        });
      } catch (sendErr) {
        console.error("[slashcaption] send error:", sendErr && (sendErr.stack || sendErr));
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    });
}

// helper to require from global.nodemodule if provided (some frameworks use that)
function tryRequire(name) {
  try {
    if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name];
  } catch (e) {}
  try {
    return require(name);
  } catch (e) {
    return null;
  }
}