const axios = require("axios");

module.exports = {
  config: {
    name: "shourovlove99",
    version: "1.0.2",
    prefix: false,
    permission: 0,          // fixed typo: permssion -> permission
    credits: "shourov",
    description: "Trigger-based love video by keyword",
    category: "no prefix",
    usages: "auto-response",
    cooldowns: 5,
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    try {
      const lowerText = body.toLowerCase();
      const triggers = ["shourov", "সৌরভ", "king", "shourov", "shourov"]; // kept original intent (duplicates harmless)

      if (!triggers.some(word => lowerText.includes(word))) return;

      // keep list expandable, removed the 'img]' typo and added a fallback valid link array
      const videoList = [
        "https://i.imgur.com/23eTYBu.mp4",
        "https://files.catbox.moe/8sctaw.mp4",
        "https://files.catbox.moe/omt6x5.mp4"
      ];

      // choose a random video
      const videoURL = videoList[Math.floor(Math.random() * videoList.length)];

      // fetch stream
      const response = await axios.get(videoURL, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });

      const msg = {
        body: "🖤 𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
        attachment: response.data
      };

      // send message and react if possible
      api.sendMessage(msg, threadID, (err) => {
        if (err) {
          console.error("Send message error:", err);
        }
        if (messageID) {
          try {
            api.setMessageReaction("😓", messageID, () => {}, true);
          } catch (e) {
            // ignore reaction errors
          }
        }
      });

    } catch (err) {
      console.error("❌ Video fetch failed:", err && err.message ? err.message : err);
      try {
        api.sendMessage("⚠️ ভিডিও পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো!", threadID, messageID);
      } catch (e) {
        // ignore
      }
    }
  },

  start: function () {
    // Initialization if needed
  }
};