// iloveu.js
const fs = require("fs");

module.exports.config = {
  name: "iloveu",
  version: "2.0.1",
  permission: 0,
  credits: "(fixed by shourov)",
  description: "Responds when someone says 'I love you' or similar",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function ({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString().trim();
    if (!body) return;

    // normalize
    const text = body.toLowerCase();

    // triggers: variations to match
    const triggers = [
      /\bi love you\b/,
      /\bi love u\b/,
      /\bi love\b/,
      /\bi♥you\b/,
      /\bi❤you\b/,
      /\bcudi\b/ // you included "cudi" earlier — keep if intended
    ];

    // check triggers
    const matched = triggers.some((re) => re.test(text));
    if (!matched) return;

    const reply = "Hmm... বস সৌরভও তোমাকে ভালোবাসে 😇😻"; // message to send

    // send reply
    return api.sendMessage(reply, threadID, messageID);
  } catch (err) {
    console.error("iloveu handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = function ({ api, event, client, __GLOBAL }) {
  // command invocation not used; reaction happens in handleEvent
};