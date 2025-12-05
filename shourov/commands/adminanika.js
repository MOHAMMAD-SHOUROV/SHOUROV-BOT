// commands/admin2.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
  name: "admin2",
  version: "1.0.0",
  permission: 0,
  credits: "shourov (fixed)",
  prefix: true,
  description: "Send profile info (admin2)",
  category: "admin",
  usages: "admin2",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, "1.png");
  const imageUrl = "https://i.postimg.cc/ZR66Rqhm/FB-IMG-1749804459214.jpg"; // original image URL from obfuscated code

  try {
    // ensure cache folder exists
    await fs.ensureDir(cacheDir);

    // download image (stream) to cache
    const response = await axios.get(imageUrl, { responseType: "stream", headers: { "User-Agent": "Mozilla/5.0" } });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    // wait until finished
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // uptime calculation
    const upSeconds = process.uptime();
    const hours = Math.floor(upSeconds / 3600);
    const minutes = Math.floor((upSeconds % 3600) / 60);
    const seconds = Math.floor(upSeconds % 60);

    const now = moment.tz("Asia/Dhaka").format("『D/MM/YYYY』 【hh:mm:ss】");

    const body = `
--------------------------------------------
𝐍𝐚𝐦𝐞       : ANIKA
𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : Angal Anika

𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧   : 𝐈𝐬𝐥𝐚𝐦

𝐏𝐞𝐫𝐦𝐚𝐧𝐞𝐧𝐭 𝐀𝐝𝐝𝐫𝐞𝐬𝐬: , Dhaka, Bangladesh

𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐀𝐝𝐝𝐫𝐞𝐬𝐬: Bola jabe na

𝐆𝐞𝐧𝐝𝐞𝐫.   : meye

𝐀𝐠𝐞           : 1+

𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩 : সৌরভ এর বউ

𝐖𝐨𝐫𝐤        : 𝐒𝐭𝐮𝐝𝐞𝐧𝐭

𝐆𝐦𝐚𝐢𝐥       : 
𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: 
𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦  : ওই সব বাল চালাই না😡

𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://m.facebook.com/61565028397928

⦿ 𝗕𝗼𝘁 𝗨ptime: ${hours}h ${minutes}m ${seconds}s
⦿ 𝗧𝗶𝗺𝗲: ${now}
--------------------------------------------
`.trim();

    // send message with attachment then remove file
    await api.sendMessage({ body, attachment: fs.createReadStream(filePath) }, threadID, () => {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    });

  } catch (err) {
    console.error("admin2 command error:", err && (err.stack || err));
    try {
      // if download failed, still send the text (without image)
      const now = moment.tz("Asia/Dhaka").format("『D/MM/YYYY』 【hh:mm:ss】");
      await api.sendMessage("Could not load profile image — sending info only.\n\nTime: " + now, threadID, messageID);
    } catch (e) { /* ignore */ }
  }
};