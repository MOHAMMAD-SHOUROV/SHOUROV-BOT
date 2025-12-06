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

module.exports.run = async function({ event, api, args }) {
  const threadID = event.threadID;
  const senderID = event.senderID;

  const menu = `====「 𝐕𝐈𝐃𝐄𝐎 」====\n━━━━━━━━━━━━━
𝟙. 𝐋𝐎𝐕𝐄 𝐕𝐈𝐃𝐄𝐎 💞
𝟚. 𝐂𝐎𝐔𝐏𝐋𝐄 𝐕𝐈𝐃𝐄𝐎 💕
𝟛. 𝐒𝐇𝐎𝐑𝐓 𝐕𝐈𝐃𝐄𝐎 📽
𝟜. 𝐒𝐀𝐃 𝐕𝐈𝐃𝐄𝐎 😔
𝟝. 𝐒𝐓𝐀𝐓𝐔𝐒 𝐕𝐈𝐃𝐄𝐎 📝
𝟞. 𝐒𝐇𝐀𝐈𝐑𝐈
𝟟. 𝐁𝐀𝐁𝐘 𝐕𝐈𝐃𝐄𝐎 😻
𝟠. 𝐀𝐍𝐈𝐌𝐄 𝐕𝐈𝐃𝐄𝐎
𝟡. 𝐇𝐔𝐌𝐀𝐈𝐘𝐔𝐍 𝐅𝐎𝐑𝐈𝐃 𝐒𝐈𝐑 ❄
𝟙𝟘. 𝐈𝐒𝐋𝐀𝐌𝐈𝐊 𝐕𝐈𝐃𝐄𝐎 🤲

===「 𝟏𝟖+ 𝐕𝐈𝐃𝐄𝐎 」===
━━━━━━━━━━━━━
𝟙𝟙. 𝐇𝐎𝐑𝐍𝐘 𝐕𝐈𝐃𝐄𝐎 🥵
𝟙𝟚. 𝐇𝐎𝐓 🔞
𝟙𝟛. 𝐈𝐓𝐄𝐌

Tell me which video number you want to see by replying to this message.`;

  return api.sendMessage(menu, threadID, (err, info) => {
    if (err) {
      console.error("video2: failed to send menu:", err);
      return;
    }
    // push handleReply so next reply is handled by this module
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: senderID,
      type: "create"
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  try {
    const replyText = (event.body || "").trim();
    if (!replyText) return api.sendMessage("Please type a number (e.g. 1).", event.threadID, event.messageID);

    // allow only pure number input (like "1" or "10")
    if (!/^\d+$/.test(replyText)) {
      return api.sendMessage("Invalid input — please reply with the number of the video category (e.g. 1).", event.threadID, event.messageID);
    }

    const choice = replyText;
    const { p: axiosInstance, h: endpoint } = await linkanh(choice);

    if (!endpoint) {
      return api.sendMessage("That number is not available. Please choose a valid number from the menu.", event.threadID, event.messageID);
    }

    // fetch the api route
    const response = await axiosInstance.get(endpoint, { timeout: 15000 });
    if (!response || !response.data) {
      return api.sendMessage("No data returned from the video API.", event.threadID, event.messageID);
    }

    // expected shape: { data: "<video_url>", nayan: "<caption>", count: <num> }
    const videoUrl = response.data.data;
    const caption = response.data.nayan || "";
    const count = response.data.count || "unknown";

    if (!videoUrl) {
      return api.sendMessage("Video URL not found in API response.", event.threadID, event.messageID);
    }

    // download the video as stream and send as attachment
    const videoStreamResp = await axiosInstance.get(videoUrl, { responseType: "stream", timeout: 30000 });
    const stream = videoStreamResp.data;

    const body = `${caption}\n\n¤《𝐓𝐎𝐓𝐀𝐋 𝐕𝐈𝐃𝐄𝐎: ${count}》¤`;
    return api.sendMessage({ body, attachment: stream }, event.threadID, event.messageID);
  } catch (err) {
    console.error("video2 handleReply error:", err);
    return api.sendMessage("❌ An error occurred while fetching the video. Please try again later.", event.threadID, event.messageID);
  }
};

async function linkanh(choice) {
  try {
    const axiosLocal = require("axios");
    const apis = await axiosLocal.get("https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json", { timeout: 10000 });
    const base = apis.data && apis.data.api ? apis.data.api : null;
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

    if (!base) return { p: axiosLocal, h: null };
    const route = options[choice];
    if (!route) return { p: axiosLocal, h: null };
    const url = `${base}${route}`;
    return { p: axiosLocal, h: url };
  } catch (err) {
    console.error("linkanh error:", err);
    return { p: require("axios"), h: null };
  }
        }
