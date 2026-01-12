// commands/rankup.js
"use strict";

module.exports.config = {
  name: "rankup",
  version: "1.1.0",
  permission: 0,
  credits: "Shourov (fixed)",
  description: "Rank up notification system",
  prefix: true,
  category: "system",
  usages: "rankup",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event, Users, Currencies }) {
  try {
    if (!event.senderID || !event.threadID) return;

    const senderID = String(event.senderID);
    const threadID = String(event.threadID);

    // ===== get EXP safely =====
    let userData = {};
    try {
      userData = await Currencies.getData(senderID) || {};
    } catch {}

    let exp = Number(userData.exp) || 0;
    exp += 1;

    // ===== thread rankup toggle =====
    const threadData =
      global.data?.threadData?.get(threadID) || {};

    if (threadData.rankup === false) {
      await Currencies.setData(senderID, { exp });
      return;
    }

    // ===== level formula =====
    const oldLevel = Math.floor((Math.sqrt(1 + (4 * (exp - 1) / 3)) - 1) / 2);
    const newLevel = Math.floor((Math.sqrt(1 + (4 * exp / 3)) - 1) / 2);

    // ===== only notify on level up =====
    if (newLevel > oldLevel && newLevel > 1) {
      let name = senderID;
      try {
        name = await Users.getNameUser(senderID);
      } catch {}

      const message =
        `🎉 অভিনন্দন ${name}!\n` +
        `আপনি লেভেল ${newLevel} এ পৌঁছেছেন 🏆`;

      api.sendMessage(
        {
          body: message,
          mentions: [{ tag: name, id: senderID }]
        },
        threadID
      );
    }

    // ===== save exp =====
    await Currencies.setData(senderID, { exp });

  } catch (err) {
    console.error("[rankup error]", err);
  }
};

module.exports.run = async function ({ api, event, Threads }) {
  try {
    const threadID = event.threadID;

    const threadData = (await Threads.getData(threadID))?.data || {};
    threadData.rankup = !threadData.rankup;

    await Threads.setData(threadID, { data: threadData });
    global.data.threadData.set(threadID, threadData);

    return api.sendMessage(
      `✅ Rankup notification ${
        threadData.rankup ? "ON" : "OFF"
      } করা হয়েছে`,
      threadID,
      event.messageID
    );
  } catch (e) {
    console.error("[rankup toggle error]", e);
  }
};

module.exports.languages = {
  en: {
    levelup: "Congratulations {name}, you reached level {level}"
  }
};