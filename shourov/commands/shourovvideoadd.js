const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "data");
const VIDEO_DB = path.join(DATA_DIR, "autoVideos.json");
const STATUS_DB = path.join(DATA_DIR, "autoVideoStatus.json");

// ensure files
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_DB)) fs.writeFileSync(VIDEO_DB, "{}");
if (!fs.existsSync(STATUS_DB)) fs.writeFileSync(STATUS_DB, JSON.stringify({ enabled: true }, null, 2));

function isAdmin(uid) {
  return global.config.ADMINBOT?.includes(uid);
}

module.exports = {
  config: {
    name: "vdoadd",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    credits: "shourov",
    description: "Auto video system (admin add)",
    category: "auto"
  },

  // ================= ADD / ON / OFF =================
  run: async ({ api, event, args }) => {
    const uid = event.senderID;
    if (!isAdmin(uid)) {
      return api.sendMessage("❌ Only admin can use this command.", event.threadID, event.messageID);
    }

    const sub = args[0];

    // ON / OFF
    if (sub === "on" || sub === "off") {
      fs.writeFileSync(
        STATUS_DB,
        JSON.stringify({ enabled: sub === "on" }, null, 2)
      );
      return api.sendMessage(
        `✅ Video system ${sub.toUpperCase()}`,
        event.threadID,
        event.messageID
      );
    }

    // ADD
    const input = args.join(" ");
    if (!input || !input.includes("+")) {
      return api.sendMessage(
        "❌ Use:\n/vdoadd trigger+video_link",
        event.threadID,
        event.messageID
      );
    }

    const [triggerRaw, link] = input.split("+");
    const trigger = triggerRaw.trim();

    if (
      !link.startsWith("https://i.imgur.com/") &&
      !link.startsWith("https://files.catbox.moe/")
    ) {
      return api.sendMessage(
        "❌ Only Imgur or Catbox links allowed.",
        event.threadID,
        event.messageID
      );
    }

    const db = JSON.parse(fs.readFileSync(VIDEO_DB));
    if (!db[trigger]) db[trigger] = [];
    db[trigger].push(link);

    fs.writeFileSync(VIDEO_DB, JSON.stringify(db, null, 2));

    return api.sendMessage(
      `✅ Video added\n🔑 Trigger: ${trigger}`,
      event.threadID,
      event.messageID
    );
  },

  // ================= AUTO REPLY =================
  handleEvent: async ({ api, event }) => {
    try {
      if (!event.body) return;

      const status = JSON.parse(fs.readFileSync(STATUS_DB));
      if (!status.enabled) return;

      const text = event.body.trim().toLowerCase();
      const db = JSON.parse(fs.readFileSync(VIDEO_DB));

      for (const trigger in db) {
        if (text === trigger.toLowerCase()) {
          const videos = db[trigger];
          if (!videos.length) return;

          const video =
            videos[Math.floor(Math.random() * videos.length)];

          const res = await axios.get(video, {
            responseType: "stream",
            timeout: 30000
          });

          return api.sendMessage(
            {
              body: "🖤 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
              attachment: res.data
            },
            event.threadID,
            event.messageID
          );
        }
      }
    } catch (e) {
      console.error("[vdoadd]", e);
    }
  }
};