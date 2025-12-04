const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");
const https = require("https");

module.exports.config = {
  name: "auto",
  version: "1.0.1",
  permission: 0,
  credits: "Mahabub",
  description: "Auto video downloader",
  prefix: false,
  category: "User",
  cooldowns: 5
};

// 🔥 Auto video detection system
module.exports.handleEvent = async ({ api, event }) => {
  try {
    const content = event.body ? event.body.trim() : '';
    if (!content.startsWith("https://")) return; // শুধু লিংক detect করবে

    const videoLink = content;
    const threadID = event.threadID;
    const messageID = event.messageID;

    api.setMessageReaction("🔍", messageID, () => {}, true);

    const isFacebook = videoLink.includes("facebook.com");

    const headers = isFacebook
      ? {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "*/*",
          "Referer": "https://www.facebook.com/"
        }
      : { "User-Agent": "Mozilla/5.0" };

    const httpsAgent = isFacebook ? new https.Agent({ family: 4 }) : undefined;

    // 🔗 Get API base URL dynamically
    const jsonRes = await axios.get(
      "https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/main/APIURL.json"
    );
    const apiBaseURL = jsonRes.data.Alldl;

    // 📡 Call API
    const response = await axios.get(
      `${apiBaseURL}${encodeURIComponent(videoLink)}`,
      { headers, httpsAgent }
    );

    const { platform, title, hd, sd } = response.data;
    const downloadURL = hd || sd;

    if (!downloadURL) {
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage("❌ Could not fetch video link from the URL.", threadID, messageID);
    }

    const filePath = __dirname + "/cache/auto.mp4";

    // 📥 Download the file
    request({ url: downloadURL, headers })
      .pipe(fs.createWriteStream(filePath))
      .on("close", async () => {
        api.setMessageReaction("✔️", messageID, () => {}, true);
        await api.sendMessage(
          {
            body: `✅ 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗱!\n\n📌 Platform: ${platform || "Unknown"}\n🎬 Title: ${title || "No Title"}\n📥 Quality: ${hd ? "HD" : "SD"}`,
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          () => fs.unlinkSync(filePath)
        );
      })
      .on("error", (err) => {
        console.error("File Write Error:", err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("❌ Error fetching video file.", threadID, messageID);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
  } catch (err) {
    console.error("Error:", err.response?.data || err.message || err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

// 🧠 Manual command trigger (optional)
module.exports.run = async ({ api, event }) => {
  api.sendMessage("📥 Send a video link (https://) to auto-download 🎥", event.threadID, event.messageID);
};
