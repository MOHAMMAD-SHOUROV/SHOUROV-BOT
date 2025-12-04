// commands/slashcaption.js
module.exports.config = {
  name: "slashcaption",
  version: "1.0.1",
  permission: 0,
  credits: "Shourov",
  description: "Send caption when user types / or /caption",
  prefix: false,
  category: "user",
  usages: "/  or  /caption",
  cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    const body = (event.body || "").trim();

    // only react to "/" or to "/caption" or "/cap" (for testing)
    if (body !== "/" && body !== "/caption" && body !== "/cap") return;

    const fs = require("fs-extra");
    const request = require("request");
    const path = require("path");

    // ensure cache folder exists
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const captions = [
      "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
      "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
      "❝ ভাঙা মন আর ভাঙা বিশ্বাস কখনো জোড়া লাগে না ❞",
      "❝ সে বলেছিলো ছাড়বে না… তাহলে চলে গেলো কেন? ❞",
      "❝ মানুষের মস্তিষ্ক হলো কবর… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
      "❝ চাঁদটা আমার ভেবেছিলাম… ❞",
      "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… ❞"
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

    // download image
    const stream = request(imgURL).pipe(fs.createWriteStream(filePath));
    stream.on("close", async () => {
      try {
        const sendBody = `╔══ ✦•❁•✦ ══╗\n✨ RANDOM CAPTION ✨\n\n${caption}\n\n⚜ BOT OWNER: SHOUROV ⚜\n╚══ ✦•❁•✦ ══╝`;
        await api.sendMessage({
          body: sendBody,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          // cleanup
          try { fs.unlinkSync(filePath); } catch (e) { console.error("cleanup err:", e); }
        });
      } catch (errSend) {
        console.error("sendMessage error:", errSend);
        try { await api.sendMessage("Sorry, failed to send image (see logs).", event.threadID); } catch (_) {}
      }
    });

    stream.on("error", (err) => {
      console.error("download stream error:", err);
      try { api.sendMessage("Sorry, failed to download image (see logs).", event.threadID); } catch (_) {}
    });

  } catch (err) {
    console.error("handleEvent fatal error:", err);
    try { api.sendMessage("An unexpected error occurred (check bot logs).", event.threadID); } catch (_) {}
  }
};

// also export run so module loader won't complain if it calls .run
module.exports.run = async function() {};