const request = require("request");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "rndm",
  version: "0.0.2",
  permission: 0,
  prefix: true,
  credits: "shourov",
  description: "rndm video",
  category: "user",
  usages: "name",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const nameParam = args.join(" ").trim();

  if (!nameParam) {
    const prefix = (global.config && global.config.PREFIX) ? global.config.PREFIX : "/";
    return api.sendMessage(
      `[ ! ] Input Name.\nEx: ${prefix}rndm nayan`,
      threadID,
      messageID
    );
  }

  try {
    // ensure cache dir exists
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // fetch api base from remote JSON (same as original)
    const apisRes = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
    const apiBase = apisRes.data && apisRes.data.api ? apisRes.data.api : null;
    if (!apiBase) throw new Error("API base not found in remote config.");

    const res = await axios.get(`${apiBase}/random?name=${encodeURIComponent(nameParam)}`);
    if (!res.data || !res.data.data) throw new Error("Invalid API response");

    const videoUrl = res.data.data.url;
    const name = res.data.data.name || "Unknown";
    const cp = res.data.data.cp || "";
    const ln = res.data.data.length || "0";

    const filePath = path.join(cacheDir, "video.mp4");

    // download video
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      request(videoUrl)
        .on("error", err => {
          try { writeStream.close(); } catch(e) {}
          reject(err);
        })
        .pipe(writeStream)
        .on("finish", () => resolve())
        .on("error", err => {
          try { writeStream.close(); } catch(e) {}
          reject(err);
        });
    });

    // send message with attachment
    const body = `${cp}\n\n𝐓𝐨𝐭𝐚𝐥 𝐕𝐢𝐝𝐞𝐨𝐬: [${ln}]\n𝐀𝐝𝐝𝐞𝐝 𝐓𝐡𝐢𝐬 𝐕𝐢𝐝𝐞𝐨 𝐓𝐨 𝐓𝐡𝐞 𝐀𝐩𝐢 𝐁𝐲 [${name}]`;
    await api.sendMessage(
      { body, attachment: fs.createReadStream(filePath) },
      threadID,
      messageID
    );

    // cleanup
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

  } catch (err) {
    console.error(err);
    return api.sendMessage("Something went wrong. Please try again later.", threadID, messageID);
  }
};