'use strict';

module.exports.config = {
  name: "removebg",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Remove background from a replied photo (remove.bg API)",
  prefix: true,
  category: "image",
  usages: "reply",
  cooldowns: 10,
  dependencies: {
    "form-data": "",
    "image-downloader": "",
    "fs-extra": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const path = require("path");
  const FormData = global.nodemodule["form-data"] || require("form-data");
  const imageDownloader = global.nodemodule["image-downloader"] || require("image-downloader");
  const axios = global.nodemodule["axios"] || require("axios");
  const moment = global.nodemodule["moment-timezone"] || require("moment-timezone");

  try {
    // ensure reply
    if (event.type !== "message_reply") {
      return api.sendMessage("[⚜️]➜ You must reply to a photo", event.threadID, event.messageID);
    }

    const replied = event.messageReply;
    if (!replied || !Array.isArray(replied.attachments) || replied.attachments.length === 0) {
      return api.sendMessage("[⚜️]➜ You must reply to a photo", event.threadID, event.messageID);
    }

    const att = replied.attachments[0];
    if (att.type !== "photo") {
      return api.sendMessage("[⚜️]➜ This is not an image. Reply to a photo.", event.threadID, event.messageID);
    }

    // prepare cache path
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const inputPath = path.join(cacheDir, `removebg_${Date.now()}.png`);

    // download original
    await imageDownloader.image({ url: att.url, dest: inputPath });

    // API keys pool — replace/add your own keys here
    const KeyApi = [
      "qReKoWSpkMAi2vbi6RUEHctA",
      "ho37vvCUppqTKcyfjbLXnt4t",
      "ytr2ukWQW2YrXV8dshPbA8cE"
    ];
    const apiKey = KeyApi[Math.floor(Math.random() * KeyApi.length)];

    // prepare multipart/form-data
    const form = new FormData();
    form.append("size", "auto");
    form.append("image_file", fs.createReadStream(inputPath), path.basename(inputPath));

    // call remove.bg
    const res = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: form,
      responseType: "arraybuffer",
      headers: {
        ...form.getHeaders(),
        "X-Api-Key": apiKey
      },
      timeout: 30000
    }).catch(err => {
      // forward detailed error for debugging but reply friendly to user
      console.error("remove.bg request error:", err && err.response ? err.response.data : err.message);
      throw err;
    });

    if (!res || res.status !== 200 || !res.data) {
      throw new Error(`remove.bg returned status ${res ? res.status : "unknown"}`);
    }

    // save output (overwriting original file)
    await fs.writeFile(inputPath, Buffer.from(res.data));

    // send result
    const time = moment.tz("Asia/Dhaka").format("HH:mm:ss D/MM/YYYY");
    const caption = `🖼️=== [ REMOVING BACKGROUND ] ===🖼️\n━━━━━━━━━━━━━━━\n[⚜️]➜ Api By MOHAMMAD NAYAN\n[⏰] ${time}`;
    await api.sendMessage({ body: caption, attachment: fs.createReadStream(inputPath) }, event.threadID, () => {
      // cleanup
      try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
    });

  } catch (error) {
    console.error("removebg command failed:", error && (error.stack || error.message));
    // Friendly message to user
    return api.sendMessage("[⚜️]➜ Nayan Server Is Busy Now or the image could not be processed. Try again later.", event.threadID, event.messageID);
  }
};