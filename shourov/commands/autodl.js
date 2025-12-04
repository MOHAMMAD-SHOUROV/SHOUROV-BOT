const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");
const https = require("https");

module.exports.config = {
  name: "auto",
  version: "1.0.2",
  permission: 0,
  credits: "Mahabub",
  description: "Auto video downloader",
  prefix: false,
  category: "User",
  cooldowns: 5
};

// ===============================
// 🔥 handleEvent (auto detect link)
// ===============================
module.exports.handleEvent = async function ({ api, event, args }) {
  try {
    let { body, threadID, messageID } = event;
    if (!body || typeof body !== "string") return;

    body = body.trim();
    if (!body.startsWith("https://")) return;   // শুধু https লিংক নেবে

    // *** WAIT, CHECK BAN / APPROVAL / ADMIN RULES ***
    const { PREFIX, ADMINBOT, OPERATOR, approval } = global.config;
    const { APPROVED } = global.approved;

    // auto cmd always will run without prefix BUT still must respect approval rules
    if (approval && !APPROVED.includes(threadID) && !OPERATOR.includes(event.senderID) && !ADMINBOT.includes(event.senderID)) {
      return; // silently ignore for unapproved threads
    }

    // ==========================
    // 🔍 Detect video platform
    // ==========================
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const videoLink = body;
    const isFacebook = videoLink.includes("facebook.com");

    const headers = isFacebook
      ? {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "*/*",
          "Referer": "https://www.facebook.com/"
        }
      : { "User-Agent": "Mozilla/5.0" };

    const httpsAgent = isFacebook ? new https.Agent({ family: 4 }) : undefined;

    // ==========================
    // 📡 Fetch API URL dynamically
    // ==========================
    const json = await axios.get(
      "https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/main/APIURL.json"
    );
    const apiURL = json.data.Alldl;

    // ==========================
    // 🌐 Request video info
    // ==========================
    const data = await axios.get(
      `${apiURL}${encodeURIComponent(videoLink)}`,
      { headers, httpsAgent }
    );

    const { platform, title, hd, sd } = data.data;
    const downloadURL = hd || sd;

    if (!downloadURL) {
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage(`❌ No download link found for:\n${videoLink}`, threadID, messageID);
    }

    // ==========================
    // 📥 Download video file
    // ==========================
    const filePath = __dirname + "/cache/auto.mp4";

    request({ url: downloadURL, headers })
      .pipe(fs.createWriteStream(filePath))
      .on("close", async () => {
        api.setMessageReaction("✔️", messageID, () => {}, true);

        await api.sendMessage(
          {
            body: `🎥 𝗔𝘂𝘁𝗼-𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿\n\n📌 Platform: ${platform || "Unknown"}\n🎬 Title: ${title || "No Title"}\n📥 Quality: ${hd ? "HD" : "SD"}`,
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          () => fs.unlinkSync(filePath)
        );
      })
      .on("error", (err) => {
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("❌ Error downloading video.", threadID, messageID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    console.log("Auto Error:", err.response?.data || err.message || err);
  }
};


// ===============================
// 🧠 Manual command trigger
// ===============================
module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    "📥 Just send a video link (https://) in chat and I will auto download it 🎥",
    event.threadID,
    event.messageID
  );
};
