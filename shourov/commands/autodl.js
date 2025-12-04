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

// ================================
// 🔥 Auto event trigger (NO prefix)
// ================================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const body = event.body?.trim() || "";
    if (!body.startsWith("https://")) return;

    // detect only http links
    const videoLink = body;
    await module.exports.run({ api, event, args: [videoLink] }); // <-- important
  } catch (err) {
    console.error("auto.handleEvent ERROR:", err);
  }
};

// ================================
// 🧠 Actual command logic (RUN MUST EXIST)
// ================================
module.exports.run = async function ({ api, event, args }) {
  try {
    const videoLink = args[0];
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!videoLink || !videoLink.startsWith("https://")) {
      return api.sendMessage("❌ Please send a valid video URL.", threadID, messageID);
    }

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

    // 🔗 Fetch API base URL
    const apiJSON = await axios.get(
      "https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/main/APIURL.json"
    );

    const apiBase = apiJSON.data.Alldl;

    // 📡 Call downloader API
    const res = await axios.get(
      `${apiBase}${encodeURIComponent(videoLink)}`,
      { headers, httpsAgent }
    );

    const { platform, title, hd, sd } = res.data;
    const downloadURL = hd || sd;

    if (!downloadURL) {
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage("❌ Could not fetch video download URL.", threadID, messageID);
    }

    const filePath = __dirname + "/cache/auto.mp4";

    // 📥 Download video
    request({ url: downloadURL, headers })
      .pipe(fs.createWriteStream(filePath))
      .on("close", async () => {
        api.setMessageReaction("✔️", messageID, () => {}, true);

        await api.sendMessage(
          {
            body: `✅ Downloaded!\n\n📌 Platform: ${platform || "Unknown"}\n🎬 Title: ${title || "No Title"}\n📥 Quality: ${hd ? "HD" : "SD"}`,
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          () => fs.unlinkSync(filePath)
        );
      })
      .on("error", err => {
        console.error("Download Error:", err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.sendMessage("❌ Error downloading video.", threadID, messageID);
      });

  } catch (err) {
    console.error("auto.run ERROR:", err.response?.data || err.message || err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
