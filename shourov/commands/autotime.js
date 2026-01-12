// commands/autotime.js
const cron = require("node-cron");
const moment = require("moment-timezone");

module.exports.config = {
  name: "autotime",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  description: "Auto time announce every 30 minutes (BD time)",
  prefix: false,
  category: "system"
};

module.exports.onLoad = async function () {
  console.log("⏰ Auto Time Announce loaded (Every 30 minutes | BD Time)");

  // প্রতি ৩০ মিনিট পরপর
  cron.schedule(
    "*/30 * * * *",
    async () => {
      try {
        const api = global.client.api;
        if (!api) return;

        // BD Time
        const timeNow = moment().tz("Asia/Dhaka");
        const timeText = timeNow.format("hh:mm A");
        const dateText = timeNow.format("DD MMMM YYYY, dddd");

        const message =
`⏰ 𝐓𝐈𝐌𝐄 𝐔𝐏𝐃𝐀𝐓𝐄

🕒 সময়: ${timeText}
📅 তারিখ: ${dateText}

━━━━━━━━━━━━━━
👑 𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕
🤖 𝐒𝐇𝐎𝐔𝐑𝐎𝐕_𝐁𝐎𝐓
🔗 https://www.facebook.com/shourov.sm24
━━━━━━━━━━━━━━`;

        // সব গ্রুপে পাঠাবে
        const threads = global.data?.allThreadID || [];
        for (const tid of threads) {
          try {
            await api.sendMessage(message, tid);
          } catch (e) {}
        }

      } catch (err) {
        console.error("AutoTime error:", err.message);
      }
    },
    {
      timezone: "Asia/Dhaka"
    }
  );
};

module.exports.run = async function () {};