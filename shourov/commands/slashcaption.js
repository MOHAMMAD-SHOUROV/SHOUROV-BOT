// commands/slashcaption.js
/**
 * Slash Caption command
 * Reacts to message bodies: "/"  OR  "/caption"  OR  "/cap"
 * Put this file into your commands folder and restart the bot.
 *
 * Compatible patterns:
 * - Frameworks that call module.handleEvent on every message
 * - Frameworks that call module.run when command is triggered
 */

module.exports.config = {
  name: "slashcaption",
  version: "1.0.2",
  permission: 0,
  credits: "Shourov",
  description: "Send random caption + image when user sends '/' or '/caption' or '/cap'",
  prefix: false, // we use handleEvent so no loader prefix required
  category: "user",
  usages: "/  or  /caption  or  /cap",
  cooldowns: 2
};

// use both handleEvent and run for compatibility
module.exports.handleEvent = async function ({ event, api, Users }) {
  try {
    const body = (event.body || "").trim();
    if (!body) return;

    // exact matches we want to respond to
    const triggers = ["/", "/caption", "/cap"];
    if (!triggers.includes(body)) return;

    // proceed to send caption
    await sendCaption({ api, event, Users });
  } catch (err) {
    console.error("[slashcaption.handleEvent] fatal:", err && (err.stack || err));
  }
};

// also export run for frameworks that call run/start directly
module.exports.run = async function ({ api, event, args, Users }) {
  try {
    // if called as command, accept empty args or "caption"
    const body = (args || []).join(" ").trim();
    if (body && body !== "/" && body.toLowerCase() !== "caption" && body.toLowerCase() !== "cap") {
      return api.sendMessage("Usage: send /  OR  /caption  OR  /cap", event.threadID);
    }
    await sendCaption({ api, event, Users });
  } catch (err) {
    console.error("[slashcaption.run] fatal:", err && (err.stack || err));
  }
};

// helper function
async function sendCaption({ api, event, Users }) {
  const fs = global.nodemodule && global.nodemodule["fs-extra"] ? global.nodemodule["fs-extra"] : require("fs-extra");
  const request = global.nodemodule && global.nodemodule["request"] ? global.nodemodule["request"] : require("request");
  const path = require("path");

  // ensure cache dir
  const cacheDir = path.join(__dirname, "cache");
  try { fs.ensureDirSync(cacheDir); } catch (e) { console.error("[slashcaption] ensureDir error:", e); }

  // CAPTIONS - add / edit as you like
  const captions = [
    "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
    "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
    "❝ ভাঙা মন আর ভাঙা বিশ্বাস কখনো জোড়া লাগে না ❞",
    "❝ সে বলেছিলো ছাড়বে না… তাহলে চলে গেলো কেন? ❞",
    "❝ মানুষের মস্তিষ্ক হলো কবর… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
    "❝ চাঁদটা আমার ভেবেছিলাম… ❞",
    "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… ❞",
    "❝ হঠাৎ করে দূরে সরে যাবো একদিন, তখন খুঁজে পাবে… ❞",
    "❝ হাসতে হাসতে একদিন সবাইকে কাঁদিয়ে বিদায় নিবো 🙂💔 ❞"
  ];

  // IMAGES - ensure these links are reachable; you can replace/add Imgur URLs or static images
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

  // pick random
  const caption = captions[Math.floor(Math.random() * captions.length)];
  const imgURL = images[Math.floor(Math.random() * images.length)];

  const filePath = path.join(cacheDir, `slash_${Date.now()}.jpg`);
  console.log(`[slashcaption] downloading image -> ${imgURL} to ${filePath}`);

  // download
  const stream = request(imgURL).pipe(fs.createWriteStream(filePath));
  stream.on("error", (err) => {
    console.error("[slashcaption] download stream error:", err && (err.stack || err));
    try { api.sendMessage("❌ Failed to download image. Check bot logs.", event.threadID); } catch (_) {}
  });

  stream.on("close", async () => {
    try {
      // get sender name for mention (best-effort)
      let senderName = event.senderID;
      try { if (Users && typeof Users.getNameUser === "function") senderName = await Users.getNameUser(event.senderID); } catch (e) {}

      const sendBody = [
        "╔══ ✦•❁•✦ ══╗",
        "✨ RANDOM CAPTION ✨",
        "",
        caption,
        "",
        `⚜ BOT OWNER: SHOUROV ⚜`,
        "╚══ ✦•❁•✦ ══╝"
      ].join("\n");

      console.log("[slashcaption] sending message to thread:", event.threadID);
      await api.sendMessage({
        body: sendBody,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, (err) => {
        if (err) console.error("[slashcaption] sendMessage error:", err && (err.stack || err));
        // cleanup
        try { fs.unlinkSync(filePath); } catch (e) { console.error("[slashcaption] cleanup error:", e); }
      });
    } catch (errSend) {
      console.error("[slashcaption] send block error:", errSend && (errSend.stack || errSend));
      try { await api.sendMessage("❌ Failed to send caption. Check bot logs.", event.threadID); } catch (_) {}
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  });
}