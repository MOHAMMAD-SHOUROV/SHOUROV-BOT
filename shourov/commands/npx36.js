const axios = require("axios");

module.exports = {
  config: {
    name: "shourovlove99",
    version: "1.0.0",
    permission: 0,
    prefix: false,
    credits: "shourov",
    description: "Auto video when keyword used",
    category: "fun",
    cooldowns: 5
  },

  run: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const text = body.toLowerCase();
    const triggers = ["king", "shourov", "সৌরভ"];

    if (!triggers.some(t => text.includes(t))) return;

    try {
      const videoURL = "https://files.catbox.moe/8sctaw.mp4";
      const stream = await axios.get(videoURL, {
        responseType: "stream",
        timeout: 30000
      });

      api.sendMessage({
        body: "🖤 𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
        attachment: stream.data
      }, threadID, messageID);

    } catch (e) {
      api.sendMessage("ভিডিও পাঠানো যায়নি 😢", threadID, messageID);
    }
  }
};