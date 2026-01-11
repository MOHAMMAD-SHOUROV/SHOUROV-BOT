const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "data");
const VIDEO_DB = path.join(DATA_DIR, "autoVideos.json");
const STATUS_DB = path.join(DATA_DIR, "autoVideoStatus.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_DB)) fs.writeFileSync(VIDEO_DB, JSON.stringify({}, null, 2));
if (!fs.existsSync(STATUS_DB)) fs.writeFileSync(STATUS_DB, JSON.stringify({ enabled: true }, null, 2));

function loadVideos() {
  return JSON.parse(fs.readFileSync(VIDEO_DB));
}
function saveVideos(data) {
  fs.writeFileSync(VIDEO_DB, JSON.stringify(data, null, 2));
}
function loadStatus() {
  return JSON.parse(fs.readFileSync(STATUS_DB));
}
function saveStatus(data) {
  fs.writeFileSync(STATUS_DB, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "ss",
    version: "3.0.0",
    permission: 0,
    prefix: true,
    credits: "shourov",
    description: "Auto emoji/text video system (admin only add)",
    category: "auto",
    usages: "/ss add | on | off",
    cooldowns: 2
  },

  // ================= AUTO VIDEO =================
  handleEvent: async ({ api, event }) => {
    try {
      if (!event.body) return;

      const status = loadStatus();
      if (!status.enabled) return;

      const text = event.body.toLowerCase();
      const videos = loadVideos();

      for (const key in videos) {
        if (text.includes(key)) {
          const list = videos[key];
          if (!list.length) return;

          const videoURL = list[Math.floor(Math.random() * list.length)];
          const res = await axios.get(videoURL, { responseType: "stream" });

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
      console.error("[ss auto]", e.message);
    }
  },

  // ================= COMMAND =================
  run: async ({ api, event, args }) => {
    try {
      const senderID = event.senderID;
      const threadID = event.threadID;

      // 🔐 admin check
      if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ Only admin can use this command", threadID);
      }

      const sub = args[0];

      // ===== ON / OFF =====
      if (sub === "on") {
        saveStatus({ enabled: true });
        return api.sendMessage("✅ Auto video ON", threadID);
      }

      if (sub === "off") {
        saveStatus({ enabled: false });
        return api.sendMessage("❌ Auto video OFF", threadID);
      }

      // ===== ADD =====
      if (sub === "add") {
        const raw = args.slice(1).join(" ");
        if (!raw.includes("+")) {
          return api.sendMessage(
            "❌ Format:\n/ss add 🙂,🥺,king+VIDEO_LINK",
            threadID
          );
        }

        const [keysPart, link] = raw.split("+").map(i => i.trim());

        if (!link.startsWith("http")) {
          return api.sendMessage("❌ Invalid video link", threadID);
        }

        const keys = keysPart.split(",").map(k => k.toLowerCase().trim());
        const videos = loadVideos();

        for (const k of keys) {
          if (!videos[k]) videos[k] = [];
          if (!videos[k].includes(link)) videos[k].push(link);
        }

        saveVideos(videos);

        return api.sendMessage(
          `✅ Added video\n🔑 Trigger: ${keys.join(", ")}`,
          threadID
        );
      }

      return api.sendMessage(
        "📌 Usage:\n/ss add 🙂,🥺,shourov+VIDEO\n/ss on\n/ss off",
        threadID
      );

    } catch (e) {
      console.error("[ss run]", e);
      api.sendMessage("❌ Error occurred", event.threadID);
    }
  }
};