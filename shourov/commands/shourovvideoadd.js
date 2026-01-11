const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ================= PATH =================
const DATA_DIR = path.join(__dirname, "data");
const VIDEO_FILE = path.join(DATA_DIR, "autoVideos.json");
const STATUS_FILE = path.join(DATA_DIR, "autoVideoStatus.json");

// ================= INIT =================
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_FILE)) fs.writeFileSync(VIDEO_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(STATUS_FILE)) fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: true }, null, 2));

// ================= HELPERS =================
function loadVideos() {
  return JSON.parse(fs.readFileSync(VIDEO_FILE, "utf8"));
}

function saveVideos(data) {
  fs.writeFileSync(VIDEO_FILE, JSON.stringify(data, null, 2));
}

function loadStatus() {
  return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
}

function saveStatus(data) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

function isVideoLink(link) {
  return (
    link.startsWith("https://files.catbox.moe/") ||
    link.startsWith("https://i.imgur.com/")
  );
}

// ================= MODULE =================
module.exports = {
  config: {
    name: "ss",
    version: "1.0.0",
    permission: 0,
    credits: "shourov",
    prefix: true,
    description: "Auto video system (admin add / on-off)",
    category: "auto",
    usages: "/ss add | on | off",
    cooldowns: 2
  },

  // ================= AUTO EVENT =================
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
          if (!list || list.length === 0) return;

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
      console.error("[ss handleEvent]", e);
    }
  },

  // ================= COMMAND =================
  run: async ({ api, event }) => {
    try {
      const senderID = event.senderID;
      const threadID = event.threadID;

      // ===== ADMIN CHECK =====
      if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ Only admin can use this command", threadID);
      }

      // full text (newline support)
      const rawText = event.body.replace(/^\/ss/i, "").trim();
      if (!rawText) {
        return api.sendMessage(
          "📌 Usage:\n/ss add 🙂,🥺,sm+VIDEO\n/ss on\n/ss off",
          threadID
        );
      }

      // ===== ON =====
      if (rawText === "on") {
        saveStatus({ enabled: true });
        return api.sendMessage("✅ Auto video system ON", threadID);
      }

      // ===== OFF =====
      if (rawText === "off") {
        saveStatus({ enabled: false });
        return api.sendMessage("❌ Auto video system OFF", threadID);
      }

      // ===== ADD =====
      if (rawText.startsWith("add")) {
        const clean = rawText
          .replace(/^add/i, "")
          .replace(/\n/g, "")
          .trim();

        if (!clean.includes("+")) {
          return api.sendMessage(
            "❌ Format:\n/ss add 🙂,🥺,shourov+VIDEO_LINK",
            threadID
          );
        }

        const [keyPart, link] = clean.split("+").map(i => i.trim());

        if (!isVideoLink(link)) {
          return api.sendMessage(
            "❌ Only Imgur or Catbox video link allowed",
            threadID
          );
        }

        const keys = keyPart
          .split(",")
          .map(k => k.toLowerCase().trim())
          .filter(Boolean);

        const videos = loadVideos();

        for (const k of keys) {
          if (!videos[k]) videos[k] = [];
          if (!videos[k].includes(link)) videos[k].push(link);
        }

        saveVideos(videos);

        return api.sendMessage(
          `✅ Video added successfully\n🔑 Trigger: ${keys.join(", ")}`,
          threadID
        );
      }

    } catch (e) {
      console.error("[ss run]", e);
      api.sendMessage("❌ Error occurred", event.threadID);
    }
  }
};