// commands/video2.js
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "video2",
  version: "0.0.4",
  permission: 0,
  prefix: "awto",
  credits: "shourov",
  description: "Random video",
  category: "user",
  usages: "",
  cooldowns: 5
};

const MENU = `====「 𝐕𝐈𝐃𝐄𝐎 」====
━━━━━━━━━━━━━
1. LOVE VIDEO 💞
2. COUPLE VIDEO 💕
3. SHORT VIDEO 📽
4. SAD VIDEO 😔
5. STATUS VIDEO 📝
6. SHAIRI
7. BABY VIDEO 😻
8. ANIME VIDEO
9. HUMA IYUN FORID SIR ❄
10. ISLAMIK VIDEO 🤲

===「 18+ VIDEO 」===
━━━━━━━━━━━━━
11. HORNY VIDEO 🥵
12. HOT 🔞
13. ITEM

Tell me the video number you want by replying to this message.`;

module.exports.run = async function({ event, api, args }) {
  try {
    const { threadID, messageID, senderID } = event;
    // If no choice provided, show menu and register handleReply
    if (!args || !args[0]) {
      return api.sendMessage(
        MENU,
        threadID,
        (err, info) => {
          if (err) return;
          // register handle reply
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "create"
          });
        },
        messageID
      );
    }

    // If user provided a direct choice in args, treat it as immediate handling
    const choice = String(args[0]).trim();
    await handleChoice({ api, threadID, messageID, choice });
  } catch (err) {
    console.error("video2.run error:", err);
    try { api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID); } catch (e) {}
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  try {
    const { threadID, messageID, senderID } = event;
    // Only process replies for this command and only from original author
    if (!handleReply || handleReply.name !== this.config.name) return;
    if (handleReply.author != senderID) {
      return api.sendMessage("Only the user who opened the menu can reply to it.", threadID, messageID);
    }

    const body = (event.body || "").trim();
    if (!body) return api.sendMessage("Please reply with a number (1-13).", threadID, messageID);

    await handleChoice({ api, threadID, messageID, choice: body });
  } catch (err) {
    console.error("video2.handleReply error:", err);
    try { api.sendMessage("An error occurred when handling your reply.", event.threadID, event.messageID); } catch (e) {}
  }
};

/**
 * Fetch remote api.json, build endpoint from choice, fetch video, send file.
 * @param {Object} params
 * @param {Object} params.api - messaging API
 * @param {string} params.threadID
 * @param {string} params.messageID
 * @param {string} params.choice
 */
async function handleChoice({ api, threadID, messageID, choice }) {
  // allowed choices map
  const options = {
    "1": "/video/love",
    "2": "/video/cpl",
    "3": "/video/shortvideo",
    "4": "/video/sadvideo",
    "5": "/video/status",
    "6": "/video/shairi",
    "7": "/video/baby",
    "8": "/video/anime",
    "9": "/video/humaiyun",
    "10": "/video/islam",
    "11": "/video/horny",
    "12": "/video/hot",
    "13": "/video/item"
  };

  if (!options[choice]) {
    return api.sendMessage("Invalid choice. Please reply with a number between 1 and 13.", threadID, messageID);
  }

  // load remote API base
  let apiBase;
  try {
    const apis = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/shourovbot/main/api.json", { timeout: 10000 });
    apiBase = apis && apis.data && apis.data.api;
    if (!apiBase) throw new Error("api.json missing 'api' key");
  } catch (err) {
    console.error("Failed to load api.json:", err);
    return api.sendMessage("Failed to load video service configuration. Try again later.", threadID, messageID);
  }

  const endpoint = `${apiBase}${options[choice]}`;

  // Call remote endpoint for video metadata
  let meta;
  try {
    const resp = await axios.get(endpoint, { timeout: 15000 });
    if (!resp || !resp.data) throw new Error("No response data");
    // The API format in your original file suggests resp.data.data (video URL), resp.data.nayan (caption), resp.data.count (total)
    meta = resp.data;
  } catch (err) {
    console.error("Failed to fetch video metadata:", err);
    return api.sendMessage("Could not fetch video info from the service. Try again later.", threadID, messageID);
  }

  // Validate expected fields
  const videoUrl = meta.data; // expect this is a URL to the video file
  const caption = meta.nayan || "";
  const total = (typeof meta.count !== "undefined") ? meta.count : "";

  if (!videoUrl) {
    return api.sendMessage("Video URL not returned by the service.", threadID, messageID);
  }

  // Prepare cache folder and filepath
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const outFile = path.join(cacheDir, `video2_${Date.now()}.mp4`);

  // Download the video stream to file
  try {
    const downloadResp = await axios.get(videoUrl, { responseType: "stream", timeout: 60000 });
    const writer = fs.createWriteStream(outFile);
    await new Promise((resolve, reject) => {
      downloadResp.data.pipe(writer);
      let errored = false;
      writer.on("error", err => { errored = true; writer.close(); reject(err); });
      writer.on("close", () => { if (!errored) resolve(); });
    });

    // optional size check (e.g. avoid >100MB). adjust as necessary.
    const stats = await fs.stat(outFile);
    const maxBytes = 100 * 1024 * 1024; // 100 MB, change if needed by platform limits
    if (stats.size > maxBytes) {
      await fs.remove(outFile).catch(()=>{});
      return api.sendMessage("Downloaded file is too large to send.", threadID, messageID);
    }

    // send file as attachment with caption and count
    const body = `${caption}${total ? `\n\n¤《TOTAL VIDEO: ${total}》¤` : ""}`;
    await api.sendMessage({ body, attachment: fs.createReadStream(outFile) }, threadID, () => {
      // cleanup after sending
      fs.remove(outFile).catch((e)=>console.warn("Failed to remove temp file", outFile, e));
    }, messageID);

  } catch (err) {
    console.error("Error downloading or sending video:", err);
    // cleanup maybe partially written file
    try { await fs.remove(outFile); } catch(e){}
    return api.sendMessage("Failed to download or send the video. Please try another item.", threadID, messageID);
  }
}