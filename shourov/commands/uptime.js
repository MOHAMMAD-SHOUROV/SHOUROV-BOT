const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "uptime",
  version: "0.0.3",
  permission: 0,
  prefix: true,
  credits: "shourov",
  description: "uptime",
  category: "admin",
  usages: "",
  cooldowns: 5
};

function byte2mb(bytes) {
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  let l = 0;
  let n = parseFloat(bytes) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

async function ensureFont(filePath, url) {
  try {
    if (!fs.existsSync(filePath)) {
      const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, Buffer.from(resp.data));
    }
    return true;
  } catch (e) {
    console.warn("Failed to fetch font:", filePath, e.message || e);
    return false;
  }
}

module.exports.run = async ({ api, event, args }) => {
  try {
    // uptime: process.uptime() returns seconds (float)
    const upSeconds = Math.floor(process.uptime());
    const hours = Math.floor(upSeconds / 3600);
    const minutes = Math.floor((upSeconds % 3600) / 60);
    const seconds = upSeconds % 60;

    const z_1 = (hours < 10) ? "0" + hours : "" + hours;
    const x_1 = (minutes < 10) ? "0" + minutes : "" + minutes;
    const y_1 = (seconds < 10) ? "0" + seconds : "" + seconds;

    const { commands } = global.client;
    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY || HH:mm:ss");

    const pidusage = await global.nodemodule["pidusage"](process.pid);
    const timeStart = Date.now();

    // fonts
    const fontsDir = path.join(__dirname, "nayan");
    await ensureFont(path.join(fontsDir, "UTM-Avo.ttf"), "https://github.com/hanakuUwU/font/raw/main/UTM%20Avo.ttf");
    await ensureFont(path.join(fontsDir, "phenomicon.ttf"), "https://github.com/hanakuUwU/font/raw/main/phenomicon.ttf");
    await ensureFont(path.join(fontsDir, "CaviarDreams.ttf"), "https://github.com/hanakuUwU/font/raw/main/CaviarDreams.ttf");

    // If user asked for list
    if (args[0] && args[0].toLowerCase() === "list") {
      try {
        const alime = (await axios.get("https://raw.githubusercontent.com/mraikero-01/saikidesu_data/main/anilist2.json", { timeout: 15000 })).data;
        const count = alime.listAnime.length;
        const data = alime.listAnime;
        let page = parseInt(args[1]) || 1;
        if (page < 1) page = 1;
        const limit = 20;
        const numPage = Math.ceil(count / limit);
        let msg = "";
        for (let i = limit * (page - 1); i < limit * (page - 1) + limit; i++) {
          if (i >= count) break;
          msg += `[ ${i + 1} ] - ${data[i].ID} | ${data[i].name}\n`;
        }
        msg += `Page ( ${page}/${numPage} )\nUse ${global.config.PREFIX}${module.exports.config.name} list <page>`;
        return api.sendMessage(msg, event.threadID, event.messageID);
      } catch (e) {
        return api.sendMessage("Failed to fetch the list.", event.threadID, event.messageID);
      }
    }

    // pick id
    let id;
    if (!args[0]) id = Math.floor(Math.random() * 883) + 1;
    else id = Number(args[0]) || 1;

    // background image choices
    const loz = [
      "https://i.imgur.com/9jbBPIM.jpg",
      "https://i.imgur.com/cPvDTd9.jpg",
      "https://i.imgur.com/ZT8CgR1.jpg",
      "https://i.imgur.com/WhOaTx7.jpg",
      "https://i.imgur.com/BIcgJOA.jpg",
      "https://i.imgur.com/EcJt1yq.jpg",
      "https://i.imgur.com/0dtnQ2m.jpg"
    ];

    // load lengthchar dataset
    const lengthcharResp = await axios.get("https://raw.githubusercontent.com/mraikero-01/saikidesu_data/main/imgs_data2.json", { timeout: 15000 });
    const lengthchar = lengthcharResp.data;

    // prepare image paths
    const pathImg = path.join(__dirname, "nayan", `avatar_base_${Date.now()}.png`);
    const pathAva = path.join(__dirname, "nayan", `avatar_char_${Date.now()}.png`);

    // download random background
    const bgUrl = loz[Math.floor(Math.random() * loz.length)];
    const bgResp = await axios.get(bgUrl, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(pathImg, Buffer.from(bgResp.data));

    // character image from dataset (guard against missing index)
    const charIndex = Math.max(0, Math.min(lengthchar.length - 1, id - 1));
    const charUrl = lengthchar[charIndex] && lengthchar[charIndex].imgAnime ? lengthchar[charIndex].imgAnime : lengthchar[0].imgAnime;
    const charResp = await axios.get(encodeURI(charUrl), { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(pathAva, Buffer.from(charResp.data));

    // canvas drawing
    const { loadImage, createCanvas, registerFont } = require("canvas");

    // register fonts if available
    try {
      registerFont(path.join(fontsDir, "phenomicon.ttf"), { family: "phenomicon" });
      registerFont(path.join(fontsDir, "UTM-Avo.ttf"), { family: "UTM" });
      registerFont(path.join(fontsDir, "CaviarDreams.ttf"), { family: "time" });
    } catch (e) {
      console.warn("Canvas font register warning:", e.message || e);
    }

    const l1 = await loadImage(pathAva);
    const aImg = await loadImage(pathImg);

    const canvas = createCanvas(aImg.width, aImg.height);
    const ctx = canvas.getContext("2d");

    // background color (fallback)
    const bgColor = (lengthchar[charIndex] && lengthchar[charIndex].colorBg) ? lengthchar[charIndex].colorBg : "#111827";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(aImg, 0, 0, canvas.width, canvas.height);

    // draw character - positions preserved from original but clamped to canvas size
    const drawX = Math.min(canvas.width - 10, 800);
    ctx.drawImage(l1, drawX, -160, 1100, 1100);

    // main title
    ctx.textAlign = "start";
    ctx.filter = "brightness(90%) contrast(110%)";
    ctx.font = "130px phenomicon";
    ctx.fillStyle = (lengthchar[charIndex] && lengthchar[charIndex].colorBg) ? lengthchar[charIndex].colorBg : "#ffffff";
    ctx.fillText("UPTIME ROBOT", 95, 340);

    // uptime text
    ctx.font = "70px UTM";
    ctx.fillStyle = "#fdfdfd";
    ctx.fillText(`${z_1} : ${x_1} : ${y_1}`, 180, 440);

    // footer text
    ctx.font = "45px time";
    ctx.fillText("@www.xsxx.com365", 250, 515);
    ctx.fillText("@MOHAMMAD-SHOUROV", 250, 575);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    // Prepare message body
    const body = `┃======{ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗥𝗢𝗕𝗢𝗧 }======┃\n\n→ Bot worked ${hours} hours ${minutes} minutes ${seconds} seconds\n•━━━━━━━━━━━━━━━━━━━━━━━━•\n➠ 𝐊𝐈𝐍𝐆 𝐒𝐇𝐎𝐔𝐑𝐎𝐕\n➠ Bot Name: ${global.config.BOTNAME || "Bot"}\n➠ Bot Prefix: ${global.config.PREFIX}\n➠ Commands count: ${commands ? commands.size : 0}\n➠ Total Users: ${global.data && global.data.allUserID ? global.data.allUserID.length : 0}\n➠ Total thread: ${global.data && global.data.allThreadID ? global.data.allThreadID.length : 0}\n➠ CPU in use: ${pidusage.cpu.toFixed(1)}%\n➠ RAM: ${byte2mb(pidusage.memory)}\n➠ Ping: ${Date.now() - timeStart}ms\n➠ Character ID: ${id}\n•━━━━━━━━━━━━━━━━━━━━━━━━•\n[ ${timeNow} ]`;

    // send message, then cleanup files after send callback finishes
    api.sendMessage({
      body,
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, (err, info) => {
      // delete temp files (best-effort)
      try {
        if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
        if (fs.existsSync(pathAva)) fs.unlinkSync(pathAva);
      } catch (e) {
        console.warn("cleanup error:", e && e.message);
      }
      if (err) console.error("sendMessage error:", err);
    }, event.messageID);

  } catch (error) {
    console.error("uptime command error:", error);
    return api.sendMessage("An error occurred while running uptime. Check console for details.", event.threadID, event.messageID);
  }
};
