const axios = require("axios");
const request = require("request");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "Gf",
  version: "1.0.0",
  permssion: 0,
  credits: "shourov",
  prefix: true,
  description: "auto reply with a random GF image+text when someone types 'gf de'",
  category: "Media",
  usages: "gf",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

const IMAGES = [
  "https://i.imgur.com/Mv5zu3h.jpeg",
  "https://i.imgur.com/yxoOd8o.jpeg",
  "https://i.imgur.com/HSFylAY.jpeg",
  "https://i.imgur.com/IC9zjVq.jpeg",
  "https://i.imgur.com/r0Ksgwm.jpeg",
  "https://i.imgur.com/QD6L0XW.jpeg",
  "https://i.imgur.com/b8GBQF3.jpeg",
  "https://i.imgur.com/b4RwCkO.jpeg",
  "https://i.imgur.com/39q1VO3.jpeg",
  "https://i.imgur.com/nasSwNe.jpeg",
  "https://i.imgur.com/nriKSE9.jpeg",
  "https://i.imgur.com/Dt6Cokc.jpeg",
  "https://i.imgur.com/tUIrO6n.jpeg",
  "https://i.imgur.com/llyOW3C.jpeg",
  "https://i.imgur.com/flUAZT0.jpeg"
];

const MESSAGES = [
  "༊༎এই নে তোর Gf খুশি থাক, তাও বারবাতারির পিছে ঘুরিস না─༅༎•😁😹༅༎•\n\nhttps://www.facebook.com/profile.php?id=61556802683200\n\nCreate :𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "⎯͢⎯⃝─•💙᭄🌸এই নে তোরে Gf দিলাম আজ থেকে বুইড়া বুইড়া বেডি গুলার দিকে আর তাকাইস না-|ღ᭄😌\n\nhttps://www.facebook.com/profile.php?id=61554669535546\n\nCreate: 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "︵❝།།💖🌸নে তোর Gf  আজ থেকে আর হারাম কাজ করিস না....!🖤🤲📿\n\n https://www.facebook.com/profile.php?id=61550013184286\n\n Create : 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "𝄞⋆⃝✿এই নে তোকে Gf দিছি আজ থেকে আর খারাপ কাজ করিস নাহ-!!✨💜\n\n https://www.facebook.com/profile.php?id=100051887470664\n\n Create : 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "ღ᭄✨🍓>-এই নে তোর GF এখন থেকে পাঁচ ওয়াক্ত নামাজ পরবি_______😾🦋࿐\n\nhttps://www.facebook.com/profile.php?id=100090693041400\n\n Create :𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "___ღ❥︎🦋💚ツ༉এই নে তোরে Gf দিছি তাও লুচ্চামি করা বন্ধ কর ꨄ︎⁂༄🤟🤟🖤\n\nhttps://www.facebook.com/profile.php?id=61551683098060\n\nCreate  :𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "༄⁂🤍♡︎এই নে তরে Gf দিয়ে বাচাইয়া দিছি-!!😹\nএখন থেকে আর কোনো গ্রুপ ঝাইয়া কান্দিস না︵🦋❤️‍🩹🤧\n\nhttps://www.facebook.com/profile.php?id=61556143877986\n\nCreate : 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "༊❝এই নে তোর Gf আজকের পর থেকে কোনো মেয়েদের দিকে তাকালে ঘুসি দিয়ে তোর নাক ফাটিয়ে ফেলবো-!! 😾👊༆᭄\n\nhttps://www.facebook.com/profile.php?id=100053703274735\n\nCreate : 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "❞༎༊এই নে তোরে Gf দিলাম চিন্তা করিস না খুব সুখে রাখবে তোরে কান্দিস নাহ আর-!!🤧🫣࿐🌚🐸\n\nhttps://www.facebook.com/profile.php?id=100058442987622\n\nCreate : 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  "༆᭄😐__এই নে তোর Gf একে নিয়ে তরা জীবনটা কে সুন্দর করে তোল⋆⃝𝄞✿🦋༊࿐\n\nhttps://www.facebook.com/profile.php?id=100085229498324\n\nCreate : 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯"
];

const CACHE_FILE = path.join(__dirname, "/cache/gf.jpg");

module.exports.handleEvent = async ({ api, event, Threads }) => {
  try {
    if (!event || !event.body) return;
    const text = event.body.toString().trim();
    const lower = text.toLowerCase();

    // trigger phrase (starts with)
    if (!lower.startsWith("gf de")) return;

    // check thread setting (default: true)
    const threadData = (await Threads.getData(event.threadID)) || {};
    const data = threadData.data || {};
    if (typeof data.gf !== "undefined" && data.gf === false) return; // disabled in this thread

    // pick random image and message
    const img = IMAGES[Math.floor(Math.random() * IMAGES.length)];
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    // ensure cache dir
    await fs.ensureDir(path.join(__dirname, "cache"));

    // download image (use request stream)
    await new Promise((resolve, reject) => {
      try {
        request(encodeURI(img))
          .pipe(fs.createWriteStream(CACHE_FILE))
          .on("close", () => resolve())
          .on("error", err => reject(err));
      } catch (e) {
        return reject(e);
      }
    });

    // send message with attachment then cleanup
    return api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(CACHE_FILE)
    }, event.threadID, () => {
      try { if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE); } catch (e) {}
    }, event.messageID);

  } catch (err) {
    console.error("Gf handleEvent error:", err);
  }
};

module.exports.languages = {
  "vi": { "on": "on", "off": "off", "successText": "🧠" },
  "en": { "on": "on", "off": "off", "successText": "success!" }
};

// toggle command: /gf  -> enable/disable in this thread (stored in Threads data)
module.exports.run = async ({ api, event, Threads, getText }) => {
  try {
    const { threadID, messageID } = event;
    const threadData = (await Threads.getData(threadID)) || {};
    const data = threadData.data || {};

    // toggle gf flag (default true)
    if (typeof data.gf === "undefined") data.gf = true;
    data.gf = !data.gf;

    await Threads.setData(threadID, { data });
    global.data.threadData.set(threadID, data);

    const reply = (data.gf ? getText("vi")?.on || "on" : getText("vi")?.off || "off") + " " + (getText("vi")?.successText || "success!");
    return api.sendMessage(reply, threadID, messageID);
  } catch (err) {
    console.error("Gf run error:", err);
    return api.sendMessage("An error occurred.", event.threadID, event.messageID);
  }
};