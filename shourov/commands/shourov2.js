const fs = require("fs");

module.exports.config = {
  name: "shourov2",
  version: "2.0.0",
  permission: 0,
  credits: "shourov",
  description: "",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
  try {
    const { threadID, messageID } = event;

    // event.body নাও থাকতে পারে — তা যাচাই করা হচ্ছে
    if (!event || !event.body) return;

    // ছোট হাত-বড় হাত উভয়ের জন্য সোজা চেক করা — সমস্যা থাকলেtolower()
    const body = event.body.toString();
    const lower = body.toLowerCase();

    // বলেছেন যে prefix না-থাকলে কাজ করবে — তাই বিভিন্ন ট্রিগার শব্দ রাখা হলো
    const triggers = [
      "Alihsan Shourov",
      "Shourov",
      "সৌরভ"
    ];

    // যদি মেসেজটি trigger দিয়ে শুরু হয় (start with) কিংবা পুরো মেসেজে trigger থাকে, পাঠানো হবে
    const matched = triggers.some(t => lower.startsWith(t) || lower.includes(t));

    if (matched) {
      const msg = {
        body: "কিরে এতো ডাকিস কেন? আমার বস সৌরভ ব্যস্ত আছে — দেখিস না গা: 🤬"
      };
      return api.sendMessage(msg, threadID, messageID);
    }
  } catch (err) {
    console.error("shourov2 handleEvent error:", err);
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {
  // Optional: যদি আপনাকে কমান্ড লেভেলে কিছু করতে হয়, এখানে রাখবেন
};