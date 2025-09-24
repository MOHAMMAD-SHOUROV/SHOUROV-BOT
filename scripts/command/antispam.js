const num = 3;  // কয়বার স্প্যাম করলে ব্যান হবে
const timee = 10; // কয় সেকেন্ডের মধ্যে স্প্যাম করলে ব্যান হবে

module.exports.config = {
  name: "antispam",
  version: "1.1.0",
  permission: 0,
  credits: "ShourovXSXX",
  description: "Automatically ban spammer (with auto unban)",
  prefix: true,
  category: "system",
  usages: "none",
  cooldowns: 0,
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    `🚫 যদি কেউ ${timee} সেকেন্ডে ${num} বার স্প্যাম করে, সে ব্যান হবে।\n✅ অটো আনব্যান হবে ${timee} সেকেন্ড পর।`,
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  let { senderID, threadID } = event;
  var datathread = (await Threads.getData(threadID)).threadInfo;

  if (!global.client.autoban) global.client.autoban = {};

  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 0,
    };
  }

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  if (!event.body || event.body.indexOf(prefix) != 0) return;

  if (global.client.autoban[senderID].timeStart + timee * 1000 <= Date.now()) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 0,
    };
  } else {
    global.client.autoban[senderID].number++;
    if (global.client.autoban[senderID].number >= num) {
      const moment = require("moment-timezone");
      const timeDate = moment.tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");

      let dataUser = (await Users.getData(senderID)) || {};
      let data = dataUser.data || {};
      if (data && data.banned === true) return;

      // Ban user
      data.banned = true;
      data.reason = `Spam bot ${num} times / ${timee}s`;
      data.dateAdded = timeDate;
      await Users.setData(senderID, { data });
      global.data.userBanned.set(senderID, {
        reason: data.reason,
        dateAdded: data.dateAdded,
      });

      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0,
      };

      api.sendMessage(
        `🚫 User Banned!\n\n👤 Name: ${dataUser.name}\n🆔 ID: ${senderID}\n📌 Reason: Spam bot ${num} times\n⏳ Auto-unban after ${timee} seconds`,
        threadID
      );

      // Notify admins
      for (let ad of global.config.ADMINBOT) {
        api.sendMessage(
          `⚠️ Spam ban notification\n\n👤 Name: ${dataUser.name}\n🆔 User ID: ${senderID}\n💬 Group: ${datathread.threadName} (${threadID})\n⏰ Time: ${timeDate}`,
          ad
        );
      }

      // Auto Unban after "timee" seconds
      setTimeout(async () => {
        let dataUser = (await Users.getData(senderID)) || {};
        let data = dataUser.data || {};
        if (data && data.banned === true) {
          data.banned = false;
          data.reason = null;
          await Users.setData(senderID, { data });
          global.data.userBanned.delete(senderID);

          api.sendMessage(
            `✅ Auto Unban Complete!\n\n👤 Name: ${dataUser.name}\n🆔 ID: ${senderID}`,
            threadID
          );
        }
      }, timee * 1000);
    }
  }
};
