// join.js
module.exports.config = {
  name: "join",
  eventType: ['log:subscribe'],
  version: "1.0.1",
  credits: "(Shourov)",
  description: "GROUP UPDATE NOTIFICATION"
};

const fs = require('fs-extra');
const path = require('path');
const { loadImage, createCanvas, registerFont } = require("canvas");
const axios = require('axios');
const jimp = require("jimp");
const moment = require("moment-timezone");

const FONT_LINK = 'https://drive.google.com/u/0/uc?id=10XFWm9F6u2RKnuVIfwoEdlav2HhkAUIB&export=download';
const BASE_DIR = path.join(__dirname, 'Nayan', 'join'); // keep same folder as you used
const FONT_DIR = path.join(__dirname, 'Nayan', 'font');
const FONT_PATH = path.join(FONT_DIR, 'Semi.ttf');

async function ensureDirs() {
  await fs.ensureDir(BASE_DIR);
  await fs.ensureDir(FONT_DIR);
}

module.exports.circle = async (image) => {
  const img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
};

function ordinalSuffix(n) {
  if ([11,12,13].includes(n % 100)) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function getSessionByHour(h) {
  if (h < 3) return "midnight";
  if (h < 8) return "Early morning";
  if (h < 12) return "noon";
  if (h < 17) return "afternoon";
  if (h < 23) return "evening";
  return "midnight";
}

module.exports.run = async function ({ api, event, config, language, Users }) {
  try {
    if (!event || !event.logMessageData) return;
    const added = event.logMessageData.addedParticipants;
    if (!Array.isArray(added) || added.length === 0) return;

    await ensureDirs();

    // Load config values safely from global.config or passed config
    const gconf = (global && global.config) ? global.config : (config || {});
    const prefix = (gconf.PREFIX) ? gconf.PREFIX : '/';
    const botNameFromConfig = gconf.BOTNAME || "BOT";
    const autoSetNick = (typeof gconf.autoSetBotNickname !== 'undefined') ? !!gconf.autoSetBotNickname : true;

    // bot id (if api provides)
    let botId = null;
    try { botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null; } catch(e){ botId = null; }

    // If bot itself was added -> set nickname from config (if allowed) and send a connected message (no exposing id)
    if (botId && added.some(p => String(p.userFbId) === String(botId))) {
      if (autoSetNick) {
        try {
          if (typeof api.changeNickname === 'function') {
            const nick = `[ ${prefix} ] • ${botNameFromConfig}`;
            // many API versions: (nick, threadID, userID)
            await api.changeNickname(nick, event.threadID, botId);
          }
        } catch (e) {
          console.warn('Failed to change bot nickname:', e && e.message ? e.message : e);
        }
      }

      // send a short connected message with optional gif
      try {
        const gifUrl = 'https://i.postimg.cc/Kj8stktZ/flamingtext-com-2578872570.gif';
        const gifPath = path.join(BASE_DIR, 'join_bot.gif');
        const r = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(gifPath, r.data);

        const body = `${botNameFromConfig} CONNECTED ✅\nAssalamu Alaykum / Use ${prefix}help to see commands.`;
        await api.sendMessage({ body, attachment: fs.createReadStream(gifPath) }, event.threadID);

        // cleanup gif after short delay
        setTimeout(() => { try { fs.removeSync(gifPath); } catch(e){} }, 10_000);
      } catch (e) {
        // fall back to plain text message
        try { await api.sendMessage(`${botNameFromConfig} CONNECTED ✅\nAssalamu Alaykum / Use ${prefix}help to see commands.`, event.threadID); } catch(e) {}
      }

      return;
    }

    // --- Normal new user(s) joined: create welcome images per new user (keeps your original style) ---
    // Ensure font (best-effort)
    try {
      if (!fs.existsSync(FONT_PATH)) {
        const fontBuf = (await axios.get(FONT_LINK, { responseType: 'arraybuffer' })).data;
        await fs.writeFile(FONT_PATH, Buffer.from(fontBuf));
      }
    } catch (e) {
      // font optional — proceed with system fonts
      console.warn('Could not download/register font, continuing with default font.');
    }

    // fetch thread info
    let threadInfo = {};
    try { threadInfo = (typeof api.getThreadInfo === 'function') ? await api.getThreadInfo(event.threadID) : {}; } catch (e) { threadInfo = {}; }
    const threadName = threadInfo.threadName || 'this group';
    const participantIDs = Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs : [];

    // time/session
    const now = moment.tz("Asia/Dhaka");
    const timeStr = now.format("HH:mm:ss - DD/MM/YYYY");
    const dayName = now.format("dddd");
    const hour = parseInt(now.format("HH"), 10);
    const session = getSessionByHour(hour);

    const mentions = [];
    const attachments = [];
    const backgrounds = [
      'https://i.imgur.com/WKUqCkQ.jpeg',
      'https://i.imgur.com/ccVuwrA.jpeg',
      'https://i.imgur.com/ZPGBaPD.jpeg',
      'https://i.imgur.com/las7yGW.jpeg',
      'https://i.imgur.com/bxDnRQC.jpeg'
    ];

    for (let o = 0; o < added.length; o++) {
      try {
        const p = added[o];
        const uid = String(p.userFbId);
        const name = p.fullName || uid;

        // download avatar & random bg
        const avaUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720`;
        const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

        const avaPath = path.join(BASE_DIR, `avt_${o}.png`);
        const bgPath = path.join(BASE_DIR, `bg_${o}.jpg`);
        const outPath = path.join(BASE_DIR, `final_${o}.png`);

        // get buffers
        const [avaBuf, bgBuf] = await Promise.all([
          axios.get(avaUrl, { responseType: 'arraybuffer' }).then(r => r.data).catch(() => null),
          axios.get(bgUrl, { responseType: 'arraybuffer' }).then(r => r.data).catch(() => null)
        ]);

        if (!avaBuf) continue; // skip if avatar failed

        await fs.writeFile(avaPath, avaBuf);
        if (bgBuf) await fs.writeFile(bgPath, bgBuf);

        // make circular avatar
        let circBuf;
        try { circBuf = await module.exports.circle(avaPath); } catch (e) { circBuf = await fs.readFile(avaPath); }
        const circPath = path.join(BASE_DIR, `circ_${o}.png`);
        await fs.writeFile(circPath, circBuf);

        // build canvas
        const baseImage = await loadImage(bgBuf ? bgPath : avaPath); // fallback to avatar if no bg
        const avatarImg = await loadImage(circPath);

        if (fs.existsSync(FONT_PATH)) {
          try { registerFont(FONT_PATH, { family: "Semi" }); } catch(e){}
        }

        const canvas = createCanvas(1902, 1082);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(avatarImg, canvas.width / 2 - 188, canvas.height / 2 - 375, 375, 355);

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";

        ctx.font = `bold 100px ${fs.existsSync(FONT_PATH) ? 'Semi' : 'Sans'}`;
        ctx.fillText(name, canvas.width / 2 + 20, canvas.height / 2 + 100);

        ctx.font = `60px ${fs.existsSync(FONT_PATH) ? 'Semi' : 'Sans'}`;
        ctx.fillText(`Welcome to ${threadName}`, canvas.width / 2 - 15, canvas.height / 2 + 235);

        const number = Math.max(0, participantIDs.length - o);
        ctx.font = `48px ${fs.existsSync(FONT_PATH) ? 'Semi' : 'Sans'}`;
        ctx.fillText(`You are the ${number}${ordinalSuffix(number)} member of this group`, canvas.width / 2 - 15, canvas.height / 2 + 350);

        ctx.font = `28px ${fs.existsSync(FONT_PATH) ? 'Semi' : 'Sans'}`;
        ctx.fillText(`${timeStr} • ${dayName} • ${session}`, canvas.width / 2, canvas.height - 60);

        const buffer = canvas.toBuffer();
        await fs.writeFile(outPath, buffer);

        attachments.push(fs.createReadStream(outPath));
        mentions.push({ id: uid, tag: name });

      } catch (innerErr) {
        console.warn('Welcome image creation error for index', o, innerErr && innerErr.message ? innerErr.message : innerErr);
        continue;
      }
    } // end for

    // message template
    let threadData = {};
    try {
      if (global && global.data && global.data.threadData && typeof global.data.threadData.get === 'function') {
        threadData = global.data.threadData.get(parseInt(event.threadID)) || {};
      }
    } catch (e) { threadData = {}; }

    const names = added.map(p => p.fullName || p.userFbId).join(', ');
    let msg = threadData.customJoin || `╭•┄┅═══❁🌺❁═══┅┄•╮\nWelcome {name} to ${threadName}\n╰•┄┅═══❁🌺❁═══┅┄•╯\n\n{time}`;
    msg = msg.replace(/\{name\}/g, names).replace(/\{time\}/g, timeStr);

    const form = { body: msg, mentions, attachment: attachments.length ? attachments : undefined };
    await api.sendMessage(form, event.threadID);

    // cleanup temp files after a short delay
    setTimeout(async () => {
      try {
        const files = await fs.readdir(BASE_DIR);
        for (const f of files) {
          if (/^(avt_|bg_|circ_|final_|join_bot\.gif)/.test(f)) {
            try { await fs.remove(path.join(BASE_DIR, f)); } catch(e){}
          }
        }
      } catch (e) {}
    }, 7000);

  } catch (err) {
    console.error('Join event error:', err && err.stack ? err.stack : err);
  }
};
