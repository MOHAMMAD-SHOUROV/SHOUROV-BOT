const axios = require("axios");

let cachedStream = null; // ক্যাশ করা স্ট্রিম / ডাউনলোড

module.exports = {
  config: {
    name: "shourov13",
    version: "1.0.2",
    prefix: false,
    permission: 0,
    credits: "nayan",
    description: "Sad reacts video",
    category: "no prefix",
    usages: "😭 or 🤧",
    cooldowns: 5,
  },

  handleEvent: async function({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    // 그대로 রাখো (emoji-র জন্য toLowerCase ঐচ্ছিক — emoji-তে বদল আসে না)
    const text = body.toString();

    // ট্রিগারগুলো — তুমি চাইলে এখানে আরও যোগ করতে পারবে
    const triggers = ["😭", "🤧", "3"];

    // যদি কোনো ট্রিগার পাওয়া যায়
    if (!triggers.some(t => text.includes(t))) return;

    try {
      // ক্যাশ ব্যবহার — যদি আগে লোড করা না থাকে তাহলে লোড করো
      if (!cachedStream) {
        const url = "https://files.catbox.moe/7cf5c9.mp4"; // তোমার মিডিয়া লিংক
        const res = await axios.get(url, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 30000
        });

        // আমরা response.data (stream) কে সরাসরি ক্যাশ করছি।
        // কিছু environment-এ stream reuse না হলে তুমি ফাইল হিসেবে ডাউনলোড করে পাঠাতে পারো।
        cachedStream = res.data;
      }

      const msg = {
        body: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 ",
        attachment: cachedStream
      };

      // পাঠানোর পর info.messageID ব্যবহার করে reaction দাও
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("Send message error:", err);
          return;
        }
        // reaction should target the message the bot sent (info.messageID)
        api.setMessageReaction("😂", info.messageID, () => {}, true);
      }, messageID);

    } catch (err) {
      console.error("❌ ভিডিও পাঠাতে সমস্যা:", err && err.message ? err.message : err);
      // ব্যর্থ হলে fallback message পাঠাও
      api.sendMessage("⚠️ ভিডিও পাঠানো যায়নি!", threadID, messageID);
    }
  },

  start() {}
};