const fs = global.nodemodule && global.nodemodule["fs"] ? global.nodemodule["fs"] : require("fs");

module.exports.config = {
  name: "iloveu",
  version: "2.0.1",
  permission: 0,
  credits: "nayan (adapted shourov)",
  description: "Reply when someone says I love you",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;
    //
    if (!event || !event.body || typeof event.body !== "string") return;

    // 
    // 
    const text = event.body.trim();
    const regex = /^\s*i\s*love\s*(you|u)\b/i;

    if (regex.test(text)) {
      const msg = {
        body: "Hmm... বস সৌরভও তোমাকে ভালোবাসে😇😻 :))"
      };
      return api.sendMessage(msg, threadID, messageID);
    }
  } catch (err) {
    // 
    console.error("iloveu handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  //
};