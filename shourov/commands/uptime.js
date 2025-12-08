const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "uptime",
  version: "0.0.4",
  permission: 0,
  prefix: true,
  credits: "shourov (optimized)",
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
    await fs.ensureDir(path.dirname(filePath));
    if (!fs.existsSync(filePath)) {
      const resp = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(filePath, Buffer.from(resp.data));
      return true;
    }
    return true;
  } catch (e) {
    console.warn("Failed to fetch font:", filePath, e && e.message ? e.message : e);
    return false;
  }
}

// compute luminance to pick contrasting text color
function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16)
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}
function readableColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  // relative luminance
  const lum = 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return lum > 0.55 ? "#111111" : "#ffffff";
}

module.exports.run = async ({ api, event, args }) => {
  const fontsDir = path.join(__dirname, "nayan");
  await fs.ensureDir(fontsDir);

  const tmpBase = Date.now();
  const pathImg = path.join(fontsDir, `avatar_base_${tmpBase}.png`);
  const pathAva = path.join(fontsDir, `avatar_char_${tmpBase}.png`);

  try {
    // uptime: process.uptime() returns seconds (float)
    const upSeconds = Math.floor(process.uptime());
    const hours = Math.floor(upSeconds / 3600);
    const minutes = Math.floor((upSeconds % 3600) / 60);
    const seconds = upSeconds % 60;

    const z_1 = (hours < 10) ? "0" + hours : "" + hours;
    const x_1 = (minutes < 10) ? "0" + minutes : "" + minutes;
    const y_1 = (seconds < 10) ? "0" + seconds : "" + seconds;

    const { commands } = global.client || {};
    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY || HH:mm:ss");

    const pidusage = (global.nodemodule && global.nodemodule["pidusage"]) ? await global.nodemodule["pidusage"](process.pid) : { cpu: 0, memory: 0 };
    const timeStart = Date.now();

    // fetch fonts (best-effort)
    await ensureFont(path.join(fontsDir, "UTM-Avo.ttf"), "https://github.com/hanakuUwU/font/raw/main/UTM%20Avo.ttf");
    await ensureFont(path.join(fontsDir, "phenomicon.ttf"), "https://github.com/hanakuUwU/font/raw/main/phenomicon.ttf");
    await ensureFont(path.join(fontsDir, "CaviarDreams.ttf"), "https://github.com/hanakuUwU/font/raw/main/CaviarDreams.ttf");

    // list mode
    if (args[0] && args[0].toLowerCase() === "list") {
      try {
        const alime = (await axios.get("https://raw.githubusercontent.com/mraikero-01/saikidesu_data/main/anilist2.json", { timeout: 15000 })).data;
        const count = (alime && alime.listAnime) ? alime.listAnime.length : 0;
        const data = (alime && alime.listAnime) ? alime.listAnime : [];
        let page = parseInt(args[1]) || 1;
        if (page < 1) page = 1;
        const limit = 20;
        const numPage = Math.max(1, Math.ceil(count / limit));
        let msg = "";
        for (let i = limit * (page - 1); i < Math.min(count, limit * (page - 1) + limit); i++) {
          msg += `[ ${i + 1} ] - ${data[i].ID} | ${data[i].name}\n`;
        }
        msg += `Page ( ${page}/${numPage} )\nUse ${global.config.PREFIX || ""}${module.exports.config.name} list <page>`;
        return api.sendMessage(msg, event.threadID, event.messageID);
      } catch (e) {
        console.warn("uptime list fetch failed:", e && e.message ? e.message : e);
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

    // load lengthchar dataset (guarded)
    let lengthchar = [];
    try {
      const lengthcharResp = await axios.get("https://raw.githubusercontent.com/mraikero-01/saikidesu_data/main/imgs_data2.json", { timeout: 15000 });
      lengthchar = lengthcharResp.data || [];
      if (!Array.isArray(lengthchar)) lengthchar = [];
    } catch (e) {
      console.warn("Failed to fetch imgs_data2.json:", e && e.message ? e.message : e);
      lengthchar = [];
    }

    // download random background
    const bgUrl = loz[Math.floor(Math.random() * loz.length)];
    try {
      const bgResp = await axios.get(bgUrl, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(pathImg, Buffer.from(bgResp.data));
    } catch (e) {
      console.warn("Failed to download background image:", e && e.message ? e.message : e);
      // create a small fallback image if download fails
      const { createCanvas } = require("canvas");
      const c = createCanvas(1200, 675);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, c.width, c.height);
      fs.writeFileSync(pathImg, c.toBuffer());
    }

    // character image from dataset with fallback
    let charUrl = null;
    const charIndex = Math.max(0, Math.min(lengthchar.length - 1, id - 1));
    if (lengthchar && lengthchar[charIndex] && lengthchar[charIndex].imgAnime) {
      charUrl = lengthchar[charIndex].imgAnime;
    } else if (lengthchar && lengthchar[0] && lengthchar[0].imgAnime) {
      charUrl = lengthchar[0].imgAnime;
    } else {
      // fallback public image
      charUrl = "https://i.imgur.com/0dtnQ2m.jpg";
    }

    try {
      const charResp = await axios.get(encodeURI(charUrl), { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(pathAva, Buffer.from(charResp.data));
    } catch (e) {
      console.warn("Failed to download character image:", e && e.message ? e.message : e);
      // use background as character if character download failed
      fs.copyFileSync(pathImg, pathAva);
    }

    // canvas drawing
    const { loadImage, createCanvas, registerFont } = require("canvas");

    // register fonts if available
    try {
      const phenom = path.join(fontsDir, "phenomicon.ttf");
      const uto = path.join(fontsDir, "UTM-Avo.ttf");
      const caviar = path.join(fontsDir, "CaviarDreams.ttf");
      if (fs.existsSync(phenom)) registerFont(phenom, { family: "phenomicon" });
      if (fs.existsSync(uto)) registerFont(uto, { family: "UTM" });
      if (fs.existsSync(caviar)) registerFont(caviar, { family: "time" });
    } catch (e) {
      console.warn("Canvas font register warning:", e && e.message ? e.message : e);
    }

    const l1 = await loadImage(pathAva);
    const aImg = await loadImage(pathImg);

    // create canvas with same size as background
    const canvas = createCanvas(aImg.width, aImg.height);
    const ctx = canvas.getContext("2d");

    // background color (fallback)
    const bgColor = (lengthchar[charIndex] && lengthchar[charIndex].colorBg) ? lengthchar[charIndex].colorBg : "#111827";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw background image
    ctx.drawImage(aImg, 0, 0, canvas.width, canvas.height);

    // draw character image scaled relative to canvas size
    // character should take up to ~50% of canvas width (adjustable)
    const charMaxWidth = Math.floor(canvas.width * 0.5);
    let charWidth = l1.width;
    let charHeight = l1.height;
    // scale preserving aspect ratio
    const scale = Math.min(1, charMaxWidth / charWidth);
    charWidth = Math.floor(charWidth * scale);
    charHeight = Math.floor(charHeight * scale);

    // position it on the right side, vertically centered (with small offset)
    const charX = Math.max(20, canvas.width - charWidth - 60);
    const charY = Math.max(-200, Math.floor((canvas.height - charHeight) / 2) - 100);

    ctx.drawImage(l1, charX, charY, charWidth, charHeight);

    // Title: pick readable color vs bg
    const titleColor = readableColor(bgColor);
    ctx.textAlign = "start";
    ctx.filter = "brightness(95%) contrast(105%)";

    // Title (scale font to canvas width)
    const titleFontSize = Math.floor(Math.max(48, canvas.width * 0.108)); // ~10% of width but min 48
    ctx.font = `${titleFontSize}px phenomicon`;
    ctx.fillStyle = titleColor;
    ctx.fillText("UPTIME ROBOT", Math.floor(canvas.width * 0.08), Math.floor(canvas.height * 0.28));

    // uptime text
    const uptimeFontSize = Math.floor(Math.max(28, canvas.width * 0.06));
    ctx.font = `${uptimeFontSize}px UTM`;
    ctx.fillStyle = "#fdfdfd";
    ctx.fillText(`${z_1} : ${x_1} : ${y_1}`, Math.floor(canvas.width * 0.12), Math.floor(canvas.height * 0.39));

    // footer
    const footerFontSize = Math.floor(Math.max(18, canvas.width * 0.035));
    ctx.font = `${footerFontSize}px time`;
    ctx.fillText("@www.xsxx.com365", Math.floor(canvas.width * 0.15), Math.floor(canvas.height * 0.46));
    ctx.fillText("@MOHAMMAD-SHOUROV", Math.floor(canvas.width * 0.15), Math.floor(canvas.height * 0.51));

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    // Prepare message body
    const body = `┃======{ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗥𝗢𝗕𝗢𝗧 }======┃\n\n→ Bot worked ${hours} hours ${minutes} minutes ${seconds} seconds\n•━━━━━━━━━━━━━━━━━━━━━━━━•\n➠ 𝐊𝐈𝐍𝐆 𝐒𝐇𝐎𝐔𝐑𝐎𝐕\n➠ Bot Name: ${global.config.BOTNAME || "Bot"}\n➠ Bot Prefix: ${global.config.PREFIX}\n➠ Commands count: ${commands ? (commands.size || 0) : 0}\n➠ Total Users: ${global.data && global.data.allUserID ? global.data.allUserID.length : 0}\n➠ Total thread: ${global.data && global.data.allThreadID ? global.data.allThreadID.length : 0}\n➠ CPU in use: ${pidusage.cpu ? Number(pidusage.cpu).toFixed(1) : 0}%\n➠ RAM: ${pidusage.memory ? byte2mb(pidusage.memory) : '0 MB'}\n➠ Ping: ${Date.now() - timeStart}ms\n➠ Character ID: ${id}\n•━━━━━━━━━━━━━━━━━━━━━━━━•\n[ ${timeNow} ]`;

    // send message, cleanup in callback and finally
    await new Promise((resolve) => {
      api.sendMessage({
        body,
        attachment: fs.createReadStream(pathImg)
      }, event.threadID, (err, info) => {
        if (err) console.error("sendMessage error:", err);
        // best-effort cleanup
        try {
          if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
          if (fs.existsSync(pathAva)) fs.unlinkSync(pathAva);
        } catch (e) {
          console.warn("cleanup error:", e && e.message ? e.message : e);
        }
        resolve();
      }, event.messageID);
    });

  } catch (error) {
    console.error("uptime command error:", error && error.stack ? error.stack : error);
    return api.sendMessage("An error occurred while running uptime. Check console for details.", event.threadID, event.messageID);
  } finally {
    // ensure cleanup if anything left behind
    try {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      if (fs.existsSync(pathAva)) fs.unlinkSync(pathAva);
    } catch (e) {
      // nothing critical
    }
  }
};