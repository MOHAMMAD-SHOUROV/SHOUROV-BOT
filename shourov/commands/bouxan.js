const fs = require("fs");

module.exports.config = {
  name: "bouxan",
  version: "2.0.1",
  permission: 0,
  credits: "shourov",
  description: "",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  // safety: যদি কোনো বডি না থাকে তাহলে কিছু না কর
  if (!event || !event.body) return;

  const { threadID, messageID } = event;
  const body = String(event.body).toLowerCase();

  // ট্রিগার শব্দগুলো এখানে যোগ করা হলো
  const triggers = [
    "@angal anika",
    "angal anika",
    "anika",
    "আনিকা",
    "angl anika", // যদি কেও টাইপ মিস করে থাকে
  ];

  // যদি কোনো ট্রিগার মিলে যায় তাহলে রিপ্লাই পাঠাও
  if (triggers.some(t => body.includes(t))) {
    const msg = {
      body: "ওরে কেউ মেনশন দিবি না ও বস সৌরভ এর ভালোবাসা and বউ 😍🥰 :))"
    };
    return api.sendMessage(msg, threadID, messageID);
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // CLI-run / manual invocation behavior যদি দরকার হয় এখানে যোগ করো
};