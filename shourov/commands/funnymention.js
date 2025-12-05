const fs = require("fs");

module.exports.config = {
  name: "funny",
  version: "2.0.0",
  permission: 0,
  credits: "shourov",
  description: "Reply when certain names or phrases are mentioned",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID, body } = event;
    if (!body) return; // body না থাকলে ব্যস্ত না হওয়া ভালো

    const text = String(body).toLowerCase();

    // যে শব্দ/নামগুলো ধরতে চান সেগুলো এখানে যোগ করুন (সবই lowercase)
    const triggers = [
      "@হা বি ব",
      "@ahmed tamim",
      "@ahmed shihib"
    ];

    // message.body এবং mentions উভয়েই চেক করা হবে
    let matched = triggers.some(t => text.includes(t));

    // যদি message-এর mentions ফিল্ড থাকে, mentions-এর display name গুলোও দেখুন
    if (!matched && event.mentions && Object.keys(event.mentions).length > 0) {
      for (const id of Object.keys(event.mentions)) {
        const display = (event.mentions[id] || "").toString().toLowerCase();
        if (triggers.some(t => display.includes(t.replace('@', '').trim()))) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      const reply = {
        body: "Please—দয়া করে কোনো ছেলে মেনশন দেবেন না। সে এখন মেয়ে পটাতে ব্যস্ত আছে।"
      };
      return api.sendMessage(reply, threadID, messageID);
    }
  } catch (err) {
    console.error("Error in 0099 handleEvent:", err && (err.stack || err));
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // যদি পরে কমান্ড হয় — এখানে যুক্ত করতে পারবেন
};