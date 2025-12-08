const request = require("request");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "random",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "Nayan | Fixed by Shourov",
  description: "Send a random video from API",
  category: "user",
  usages: "random",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, config, language, Users, Threads }) {
  const { threadID, messageID } = event;
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, `random_${threadID}.mp4`);

  try {
    // ensure cache dir exists
    await fs.ensureDir(cacheDir);

    // load API base from remote JSON
    const apis = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json");
    const apiBase = apis.data.api;
    if (!apiBase) throw new Error("API base URL not found");

    // request random video metadata
    const res = await axios.get(`${apiBase}/video/mixvideo`);
    if (!res.data) throw new Error("Invalid response from video API");

    // support both shapes: either { url: "...", cp, length } or { data: { url: ..., ... } }
    const data = res.data.data || res.data;
    // if url is nested
    const videoObj = data.url && typeof data.url === "object" ? data.url : data;
    const videoUrl = videoObj.url || videoObj.video || videoObj;
    const cp = data.cp || res.data.cp || "";
    const ln = data.length || res.data.length || "";

    if (!videoUrl) throw new Error("Video URL not provided by API");

    // download video stream to cache
    await new Promise((resolve, reject) => {
      const stream = request(videoUrl).pipe(fs.createWriteStream(filePath));
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    // send message with attachment
    await api.sendMessage({
      body: `${cp}\n\n𝐓𝐨𝐭𝐚𝐥 𝐕𝐢𝐝𝐞𝐨𝐬: [${ln}]\n𝐀𝐝𝐝𝐞𝐝 𝐓𝐡𝐢𝐬 𝐕𝐢𝐝𝐞𝐨 𝐓𝐨 𝐓𝐡𝐞 𝐀𝐏𝐈`,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

  } catch (err) {
    console.error("random command error:", err && (err.stack || err.message));
    return api.sendMessage("❗ Failed to fetch/send video. Please try again later.", threadID, messageID);
  } finally {
    // cleanup file if exists
    try {
      if (await fs.pathExists(filePath)) await fs.unlink(filePath);
    } catch (e) {
      console.warn("Cleanup failed:", e && e.message);
    }
  }
};