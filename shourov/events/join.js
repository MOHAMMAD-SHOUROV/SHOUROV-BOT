// shourov/events/join.js (patched - defensive)
module.exports.config = {
  name: "join",
  eventType: ['log:subscribe'],
  version: "1.0.1",
  credits: "FIXED BY YAN & shourov",
  description: "GROUP UPDATE NOTIFICATION"
};

const fs = require('fs-extra');
const { loadImage, createCanvas, registerFont } = require("canvas");
const request = require('request');
const axios = require('axios');
const jimp = require("jimp");
const fontlink = 'https://drive.google.com/u/0/uc?id=10XFWm9F6u2RKnuVIfwoEdlav2HhkAUIB&export=download';

module.exports.circle = async (image) => {
  image = await jimp.read(image);
  image.circle();
  return await image.getBufferAsync("image/png");
}

module.exports.run = async function({ api, event, Users }) {
  try {
    // safety checks
    if (!event || !event.logMessageData) return; // nothing to do
    const added = event.logMessageData.addedParticipants;
    if (!Array.isArray(added) || added.length === 0) return; // no new participants

    // ensure api.getCurrentUserID exists
    const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;

    // if bot was just added -> special welcome for bot only
    if (added.some(p => String(p.userFbId) === String(botId))) {
      try {
        const threadID = event.threadID;
        await api.changeNickname(`[ ${global.config.PREFIX} ] • ➠${(!global.config.BOTNAME) ? "bot" : global.config.BOTNAME}`, threadID, botId);
        const gifUrl = 'https://i.postimg.cc/Kj8stktZ/flamingtext-com-2578872570.gif';
        const gifPath = __dirname + '/shourov/join/join.gif';
        const resp = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(gifPath, resp.data);
        await api.sendMessage("চলে এসেছি আমি পিচ্চি সৌরভ তোমাদের মাঝে🤭!", threadID);
        await api.sendMessage({ body: `${global.config.BOTNAME} CONNECTED\nUse ${global.config.PREFIX}help`, attachment: fs.createReadStream(gifPath) }, threadID);
        return;
      } catch (e) {
        console.warn("bot-joined flow error:", e && e.message);
      }
    }

    // Normal user(s) joined -> build image(s) & message
    const threadID = event.threadID;
    const threadInfo = await api.getThreadInfo(threadID).catch(()=>({ threadName: "" }));
    const threadName = threadInfo.threadName || "Group";

    // prepare fonts dir if needed
    try {
      const fontDir = __dirname + `/shourov/font`;
      if (!fs.existsSync(fontDir)) {
        fs.mkdirSync(fontDir, { recursive: true });
      }
      if (!fs.existsSync(__dirname + `/shourov/font/Semi.ttf`)) {
        let getfont = (await axios.get(fontlink, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(__dirname + `/shourov/font/Semi.ttf`, Buffer.from(getfont, "utf-8"));
      }
    } catch (e) {
      // non-fatal
      console.warn("font fetch error:", e && e.message);
    }

    // create images for each added participant
    const abx = [];
    const mentions = [];
    for (let o = 0; o < added.length; o++) {
      try {
        const user = added[o];
        const userId = user.userFbId;
        const userName = user.fullName || (await Users.getNameUser(userId).catch(()=>("Unknown")));
        mentions.push({ tag: userName, id: userId });

        const pathAva = __dirname + `/shourov/join/avt_${o}.png`;
        const pathImg = __dirname + `/shourov/join/${o}.png`;

        // fetch avatar safely
        const avtResp = await axios.get(`https://graph.facebook.com/${userId}/picture?height=720&width=720`, { responseType: 'arraybuffer' }).catch(()=>null);
        if (avtResp && avtResp.data) fs.writeFileSync(pathAva, Buffer.from(avtResp.data));

        // pick random background
        const backgrounds = [
          'https://i.imgur.com/WKUqCkQ.jpeg',
          'https://i.imgur.com/ccVuwrA.jpeg',
          'https://i.imgur.com/ZPGBaPD.jpeg'
        ];
        const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        const bgResp = await axios.get(bgUrl, { responseType: 'arraybuffer' }).catch(()=>null);
        if (bgResp && bgResp.data) fs.writeFileSync(pathImg, Buffer.from(bgResp.data));

        // compose canvas
        const avatarBuffer = await this.circle(pathAva);
        const baseImage = await loadImage(pathImg);
        const baseAva = await loadImage(avatarBuffer);
        registerFont(__dirname + `/shourov/font/Semi.ttf`, { family: "Semi" });

        const canvas = createCanvas(1902, 1082);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(baseAva, canvas.width/2 - 188, canvas.height/2 - 375, 375, 355);
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.font = `55px Semi`;
        ctx.fillText(`${userName}`, canvas.width/2, canvas.height/2 + 140);
        ctx.font = `36px Semi`;
        ctx.fillText(`Welcome to ${threadName}`, canvas.width/2, canvas.height/2 + 200);

        const buffer = canvas.toBuffer();
        fs.writeFileSync(pathImg, buffer);
        abx.push(fs.createReadStream(pathImg));
      } catch (e) {
        console.warn("join: per-user image build failed:", e && e.message);
      }
    }

    // compose message template (allow customJoin in thread data)
    let threadData = {};
    try { threadData = global.data.threadData.get(parseInt(threadID)) || {}; } catch(e){ threadData = {}; }
    let msg = threadData.customJoin || `╭•┄┅═══❁🌺❁═══┅┄•╮\n   আসসালামু আলাইকুম-!!🖤\n╰•┄┅═══❁🌺❁═══┅┄•╯\n\nWelcome {name} to ${threadName}\n\n{time}`;
    msg = msg.replace(/\{name\}/g, added.map(x=>x.fullName || "").join(", ")).replace(/\{time\}/g, new Date().toLocaleString("en-GB",{timeZone:"Asia/Dhaka"}));

    // send
    await api.sendMessage({ body: msg, attachment: abx, mentions }, threadID);

    // cleanup files (best-effort)
    try {
      for (let i = 0; i < added.length; i++) {
        const p = __dirname + `/shourov/join/${i}.png`;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch (e) { /* ignore */ }

  } catch (err) {
    console.error("join.js error:", err && (err.stack || err));
  }
};
