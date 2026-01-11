"use strict";

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "data");
const VIDEO_FILE = path.join(DATA_DIR, "autoVideos.json");
const STATUS_FILE = path.join(DATA_DIR, "autoVideoStatus.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_FILE)) fs.writeFileSync(VIDEO_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(STATUS_FILE)) fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: true }, null, 2));

/* ================= ADMIN CHECK ================= */
async function isAdmin(api, event) {
  const uid = String(event.senderID);

  if (global.config.ownerId === uid) return true;
  if (Array.isArray(global.config.admins) && global.config.admins.includes(uid)) return true;
  if (Array.isArray(global.config.operators) && global.config.operators.includes(uid)) return true;

  try {
    const info = await api.getThreadInfo(event.threadID);
    if (info.adminIDs.some(a => a.id === uid)) return true;
  } catch {}

  return false;
}

/* ================= HELPERS ================= */
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

function isValidVideo(url) {
  return /(catbox\.moe|i\.imgur\.com).*\.mp4$/i.test(url);
}

/* ================= MODULE ================= */
module.exports = {
  config: {
    name: "vdoadd",
    version: "2.0.0",
    permission: 0,
    prefix: true,
    credits: "shourov (fixed)",
    description: "Admin auto video system (add/on/off)",
    category: "auto",
    usages: "/vdoadd add trigger+link | /vdoadd on | /vdoadd off",
    cooldowns: 3
  },

  /* ========== AUTO VIDEO TRIGGER ========== */
  handleEvent: async function ({ api, event }) {
    try {
      if (!event.body) return;

      const status = loadStatus();
      if (!status.enabled) return;

      const videos = loadVideos();
      const text = event.body.toLowerCase();

      for (const key in videos) {
        const triggers = key.split(",").map(t => t.trim().toLowerCase());
        if (triggers.some(t => text.includes(t))) {
          const list = videos[key];
          if (!list || !list.length) return;

          const videoURL = list[Math.floor(Math.random() * list.length)];
          const stream = await axios.get(videoURL, { responseType: "stream", timeout: 30000 });

          return api.sendMessage(
            {
              body: "🖤 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
              attachment: stream.data
            },
            event.threadID,
            event.messageID
          );
        }
      }
    } catch (e) {
      console.error("[AUTO VIDEO]", e.message);
    }
  },

  /* ========== COMMAND PART ========== */
  run: async function ({ api, event, args }) {
    try {
      if (!(await isAdmin(api, event))) {
        return api.sendMessage("❌ Only admin can use this command.", event.threadID, event.messageID);
      }

      const sub = (args[0] || "").toLowerCase();

      /* ---------- ON ---------- */
      if (sub === "on") {
        saveStatus({ enabled: true });
        return api.sendMessage("✅ Auto video ON করা হয়েছে", event.threadID, event.messageID);
      }

      /* ---------- OFF ---------- */
      if (sub === "off") {
        saveStatus({ enabled: false });
        return api.sendMessage("❌ Auto video OFF করা হয়েছে", event.threadID, event.messageID);
      }

      /* ---------- ADD ---------- */
      if (sub === "add") {
        const input = args.slice(1).join(" ");
        if (!input.includes("+")) {
          return api.sendMessage(
            "❌ Format:\n/vdoadd add trigger1,trigger2+videoLink",
            event.threadID,
            event.messageID
          );
        }

        const [triggerPart, videoLink] = input.split("+");

        if (!isValidVideo(videoLink)) {
          return api.sendMessage(
            "❌ Only catbox / imgur mp4 supported",
            event.threadID,
            event.messageID
          );
        }

        const triggers = triggerPart.trim();
        const data = loadVideos();

        if (!data[triggers]) data[triggers] = [];
        data[triggers].push(videoLink);

        saveVideos(data);

        return api.sendMessage(
          `✅ Added successfully\n🔹 Trigger: ${triggers}\n🎥 Video saved`,
          event.threadID,
          event.messageID
        );
      }

      /* ---------- HELP ---------- */
      return api.sendMessage(
        "📌 Commands:\n" +
        "/vdoadd add 🙂,🥺,king+videoLink\n" +
        "/vdoadd on\n" +
        "/vdoadd off",
        event.threadID,
        event.messageID
      );

    } catch (e) {
      console.error("[vdoadd]", e);
      return api.sendMessage("❌ Error occurred", event.threadID, event.messageID);
    }
  }
};