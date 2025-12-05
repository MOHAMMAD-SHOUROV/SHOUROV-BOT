const axios = require("axios");

// fetch base API URL
const baseApiUrl = async () => {
  try {
    const base = await axios.get(
      "https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
    );
    return base.data.xnil;
  } catch (e) {
    return null;
  }
};

module.exports.config = {
  name: "4k",
  aliases: ["remini", "enhance"],
  version: "1.0.2",
  permission: 0,
  prefix: true,
  credits: "xnil (fixed by shourov)",
  description: "Enhance image quality to 4K",
  category: "enhanced",
  usages: "Reply to a photo with: 4k",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  try {
    const reply = event.messageReply;
    const attachment = reply?.attachments?.[0];

    // Check reply validity
    if (!reply || !attachment) {
      return api.sendMessage(
        "📸 **Please reply to a PHOTO to enhance it.**",
        event.threadID,
        event.messageID
      );
    }

    // Only allow images
    if (attachment.type !== "photo") {
      return api.sendMessage(
        "❌ **This command works only with photos!**",
        event.threadID,
        event.messageID
      );
    }

    const imageURL = attachment.url;

    // Fetch base API
    const baseURL = await baseApiUrl();
    if (!baseURL) {
      return api.sendMessage(
        "❌ API unavailable. Please try again later.",
        event.threadID,
        event.messageID
      );
    }

    const apiUrl = `${baseURL}/xnil/remini?imageUrl=${encodeURIComponent(
      imageURL
    )}`;

    // Request enhanced image stream
    const enhancedStream = await axios.get(apiUrl, {
      responseType: "stream"
    });

    api.sendMessage(
      {
        body: "✨ **Your enhanced 4K image is ready!**",
        attachment: enhancedStream.data
      },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error("4K Error:", err);
    api.sendMessage(
      `❌ Error: ${err.message}`,
      event.threadID,
      event.messageID
    );
  }
};