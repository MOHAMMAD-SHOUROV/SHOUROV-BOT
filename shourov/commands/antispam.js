// commands/antispam.js

const moment = require("moment-timezone");

// 🔐 ADMIN IDS (এই আইডিগুলো কখনো ban হবে না)
const ADMIN_IDS = [
  "100071971474157" // <-- তোমার UID
];

// 🔢 Spam limit
const num = 3;    // কতবার
const timee = 10; // কত সেকেন্ডের মধ্যে

module.exports.config = {
  name: "antispam",
  version: "2.0.0",
  permission: 0,
  credits: "shourov (admin ignore fixed)",
  description: "Auto ban spammers (admin safe)",
  prefix: true,
  category: "system",
  usages: "none",
  cooldowns: 0
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    `🚫 Anti-Spam Active\nSpam ${num} times within ${timee}s = Auto Ban\n(Admin Safe ✅)`,
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  try {
    if (!event.body) return;

    const senderID = String(event.senderID);
    const threadID = String(event.threadID);

    // ✅ ADMIN ignore
    if (ADMIN_IDS.includes(senderID)) return;

    // init global objects
    if (!global.client) global.client = {};
    if (!global.client.autoban) global.client.autoban = {};
    if (!global.data) global.data = {};
    if (!global.data.userBanned) global.data.userBanned = new Map();

    // prefix check
    let prefix = global.config.PREFIX || "/";
    try {
      const threadData = global.data.threadData?.get(threadID);
      if (threadData?.PREFIX) prefix = threadData.PREFIX;
    } catch {}

    // only count commands
    if (!event.body.startsWith(prefix)) return;

    // init user spam data
    if (!global.client.autoban[senderID]) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 1
      };
      return;
    }

    const dataSpam = global.client.autoban[senderID];

    // reset window
    if (Date.now() - dataSpam.timeStart > timee * 1000) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 1
      };
      return;
    }

    // increase count
    dataSpam.number++;

    // not reached limit
    if (dataSpam.number < num) return;

    // 🔒 reached limit → ban
    global.client.autoban[senderID] = { timeStart: Date.now(), number: 0 };

    const userData = await Users.getData(senderID) || {};
    const data = userData.data || {};

    if (data.banned) return;

    const timeDate = moment.tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");

    data.banned = true;
    data.reason = `Spam ${num} times / ${timee}s`;
    data.dateAdded = timeDate;

    await Users.setData(senderID, { data });
    global.data.userBanned.set(senderID, {
      reason: data.reason,
      dateAdded: data.dateAdded
    });

    // user name
    let userName = senderID;
    try {
      userName = await Users.getNameUser(senderID);
    } catch {}

    // thread name
    let threadName = threadID;
    try {
      const t = await Threads.getData(threadID);
      if (t?.threadInfo?.threadName) threadName = t.threadInfo.threadName;
    } catch {}

    // notify group
    await api.sendMessage(
`🚫 User has been auto-banned for spamming commands.

Name: ${userName}
UID: ${senderID}
Group: ${threadName}
Reason: ${data.reason}
Time: ${timeDate}`,
      threadID
    );

    // notify admins
    const admins = global.config.ADMINBOT || [];
    for (const admin of admins) {
      try {
        await api.sendMessage(
`🔔 Auto-Ban Alert

User: ${userName}
UID: ${senderID}
Group: ${threadName}
Reason: ${data.reason}
Time: ${timeDate}`,
          admin
        );
      } catch {}
    }

  } catch (err) {
    console.error("[antispam] error:", err);
  }
};