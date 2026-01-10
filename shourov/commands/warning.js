// commands/warning.js
'use strict';

const path = require('path');

const axios = (global.nodemodule && global.nodemodule["axios"])
  ? global.nodemodule["axios"]
  : require('axios');

const fs = (global.nodemodule && global.nodemodule["fs-extra"])
  ? global.nodemodule["fs-extra"]
  : require('fs-extra');

const canvasModule = (global.nodemodule && global.nodemodule["canvas"])
  ? global.nodemodule["canvas"]
  : require('canvas');

const { createCanvas, loadImage } = canvasModule;

// ================= CONFIG =================
module.exports.config = {
  name: "warning",
  version: "1.3.0",
  permission: 0,
  credits: "fixed by shourov",
  prefix: true,
  description: "Auto warning system (admins ignored)",
  category: "system",
  cooldowns: 1
};

// ================= PATH =================
const CACHE_DIR = path.join(__dirname, 'cache_warning');
const AVT_PATH = path.join(CACHE_DIR, 'avt.png');
const WARN_PATH = path.join(CACHE_DIR, 'warn.png');

fs.ensureDirSync(CACHE_DIR);

// ================= GLOBAL DATA =================
if (!global.data) global.data = {};
if (!global.data.userWarnings) {
  global.data.userWarnings = new Map();
}

// ================= HELPERS =================
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^0-9a-z\u0980-\u09FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BAD_WORDS = [
  'বাল', 'বোকা', 'আবাল', 'সালা',
  'bal', 'sala', 'fuck', 'fuck you'
];

function detectBadWord(text) {
  const n = normalizeText(text);
  for (const w of BAD_WORDS) {
    const nw = normalizeText(w);
    const re = new RegExp(`\\b${nw}\\b`, 'i');
    if (re.test(n)) return w;
  }
  return null;
}

// 🔐 ADMIN CHECK
function isAdmin(senderID) {
  senderID = String(senderID);

  // config admins / operators
  const admins = global.config?.admins || [];
  const operators = global.config?.operators || [];
  const ownerId = global.config?.ownerId;

  if (admins.includes(senderID)) return true;
  if (operators.includes(senderID)) return true;
  if (ownerId && String(ownerId) === senderID) return true;

  return false;
}

// ================= RUN (unused) =================
module.exports.run = async function () {};

// ================= HANDLE EVENT =================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event || !event.body || !event.threadID) return;

    const senderID = String(event.senderID || '');
    const threadID = event.threadID;

    // 🚫 IGNORE ADMINS
    if (isAdmin(senderID)) return;

    const badWord = detectBadWord(event.body);
    if (!badWord) return;

    // ⏱ cooldown (1 day per user)
    const last = global.data.userWarnings.get(senderID) || 0;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    if (now - last < DAY) return;

    // 👤 get user name
    let userName = "Unknown User";
    try {
      const info = await api.getUserInfo([senderID]);
      if (info && info[senderID]?.name) {
        userName = info[senderID].name;
      }
    } catch {}

    // 🖼 avatar
    try {
      const url = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
      await fs.writeFile(AVT_PATH, Buffer.from(res.data));
    } catch {}

    // 🎨 canvas
    try {
      let avatar;
      if (await fs.pathExists(AVT_PATH)) {
        avatar = await loadImage(AVT_PATH);
      } else {
        avatar = createCanvas(512, 512);
      }

      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(avatar, 0, 0, 512, 512);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, 512, 512);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 48px Sans';
      ctx.fillText('⚠ WARNING ⚠', 256, 160);

      ctx.fillStyle = '#ffffff';
      ctx.font = '26px Sans';
      ctx.fillText(`Word: "${badWord}"`, 256, 260);

      ctx.font = '20px Sans';
      ctx.fillText(userName, 256, 330);

      await fs.writeFile(WARN_PATH, canvas.toBuffer());
    } catch {}

    // 📢 message
    const warnMsg =
      `⚠️ সতর্কবার্তা\n\n` +
      `ভদ্র ভাষা ব্যবহার করুন।\n\n` +
      `👤 নাম: ${userName}\n` +
      `🆔 ID: ${senderID}\n` +
      `❌ শব্দ: ${badWord}`;

    // 📤 send
    if (await fs.pathExists(WARN_PATH)) {
      await api.sendMessage(
        { body: warnMsg, attachment: fs.createReadStream(WARN_PATH) },
        threadID
      );
    } else {
      await api.sendMessage(warnMsg, threadID);
    }

    global.data.userWarnings.set(senderID, now);

    // 🧹 cleanup
    try {
      if (await fs.pathExists(AVT_PATH)) await fs.unlink(AVT_PATH);
      if (await fs.pathExists(WARN_PATH)) await fs.unlink(WARN_PATH);
    } catch {}

  } catch (err) {
    console.error('[warning] error:', err);
  }
};