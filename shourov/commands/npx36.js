const axios = require("axios");

module.exports = {
  config: {
    name: "shourovlove99",
    version: "1.0.2",
    prefix: false,
    permission: 0,
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
      const lowerText = String(body).toLowerCase();

      // triggers (একবারেই যথেষ্ট — duplicate রাখার দরকার নেই)
      const triggers = ["shourov", "সৌরভ", "king"];

      if (!triggers.some(word => lowerText.includes(word))) return;

      // ভিডিও লিঙ্কগুলোর তালিকা — প্রয়োজন হলে আরও যোগ/বদল করুন
      const videoList = [
        "https://i.imgur.com/23eTYBu.mp4",
        "https://files.catbox.moe/8sctaw.mp4",
        "https://files.catbox.moe/omt6x5.mp4"
      ];

      // র‍্যান্ডম ভিডিও বেছে নিন
      const videoURL = videoList[Math.floor(Math.random() * videoList.length)];

      // স্ট্রিম আকারে ডাউনলোড
      const response = await axios.get(videoURL, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });

      const msg = {
        body: "🖤 𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 🖤",
        attachment: response.data
      };

      // মেসেজ পাঠান এবং সম্ভব হলে রিয়্যাকশন দিন (best-effort)
      api.sendMessage(msg, threadID, (err) => {
        if (err) {
          console.error("[shourovlove99] sendMessage error:", err);
          // ব্যর্থ হলে ছোট টেক্সট রিপ্লাই দিতে পারেন:
          try { api.sendMessage("⚠️ ভিডিও পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন!", threadID, messageID); } catch(e) {}
          return;
        }
        if (messageID) {
          try { api.setMessageReaction("😓", messageID, () => {}, true); } catch (e) { /* ignore */ }
        }
      });

    } catch (err) {
      console.error("[shourovlove99] error:", err && (err.stack || err));
      try { api.sendMessage("⚠️ ভিডিও পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো!", threadID, messageID); } catch(e) {}
    }
  },

  start: function () {
    // শুরুতে কিছু ইনিশিয়ালাইজ করতে চাইলে এখানে যোগ করুন
    console.log("[shourovlove99] module loaded");
  }
};