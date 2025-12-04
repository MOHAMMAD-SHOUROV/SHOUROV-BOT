const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
  name: "admin",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "Show admin profile with picture",
  category: "prefix",
  usages: "",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args, client, Users, Threads, __GLOBAL, Currencies }) {
  try {
    const axios = global.nodemodule && global.nodemodule["axios"];
    const requestLib = global.nodemodule && global.nodemodule["request"] || request;
    const fs = global.nodemodule && global.nodemodule["fs-extra"] || require("fs-extra");

    const time = process.uptime(),
      hours = Math.floor(time / (60 * 60)),
      minutes = Math.floor((time % (60 * 60)) / 60),
      seconds = Math.floor(time % 60);

    const moment = require("moment-timezone");
    const juswa = moment.tz("Asia/Dhaka").format("D/MM/YYYY 【HH:mm:ss】");

    const imagePath = __dirname + "/cache/1.png";
    const fbPicUrl = "https://graph.facebook.com/100071971474157/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

    // download image then send message
    const download = () => new Promise((resolve, reject) => {
      try {
        requestLib(encodeURI(fbPicUrl))
          .pipe(fs.createWriteStream(imagePath))
          .on("close", () => resolve())
          .on("error", err => reject(err));
      } catch (e) {
        reject(e);
      }
    });

    await download();

    const body = `
--------------------------------------------
Name       : ALIHSAN SHOUROV
Facebook   : ALIHSAN SHOUROV
Religion   : Islam
Permanent Address: Debiganj Panchagarh
Current Address  : Debiganj Panchagarh
Gender     : Male
Age        : 18+
Relationship: Single
Work       : Student
Gmail      : shourovislam5430@gmail.com
WhatsApp   : wa.me/+8801709281334
Telegram   : t.me/shourov_ss
Facebook Link: https://www.facebook.com/shourov.sm24
--------------------------------------------
`;

    await api.sendMessage({
      body: body,
      attachment: fs.createReadStream(imagePath)
    }, event.threadID, async (err) => {
      // try to remove file safely
      try {
        if (fs.existsSync(imagePath)) await fs.unlink(imagePath);
      } catch (e) {
        // ignore unlink errors
        console.warn("Could not remove temp image:", e && e.message ? e.message : e);
      }
      if (err) console.error(err);
    });

  } catch (err) {
    console.error("admin command error:", err && (err.stack || err));
    try {
      return api.sendMessage("❗ An error occurred while running the admin command.", event.threadID, event.messageID);
    } catch (e) { /* ignore */ }
  }
};