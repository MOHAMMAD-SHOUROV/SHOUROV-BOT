const axios = require("axios");

module.exports.config = {
  name: "video2",
  version: "0.0.5",
  permission: 0,
  prefix: "awto",
  credits: "shourov (refactor by assistant)",
  description: "Random video",
  category: "user",
  usages: "",
  cooldowns: 5
};

const MENU = `====「 𝐕𝐈𝐃𝐄𝐎 」====\n━━━━━━━━━━━━━
1. LOVE VIDEO 💞
2. COUPLE VIDEO 💕
3. SHORT VIDEO 📽
4. SAD VIDEO 😔
5. STATUS VIDEO 📝
6. SHAIRI
7. BABY VIDEO 😻
8. ANIME VIDEO
9. HUMA IYUN / FORID SIR ❄
10. ISLAMIK VIDEO 🤲

===「 18+ VIDEO 」===
━━━━━━━━━━━━━
11. HORNY VIDEO 🥵
12. HOT 🔞
13. ITEM

Reply with the number (for example: 1) to pick a category.`;

module.exports.run = async function({ event, api }) {
  const { threadID, messageID, senderID } = event;

  try {
    const info = await new Promise((resolve, reject) => {
      api.sendMessage(MENU, threadID, (err, info) => {
        if (err) return reject(err);
        return resolve(info);
      }, messageID);
    });

    // register handleReply
    if (!global.client) global.client = {}; 
    if (!global.client.handleReply) global.client.handleReply = [];

    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: senderID,
      type: "video2" // custom type name
    });
  } catch (err) {
    console.error("video2: failed to send menu:", err);
    return api.sendMessage("❌ Failed to show menu. Try again later.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID } = event;
  try {
    // ensure only original author can respond (optional)
    if (handleReply && handleReply.author && handleReply.author != senderID) {
      return api.sendMessage("Only the user who opened the menu can select a category.", threadID, messageID);
    }

    const text = (event.body || "").trim();
    if (!/^\d+$/.test(text)) {
      return api.sendMessage("Please reply with a number (e.g. 1).", threadID, messageID);
    }

    const choice = text;
    const { axiosInstance, endpoint } = await _resolveEndpoint(choice);
    if (!endpoint) return api.sendMessage("That number is not available. Please choose a valid number from the menu.", threadID, messageID);

    // fetch JSON from API
    const apiRes = await axiosInstance.get(endpoint, { timeout: 15000 });
    if (!apiRes || !apiRes.data) return api.sendMessage("No data returned from the video API.", threadID, messageID);

    // expected shape: { data: "<video_url>", nayan: "<caption>", count: <num> }
    const videoUrl = apiRes.data.data || apiRes.data.url || null;
    const caption = apiRes.data.nayan || apiRes.data.caption || "";
    const count = apiRes.data.count || "unknown";

    if (!videoUrl) return api.sendMessage("Video URL not found in API response.", threadID, messageID);

    // HEAD check to get content-length and content-type (if server supports)
    let contentLength = null;
    try {
      const head = await axiosInstance.head(videoUrl, { timeout: 8000 }).catch(() => null);
      if (head && head.headers) {
        contentLength = head.headers['content-length'] ? Number(head.headers['content-length']) : null;
      }
    } catch (err) {
      // ignore HEAD failure — continue to GET but we'll enforce a max size
    }

    const MAX_BYTES = 30 * 1024 * 1024; // 30 MB limit (adjust as needed)
    if (contentLength && contentLength > MAX_BYTES) {
      return api.sendMessage(`The requested video is too large (${Math.round(contentLength / 1024 / 1024)} MB). Please choose another one.`, threadID, messageID);
    }

    // download the video as ArrayBuffer (safer cross-platform)
    const videoResp = await axiosInstance.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      // increase max content length to a safe guard in axios itself
      maxContentLength: MAX_BYTES + 1024
    });

    if (!videoResp || !videoResp.data) return api.sendMessage("Failed to download the video.", threadID, messageID);

    // final safety check on size
    const buffer = Buffer.from(videoResp.data);
    if (buffer.length > MAX_BYTES) {
      return api.sendMessage(`Downloaded video exceeds allowed size (${Math.round(buffer.length / 1024 / 1024)} MB).`, threadID, messageID);
    }

    // Compose body and send attachment
    const body = `${caption}\n\n¤《𝐓𝐎𝐓𝐀𝐋 𝐕𝐈𝐃𝐄𝐎: ${count}》¤`;
    // Depending on your API you might need: { body, attachment: fs.createReadStream(...) } or { body, attachment: buffer }
    // Most frameworks accept Buffer as 'attachment' directly
    return api.sendMessage({ body, attachment: buffer }, threadID, messageID);
  } catch (err) {
    console.error("video2 handleReply error:", err);
    return api.sendMessage("❌ An error occurred while fetching the video. Please try again later.", threadID, messageID);
  }
};

async function _resolveEndpoint(choice) {
  try {
    const axiosLocal = axios; // single axios instance
    const resp = await axiosLocal.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json", { timeout: 10000 });
    const base = resp && resp.data && resp.data.api ? resp.data.api : null;

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

    if (!base) return { axiosInstance: axiosLocal, endpoint: null };
    const route = options[choice];
    if (!route) return { axiosInstance: axiosLocal, endpoint: null };
    return { axiosInstance: axiosLocal, endpoint: `${base}${route}` };
  } catch (err) {
    console.error("linkanh error:", err);
    return { axiosInstance: axios, endpoint: null };
  }
}