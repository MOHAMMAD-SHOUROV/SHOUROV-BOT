// commands/warning.js
'use strict';

const path = require('path');

// use global.nodemodule if available (hosted env), otherwise require normally
const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require('axios');
const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require('fs-extra');
const canvasModule = (global.nodemodule && global.nodemodule["canvas"]) ? global.nodemodule["canvas"] : require('canvas');
const { createCanvas, loadImage } = canvasModule;

module.exports.config = {
  name: "warning",
  version: "1.2.0",
  permission: 0,
  credits: "(fixed by shourov)",
  prefix: true,
  description: "Automatically warns users when certain sensitive keywords are detected in the message.",
  category: "system",
  cooldowns: 1
};

const CACHE_DIR = path.join(__dirname, 'cache_warning');
const AVT_PATH = path.join(CACHE_DIR, 'avt.png');
const WARN_PATH = path.join(CACHE_DIR, 'warned_avt.png');

fs.ensureDirSync(CACHE_DIR);

// initialize global map if missing
if (!global.data) global.data = {};
if (!global.data.userWarnings || !(global.data.userWarnings instanceof Map)) {
  global.data.userWarnings = new Map();
}

/**
 * Normalize message for matching:
 * - convert to lowercase
 * - replace multiple whitespace with single space
 * - strip punctuation that commonly breaks matching
 */
function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u0964\u0965]/g, ' ') // some bengali punctuation if present
    .replace(/[^0-9a-z\u0980-\u09FF\s]/g, ' ') // remove non-alphanum (keep bengali range)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sensitive keywords list (normalized). You can extend this.
 * Prefer simple tokens; use regex when necessary.
 */
const SENSITIVE_KEYWORDS = [
  'বাল', 'বোকা', 'আবাল', 'সালা', // bengali variants
  'bal', 'cudi', 'sala', 'abal', 'xudi', // latin-script variants
  'fuck you'
];

/**
 * Try to find a matched keyword using normalized message and safe boundaries.
 */
function findMatchedKeyword(message) {
  const n = normalizeText(message);
  if (!n) return null;

  // check for whole-word matches first
  for (const kw of SENSITIVE_KEYWORDS) {
    if (!kw) continue;
    const nk = normalizeText(kw);
    if (!nk) continue;
    const re = new RegExp(`\\b${escapeRegExp(nk)}\\b`, 'i');
    if (re.test(n)) return kw;
  }

  // fallback: substring match (keeps previous behavior)
  for (const kw of SENSITIVE_KEYWORDS) {
    if (!kw) continue;
    const nk = normalizeText(kw);
    if (!nk) continue;
    if (n.includes(nk)) return kw;
  }

  return null;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports.run = async function({ event, api }) {
  // noop — this module reacts to messages via handleEvent
};

module.exports.handleEvent = async function({ event, api }) {
  try {
    if (!event || !event.body) return;

    const raw = String(event.body || '');
    const matchedKeyword = findMatchedKeyword(raw);
    if (!matchedKeyword) return;

    const senderID = String(event.senderID || event.sender || '');
    const threadID = event.threadID || event.threadID;

    // per-user cooldown (default: 1 day)
    const last = global.data.userWarnings.get(senderID) || 0;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (now - last < ONE_DAY) {
      // already warned in last day -> do nothing
      return;
    }

    // optional: typing indicator if API supports it
    try {
      if (typeof api.sendTypingIndicator === 'function') {
        api.sendTypingIndicator(threadID);
      }
    } catch (e) { /* ignore */ }

    // try to get user name
    let userName = senderID;
    try {
      if (typeof api.getUserInfo === 'function') {
        const info = await api.getUserInfo([senderID]);
        if (info && info[senderID] && info[senderID].name) userName = info[senderID].name;
      }
    } catch (e) {
      console.warn('[warning] getUserInfo failed:', e && e.message ? e.message : e);
    }

    // try to download avatar (best-effort). Use short timeout.
    try {
      // Note: token in URL below is public sample — if your bot platform provides a proper method to get avatar, prefer that.
      const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const res = await axios.get(avatarUrl, { responseType: 'arraybuffer', timeout: 8000 });
      if (res && res.data) {
        await fs.writeFile(AVT_PATH, Buffer.from(res.data));
      }
    } catch (e) {
      console.warn('[warning] avatar download failed (continuing):', e && e.message ? e.message : e);
    }

    // build warned image (avatar or fallback)
    try {
      let img;
      if (await fs.pathExists(AVT_PATH)) {
        img = await loadImage(AVT_PATH);
      } else {
        // create a neutral background canvas as fallback
        const tmp = createCanvas(512, 512);
        const ctx = tmp.getContext('2d');
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 512, 512);
        img = tmp;
      }

      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      // draw avatar/background
      if (img instanceof canvasModule.Canvas || img.toDataURL) {
        // if img is a canvas-like fallback
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // dark overlay for contrast
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // big WARNING title
      const titleSize = Math.floor(canvas.width / 8);
      ctx.font = `bold ${titleSize}px Sans`;
      ctx.fillStyle = 'rgba(255,90,90,1)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠ WARNING ⚠', canvas.width / 2, canvas.height * 0.28);

      // keyword line
      ctx.font = `bold ${Math.floor(titleSize / 2.6)}px Sans`;
      ctx.fillStyle = '#ffffff';
      const kwText = `Detected: "${matchedKeyword}"`;
      ctx.fillText(kwText, canvas.width / 2, canvas.height * 0.52);

      // footer with user info
      ctx.font = `${Math.floor(titleSize / 4.2)}px Sans`;
      ctx.fillStyle = '#ffdddd';
      ctx.fillText(`${userName} • ID: ${senderID}`, canvas.width / 2, canvas.height * 0.78);

      // write out PNG
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(WARN_PATH, buffer);
    } catch (e) {
      console.error('[warning] failed to create warned image:', e && (e.stack || e));
    }

    // compose warning message (Bangla)
    const warningMessage =
      `⚠️ সতর্কবার্তা!\n\nআপনি যে ভাষা ব্যবহার করেছেন তা গ্রহণযোগ্য নয়। দয়া করে ভদ্র ভাষা ব্যবহার করুন।\n\n⦿ নাম: ${userName}\n⦿ আইডি: ${senderID}\n⦿ শব্দ: ${matchedKeyword}`;

    // send message (with attachment if present)
    try {
      if (await fs.pathExists(WARN_PATH)) {
        await api.sendMessage({ body: warningMessage, attachment: fs.createReadStream(WARN_PATH) }, threadID);
      } else {
        await api.sendMessage(warningMessage, threadID);
      }
    } catch (e) {
      console.warn('[warning] sendMessage failed:', e && (e.message || e));
    }

    // record last warned time
    global.data.userWarnings.set(senderID, Date.now());

    // cleanup temporary files (best-effort)
    try {
      if (await fs.pathExists(AVT_PATH)) await fs.unlink(AVT_PATH);
      if (await fs.pathExists(WARN_PATH)) await fs.unlink(WARN_PATH);
    } catch (e) {
      console.warn('[warning] cleanup failed:', e && e.message ? e.message : e);
    }

  } catch (err) {
    console.error('[warning] handleEvent error:', err && (err.stack || err));
  }
};