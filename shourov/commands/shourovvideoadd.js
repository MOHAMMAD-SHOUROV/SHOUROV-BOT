const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const VIDEO_DB = path.join(DATA_DIR, "autoVideos.json");
const STATUS_DB = path.join(DATA_DIR, "autoVideoStatus.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(VIDEO_DB)) fs.writeFileSync(VIDEO_DB, JSON.stringify({}));
if (!fs.existsSync(STATUS_DB)) fs.writeFileSync(STATUS_DB, JSON.stringify({ status: true }));

const ALLOWED_HOSTS = ["files.catbox.moe", "i.imgur.com"];
const ALLOWED_EXT = [".mp4", ".mov", ".webm"];

function isAdmin(uid) {
  return global.config.ADMINBOT?.includes(uid);
}

module.exports = {
  config: {
    name: "npx36",
    version: "3.0.0",
    permission: 0,
    prefix: false,
    credits: "shourov",
    description: "Admin add auto video | on/off | text+emoji trigger",
    category: "auto"
  },

  handleEvent: async function ({ api, event }) {
    try {
      if (!event.body) return;
      const body = event.body.trim();
      const lower = body.toLowerCase();
      const senderID = event.senderID;

      const videos = JSON.parse(fs.readFileSync(VIDEO_DB, "utf8"));
      const statusData = JSON.parse(fs.readFileSync(STATUS_DB, "utf8"));

      // =========================
      // 🔘 ON / OFF SYSTEM (ADMIN)
      // =========================
      if (lower === "video off" && isAdmin(senderID)) {
        fs.writeFileSync(STATUS_DB, JSON.stringify({ status: false }));
        return api.sendMessage("🔴 Auto video OFF করা হয়েছে", event.threadID);
      }

      if (lower === "video on" && isAdmin(senderID)) {
        fs.writeFileSync(STATUS_DB, JSON.stringify({ status: true }));
        return api.sendMessage("🟢 Auto video ON করা হয়েছে", event.threadID);
      }

      // =========================
      // ➕ ADD SYSTEM (ADMIN ONLY)
      // add hello😍 https://catbox...
      // =========================
      if (lower.startsWith("add ") && isAdmin(senderID)) {
        const parts = body.split(" ");
        if (parts.length < 3) {
          return api.sendMessage(
            "❌ Format:\nadd hello😍 https://files.catbox.moe/xxx.mp4",
            event.threadID
          );
        }

        const trigger = parts[1]; // text + emoji
        const videoURL = parts[2];

        try {
          const url = new URL(videoURL);

          if (!ALLOWED_HOSTS.includes(url.hostname))
            return api.sendMessage("❌ Only Catbox / Imgur allowed", event.threadID);

          if (!ALLOWED_EXT.some(ext => url.pathname.endsWith(ext)))
            return api.sendMessage("❌ Only mp4 / mov / webm allowed", event.threadID);

          if (!videos[trigger]) videos[trigger] = [];
          videos[trigger].push(videoURL);

          fs.writeFileSync(VIDEO_DB, JSON.stringify(videos, null, 2));

          return api.sendMessage(
            `✅ Added Successfully\nTrigger: ${trigger}\nTotal: ${videos[trigger].length}`,
            event.threadID
          );

        } catch {
          return api.sendMessage("❌ Invalid video link", event.threadID);
        }
      }

      // =========================
      // 🎯 AUTO VIDEO REPLY
      // =========================
      if (!statusData.status) return;

      for (const trigger in videos) {
        if (body.includes(trigger)) {
          const list = videos[trigger];
          if (!list.length) return;

          const video =
            list[Math.floor(Math.random() * list.length)];

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
      console.error("[npx36]", e);
    }
  },

  run: async function () {}
};
