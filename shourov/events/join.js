// join.js
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const request = require("request");
const jimp = require("jimp");
const { createCanvas, loadImage, registerFont } = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "join",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "Mirai-Team (fixed by Yan / Shourov)",
  description: "GROUP UPDATE NOTIFICATION"
};

// helper: make circular avatar buffer
module.exports.circle = async (imagePath) => {
  const image = await jimp.read(imagePath);
  image.circle();
  return await image.getBufferAsync("image/png");
};

const FONT_URL = 'https://drive.google.com/u/0/uc?id=10XFWm9F6u2RKnuVIfwoEdlav2HhkAUIB&export=download';
const WORK_DIR = path.join(__dirname, 'shourov', 'join');
const FONT_DIR = path.join(__dirname, 'shourov', 'font');
const FONT_FILE = path.join(FONT_DIR, 'Semi.ttf');

async function ensureDirs() {
  await fs.ensureDir(WORK_DIR);
  await fs.ensureDir(FONT_DIR);
}

function getSessionByHour(h) {
  // h is integer hour 0-23
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

    // If the bot itself was added => send a connected message + gif
    const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;
    const botAdded = added.some(p => String(p.userFbId) === String(botId));

    await ensureDirs();

    // If bot was added, send simple welcome + GIF and change bot nickname (if possible)
    if (botAdded) {
      try {
        const gifUrl = 'https://i.postimg.cc/Kj8stktZ/flamingtext-com-2578872570.gif';
        const gifPath = path.join(WORK_DIR, 'join.gif');
        const resp = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(gifPath, resp.data);

        // try change nickname if API supports
        try {
          if (typeof api.changeNickname === "function" && botId) {
            const botName = (global && global.config && global.config.BOTNAME) ? global.config.BOTNAME : "bot";
            const prefix = (global && global.config && global.config.PREFIX) ? global.config.PREFIX : "";
            await api.changeNickname(`[ ${prefix} ] • ➠${botName}`, event.threadID, botId);
          }
        } catch (e) { /* ignore nickname failure */ }

        const body = `চলে এসেছি আমি পিচ্চি সৌরভ তোমাদের মাঝে🤭!\n\n${(global && global.config && global.config.BOTNAME) ? global.config.BOTNAME + " CONNECTED" : "BOT CONNECTED" }\nUse ${ (global && global.config && global.config.PREFIX) ? global.config.PREFIX + "help" : "help" } to see commands.`;

        await api.sendMessage({ body, attachment: fs.createReadStream(gifPath) }, event.threadID);
      } catch (e) {
        console.error("Bot-added greeting error:", e);
      }
      return;
    }

    // --- normal user(s) joined path ---
    // ensure font exists
    if (!fs.existsSync(FONT_FILE)) {
      try {
        const fontResp = await axios.get(FONT_URL, { responseType: "arraybuffer" });
        await fs.writeFile(FONT_FILE, Buffer.from(fontResp.data));
      } catch (e) {
        console.warn("Could not download font, using system default:", e.message || e);
      }
    }

    // gather thread info
    let threadInfo = {};
    try {
      threadInfo = (typeof api.getThreadInfo === "function") ? await api.getThreadInfo(event.threadID) : {};
    } catch (e) {
      threadInfo = {};
    }
    const threadName = threadInfo.threadName || "this group";
    const participantIDs = threadInfo.participantIDs || [];

    // time/session strings
    const now = moment.tz("Asia/Dhaka");
    const timeStr = now.format("HH:mm:ss - DD/MM/YYYY");
    const dayName = now.format("dddd");
    const hour = parseInt(now.format("HH"), 10);
    const session = getSessionByHour(hour);

    // create mentions array and attachments
    const mentions = [];
    const attachments = [];

    // download a random background images list (fallback urls)
    const backgrounds = [
      'https://i.imgur.com/5r6Qw3K.jpg',
      'https://i.imgur.com/3ZQ3ZVq.jpg',
      'https://i.imgur.com/8Km9tLL.jpg'
    ];

    // iterate over each added participant and create a welcome image
    for (let idx = 0; idx < added.length; idx++) {
      const part = added[idx];
      const uid = String(part.userFbId);
      const fullName = part.fullName || uid;

      // prepare avatar fetch
      const avaUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720`;
      const avaPath = path.join(WORK_DIR, `avt_${idx}.png`);
      const outImgPath = path.join(WORK_DIR, `out_${idx}.png`);
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      // download avatar and background
      try {
        const [avaResp, bgResp] = await Promise.all([
          axios.get(avaUrl, { responseType: "arraybuffer" }),
          axios.get(bgUrl, { responseType: "arraybuffer" })
        ]);
        await fs.writeFile(avaPath, avaResp.data);
        await fs.writeFile(outImgPath, bgResp.data);
      } catch (e) {
        console.warn("Image download failed, skipping image for", uid, e.message || e);
        continue;
      }

      // make circular avatar
      let circularBuffer;
      try {
        circularBuffer = await module.exports.circle(avaPath);
      } catch (e) {
        console.warn("Circle avatar failed:", e);
        // fallback to avatar itself
        circularBuffer = await fs.readFile(avaPath);
      }
      const circPath = path.join(WORK_DIR, `circ_${idx}.png`);
      await fs.writeFile(circPath, circularBuffer);

      // load images into canvas
      try {
        const baseImg = await loadImage(outImgPath);
        const avatarImg = await loadImage(circPath);

        if (fs.existsSync(FONT_FILE)) {
          try { registerFont(FONT_FILE, { family: "Semi" }); } catch (e) { /* ignore */ }
        }

        const canvas = createCanvas(1902, 1082);
        const ctx = canvas.getContext('2d');

        // draw background
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

        // draw avatar centered-ish
        const avaW = 375, avaH = 355;
        ctx.drawImage(avatarImg, canvas.width / 2 - avaW/2, canvas.height / 2 - 375, avaW, avaH);

        // text settings
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        // title: name
        ctx.font = `bold 80px ${fs.existsSync(FONT_FILE) ? "Semi" : "Sans"}`;
        ctx.fillText(fullName, canvas.width / 2, canvas.height / 2 + 100);

        // subtitle: welcome + thread name
        ctx.font = `48px ${fs.existsSync(FONT_FILE) ? "Semi" : "Sans"}`;
        ctx.fillText(`Welcome to ${threadName}`, canvas.width / 2, canvas.height / 2 + 180);

        // member number
        const number = participantIDs.length; // current total (approx)
        // suffix
        let suffix = "th";
        if (![11,12,13].includes(number % 100)) {
          if (number % 10 === 1) suffix = "st";
          else if (number % 10 === 2) suffix = "nd";
          else if (number % 10 === 3) suffix = "rd";
        }
        ctx.fillText(`You are the ${number}${suffix} member of this group`, canvas.width / 2, canvas.height / 2 + 260);

        // small footer: time
        ctx.font = `30px ${fs.existsSync(FONT_FILE) ? "Semi" : "Sans"}`;
        ctx.fillText(`${timeStr} • ${dayName} • ${session}`, canvas.width / 2, canvas.height - 60);

        // write out image
        const buffer = canvas.toBuffer();
        const finalPath = path.join(WORK_DIR, `final_${idx}.png`);
        await fs.writeFile(finalPath, buffer);

        attachments.push(fs.createReadStream(finalPath));

        // mention object (try to resolve name via Users or api)
        let mentionName = fullName;
        try {
          if (Users && typeof Users.getNameUser === "function") {
            mentionName = await Users.getNameUser(uid) || fullName;
          } else if (api && typeof api.getUserInfo === "function") {
            const info = await api.getUserInfo(uid);
            // api.getUserInfo may return object keyed by id
            if (info && info[uid] && info[uid].name) mentionName = info[uid].name;
          }
        } catch (e) { /* ignore */ }

        mentions.push({ id: uid, tag: mentionName });
      } catch (e) {
        console.warn("Canvas creation failed for", uid, e);
      }
    } // end for

    // prepare message text (use threadData.customJoin if available in global.data)
    let threadData = {};
    try {
      if (global && global.data && global.data.threadData && global.data.threadData.has && global.data.threadData.get) {
        threadData = global.data.threadData.get(parseInt(event.threadID)) || {};
      }
    } catch (e) { threadData = {}; }

    const nameList = added.map(p => p.fullName || p.userFbId).join(', ');
    let msg = threadData.customJoin || 
      `╭•┄┅═══❁🌺❁═══┅┄•╮\n   আসসালামু আলাইকুম-!!🖤\n╰•┄┅═══❁🌺❁═══┅┄•╯\n\n✨ WELCOME ✨\n\n{name} to ${threadName}\n\n{time} - ${dayName}`;

    msg = msg
      .replace(/\{name\}/g, nameList)
      .replace(/\{threadName\}/g, threadName)
      .replace(/\{time\}/g, timeStr)
      .replace(/\{thu\}/g, dayName);

    // send message (with attachments and mentions)
    const form = { body: msg, mentions, attachment: attachments.length ? attachments : undefined };
    await api.sendMessage(form, event.threadID);

    // cleanup temp images after slight delay to ensure upload finished
    setTimeout(async () => {
      try {
        const files = await fs.readdir(WORK_DIR);
        for (const f of files) {
          if (f.startsWith('avt_') || f.startsWith('out_') || f.startsWith('circ_') || f.startsWith('final_') || f === 'join.gif') {
            await fs.remove(path.join(WORK_DIR, f));
          }
        }
      } catch (e) { /* ignore cleanup errors */ }
    }, 6_000);

  } catch (err) {
    console.error("Join event error:", err);
  }
};
