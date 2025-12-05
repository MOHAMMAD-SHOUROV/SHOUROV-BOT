// commands/info.js
module.exports.config = {
  name: "info",
  version: "1.0.1",
  permission: 0,
  credits: "(fixed by shourov)",
  prefix: true,
  description: "Show bot owner info with image",
  category: "prefix",
  usages: "info",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args, Users, Threads }) {
  const axios = global.nodemodule["axios"];
  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];
  const moment = require("moment-timezone");

  try {
    const { threadID, messageID, senderID } = event;

    // uptime
    const up = process.uptime();
    const hours = Math.floor(up / 3600);
    const minutes = Math.floor((up % 3600) / 60);
    const seconds = Math.floor(up % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    // owner info (get from global.config if available)
    const ownerName = (global.config && global.config.BOT_OWNER_NAME) ? global.config.BOT_OWNER_NAME : "Alihsan Shourov";
    const ownerContact = (global.config && global.config.BOT_OWNER_CONTACT) ? global.config.BOT_OWNER_CONTACT : "wa.me/+8801709281334";
    const ownerFacebook = (global.config && global.config.BOT_OWNER_FB) ? global.config.BOT_OWNER_FB : "https://www.facebook.com/shourov.sm24";
    const ownerEmail = (global.config && global.config.BOT_OWNER_EMAIL) ? global.config.BOT_OWNER_EMAIL : "shourovislam5430@gmail.com";

    // date/time in Asia/Dhaka
    const nowDhaka = moment.tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");

    // local cache path
    const cacheDir = __dirname + "/cache";
    const imgPath = cacheDir + "/info_image.jpg";

    // ensure cache dir exists
    fs.ensureDirSync(cacheDir);

    // remote image (fallback if failed)
    const imageUrl = "https://i.postimg.cc/Yq2H9kTC/Whats-App-Image-2025-11-12-at-12-07-50-bc11358f.jpg";

    // download image stream -> file
    await new Promise((resolve, reject) => {
      try {
        request(encodeURI(imageUrl))
          .pipe(fs.createWriteStream(imgPath))
          .on("close", resolve)
          .on("error", reject);
      } catch (e) {
        return reject(e);
      }
    });

    // message body (styled)
    const body = `--------------------------------------------
𝐍𝐚𝐦𝐞       :  ${ownerName}
𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 :  ${ownerFacebook}
𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧   :  Islam
𝐏𝐞𝐫𝐦𝐚𝐧𝐞𝐧𝐭 𝐀𝐝𝐝𝐫𝐞𝐬𝐬:  Debiganj, Panchagarh
𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐀𝐝𝐝𝐫𝐞𝐬𝐬:  Debiganj, Panchagarh

𝐆𝐞𝐧𝐝𝐞𝐫     :  Male
𝐀𝐠𝐞       :  18+
𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧𝐬𝐡𝐢𝐩 :  Single
𝐖𝐨𝐫𝐤      :  Student

𝐄𝐦𝐚𝐢𝐥     :  ${ownerEmail}
𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩  :  ${ownerContact}
𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫 :  ${ownerName}

⏱️ Bot uptime : ${uptimeStr}
🕒 Time (Dhaka) : ${nowDhaka}
--------------------------------------------`;

    // send with attachment; safely unlink after sending
    return api.sendMessage({
      body,
      attachment: fs.createReadStream(imgPath)
    }, threadID, (err, info) => {
      // attempt to remove file, ignore errors
      try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (e) {}
      if (err) {
        console.error("[info] sendMessage error:", err);
        return api.sendMessage("An error occurred while sending the info.", threadID, messageID);
      }
    }, messageID);

  } catch (error) {
    console.error("[info command] error:", error);
    try {
      return api.sendMessage("❗ An unexpected error occurred while executing the info command.", event.threadID, event.messageID);
    } catch (e) {}
  }
};