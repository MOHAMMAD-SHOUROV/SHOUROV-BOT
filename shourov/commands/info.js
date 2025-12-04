module.exports.config = {
  name: "admin",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  prefix: true,
  description: "",
  category: "prefix",
  usages: "",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args, client, Users, Threads, __GLOBAL, Currencies }) {
  try {
    // prefer global.nodemodule if available, otherwise require
    const axios = (global.nodemodule && global.nodemodule["axios"]) ? global.nodemodule["axios"] : require("axios");
    const request = (global.nodemodule && global.nodemodule["request"]) ? global.nodemodule["request"] : require("request");
    const fs = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
    const path = require("path");
    const moment = require("moment-timezone");

    // uptime / time info (if you want to include)
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const juswa = moment.tz("Asia/Dhaka").format("D/MM/YYYY 【hh:mm:ss】");

    // prepare cache dir
    const cacheDir = path.join(__dirname, "cache");
    try { if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true }); } catch(e){}

    const outPath = path.join(cacheDir, "1.png");
    const fbId = "100071971474157";
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; // keep same token usage as before

    const picUrl = `https://graph.facebook.com/${fbId}/picture?height=720&width=720&access_token=${token}`;

    const downloadAndSend = () => {
      return new Promise((resolve, reject) => {
        try {
          const writeStream = fs.createWriteStream(outPath);
          request(encodeURI(picUrl))
            .on("error", err => {
              // fallback: try axios download
              writeStream.close();
              return reject(err);
            })
            .pipe(writeStream)
            .on("close", () => resolve(true))
            .on("error", err => reject(err));
        } catch (e) {
          reject(e);
        }
      });
    };

    try {
      await downloadAndSend();
    } catch (err) {
      // fallback: try axios
      try {
        const resp = await axios.get(picUrl, { responseType: "arraybuffer", timeout: 10000 }).catch(()=>null);
        if (resp && resp.data) {
          fs.writeFileSync(outPath, Buffer.from(resp.data));
        } else {
          // if both fail, send text-only message
          return api.sendMessage("⚠️ প্রোফাইল ছবি ডাউনলোড করতে পারিনি — তবে তথ্য পাঠাচ্ছি।", event.threadID);
        }
      } catch (e) {
        return api.sendMessage("⚠️ প্রোফাইল ছবি ডাউনলোড করতে সমস্যা হয়েছে।", event.threadID);
      }
    }

    // callback message body
    const bodyText = `
--------------------------------------------
Name           : AlIHSAN SHOUROV
Facebook       : AlIHSAN SHOUROV
Religion       : Islam
Permanent Addr : Debiganj Panchagarh
Current Addr   : Debiganj Panchagarh
Gender         : Male
Age            : 18+
Relationship   : Single
Work           : Student
Gmail          : shourovislam5430@gmail.com
WhatsApp       : wa.me/+8801709281334
Telegram       : t.me/shourov_ss
Facebook Link  : https://www.facebook.com/shourov.sm24
--------------------------------------------
Time (Dhaka)   : ${juswa}
Uptime         : ${hours}h ${minutes}m ${seconds}s
`;

    // send message with attachment
    try {
      await api.sendMessage({ body: bodyText, attachment: fs.createReadStream(outPath) }, event.threadID);
    } catch (e) {
      // if send with attachment fails, try send text-only
      console.warn("admin: send with attachment failed:", e && e.message);
      await api.sendMessage(bodyText, event.threadID);
    }

    // cleanup file (best-effort)
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch(e){}

  } catch (err) {
    console.error("admin command error:", err && (err.stack || err));
    try { await api.sendMessage("⚠️ Command চালাতে সমস্যা হয়েছে। লগ চেক করো।", event.threadID); } catch(e) {}
  }
};
