// commands/autoazan.js
const axios = require("axios");
const cron = require("node-cron");

module.exports.config = {
  name: "autoazan",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  description: "Auto Azan with video (BD Time)",
  prefix: false,
  category: "system"
};

// 🕌 Azan video
const AZAN_VIDEO = "https://files.catbox.moe/vlxz90.mp4";

// 🇧🇩 Fixed BD Azan times (approx)
const AZAN_TIMES = [
  { name: "ফজর", time: "30 4 * * *" },
  { name: "যোহর", time: "0 13 * * *" },
  { name: "আসর", time: "30 16 * * *" },
  { name: "মাগরিব", time: "0 18 * * *" },
  { name: "ইশা", time: "30 19 * * *" }
];

module.exports.onLoad = async function () {
  console.log("🕌 Auto Azan with video loaded (BD Time)");

  for (const azan of AZAN_TIMES) {
    cron.schedule(
      azan.time,
      async () => {
        try {
          const api = global.client.api;
          if (!api) return;

          const res = await axios.get(AZAN_VIDEO, {
            responseType: "stream",
            timeout: 30000
          });

          const message = {
            body:
`🕌 আজান হচ্ছে 🕌

🕋 ওয়াক্ত: ${azan.name}
📍 সময়: বাংলাদেশ (BD)

اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ 🤍`,
            attachment: res.data
          };

          // সব গ্রুপে পাঠাবে
          const threads = global.data?.allThreadID || [];
          for (const tid of threads) {
            try {
              await api.sendMessage(message, tid);
            } catch (e) {}
          }

        } catch (err) {
          console.error("Auto Azan error:", err.message);
        }
      },
      {
        timezone: "Asia/Dhaka"
      }
    );
  }
};

module.exports.run = async function () {};