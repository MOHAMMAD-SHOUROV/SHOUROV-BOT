// commands/00fun.js
module.exports.config = {
  name: "funmention",
  version: "2.0.1",
  permission: 0,
  credits: "nayan",
  description: "Responds when message starts with Ayan or Habib",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString();

    // only proceed if there's a message
    if (!body || body.length === 0) return;

    // match if message STARTS with "ayan" or "habib" (case-insensitive)
    // allows leading spaces before the name
    const startsWithName = /^\s*(ayan|habib)\b/i.test(body);

    if (startsWithName) {
      const reply = "কোনো ছেলেরা আমাকে ডাকবে না🚫❌  শুধু কচি কচি মেয়েরা ডাকবে😍🙂";
      await api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("00fun handleEvent error:", err && (err.stack || err));
  }
};

// run kept for compatibility with systems that call run()
module.exports.run = async function({ api, event, client, __GLOBAL }) {
  // nothing needed here — module is event-driven
};// commands/00fun.js
module.exports.config = {
  name: "00fun",
  version: "2.0.1",
  permission: 0,
  credits: "nayan",
  description: "Responds when message starts with Ayan or Habib",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString();

    // only proceed if there's a message
    if (!body || body.length === 0) return;

    // match if message STARTS with "ayan" or "habib" (case-insensitive)
    // allows leading spaces before the name
    const startsWithName = /^\s*(ayan|habib)\b/i.test(body);

    if (startsWithName) {
      const reply = "কোনো ছেলেরা আমাকে ডাকবে না🚫❌  শুধু কচি কচি মেয়েরা ডাকবে😍🙂";
      await api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("00fun handleEvent error:", err && (err.stack || err));
  }
};

// run kept for compatibility with systems that call run()
module.exports.run = async function({ api, event, client, __GLOBAL }) {
  // nothing needed here — module is event-driven
};