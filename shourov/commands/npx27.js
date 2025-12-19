const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "npx27",
  version: "1.0.3",
  prefix: false,
  permission: 0,
  credits: "nayan (fixed by shourov)",
  description: "Emoji trigger video reply",
  category: "no prefix",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  // trigger emojis
  const triggers = ["👻", "😈"];
  if (!triggers.some(e => body.includes(e))) return;

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const videoPath = path.join(cacheDir, "npx27.mp4");

  try {
    // download video if not exists
    if (!fs.existsSync(videoPath)) {
      const res = await axios.get(
        "https://files.catbox.moe/1bx2l9.mp4",
        { responseType: "arraybuffer", timeout: 30000 }
      );
      fs.writeFileSync(videoPath, Buffer.from(res.data));
    }

    api.sendMessage(
      {
        body: "𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓 👻",
        attachment: fs.createReadStream(videoPath)
      },
      threadID,
      (err, info) => {
        if (!err && info?.messageID) {
          api.setMessageReaction("😓", info.messageID, () => {}, true);
        }
      },
      messageID
    );

  } catch (err) {
    console.error("npx27 error:", err);
    api.sendMessage("❌ ভিডিও পাঠানো যায়নি!", threadID, messageID);
  }
};

module.exports.start = function () {
  console.log("[npx27] Ready (emoji trigger)");
};