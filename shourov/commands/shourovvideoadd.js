const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "data");
const VIDEO_FILE = path.join(DATA_DIR, "autoVideos.json");
const STATUS_FILE = path.join(DATA_DIR, "autoVideoStatus.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_FILE)) fs.writeFileSync(VIDEO_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(STATUS_FILE)) fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: true }, null, 2));

const loadVideos = () => JSON.parse(fs.readFileSync(VIDEO_FILE, "utf8"));
const saveVideos = d => fs.writeFileSync(VIDEO_FILE, JSON.stringify(d, null, 2));
const loadStatus = () => JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
const saveStatus = d => fs.writeFileSync(STATUS_FILE, JSON.stringify(d, null, 2));

const isVideoLink = link =>
  link.startsWith("https://files.catbox.moe/") ||
  link.startsWith("https://i.imgur.com/");

module.exports = {
  config: {
    name: "ss",
    version: "1.1.0",
    permission: 0,
    credits: "shourov",
    prefix: true,
    description: "Auto video system",
    category: "auto",
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

          const video = list[Math.floor(Math.random() * list.length)];
          const res = await axios.get(video, { responseType: "stream", timeout: 30000 });

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
  run: async ({ api, event, args }) => {
    try {
      if (!global.config.ADMINBOT.includes(event.senderID)) {
        return api.sendMessage("❌ Only admin can use this", event.threadID);
      }

      if (!args.length) {
        return api.sendMessage(
          "📌 Usage:\n/ss add 🙂,sm+VIDEO\n/ss on\n/ss off",
          event.threadID
        );
      }

      // ON / OFF
      if (args[0] === "on") {
        saveStatus({ enabled: true });
        return api.sendMessage("✅ Auto video ON", event.threadID);
      }

      if (args[0] === "off") {
        saveStatus({ enabled: false });
        return api.sendMessage("❌ Auto video OFF", event.threadID);
      }

      // ADD
      if (args[0] === "add") {
        const joined = args.slice(1).join(" ").trim();

        if (!joined.includes("+")) {
          return api.sendMessage(
            "❌ Format:\n/ss add 🙂,sm+VIDEO_LINK",
            event.threadID
          );
        }

        const [keyPart, link] = joined.split("+").map(v => v.trim());

        if (!isVideoLink(link)) {
          return api.sendMessage(
            "❌ Only catbox / imgur video allowed",
            event.threadID
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
          `✅ Added successfully\n🔑 Trigger: ${keys.join(", ")}`,
          event.threadID
        );
      }
    } catch (e) {
      console.error("[ss run]", e);
      api.sendMessage("❌ Error occurred", event.threadID);
    }
  }
};