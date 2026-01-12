module.exports.config = {
  name: "goiadmin",
  version: "1.1.0",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Auto reply when someone mentions main admin",
  prefix: false,
  category: "user",
  usages: "mention admin",
  cooldowns: 5
};

module.exports.handleEvent = function ({ api, event }) {
  try {
    const ADMIN_ID = "100071971474157";

    // no mentions → ignore
    if (!event.mentions || Object.keys(event.mentions).length === 0) return;

    // admin himself mentioned → ignore
    if (String(event.senderID) === String(ADMIN_ID)) return;

    // check if admin is mentioned
    const mentionedIds = Object.keys(event.mentions).map(id => String(id));
    if (!mentionedIds.includes(String(ADMIN_ID))) return;

    // random replies
    const replies = [
      "Mention দিস না, সৌরভ বস আজ মন ভালো নেই 💔🥀",
      "আমার সাথে কেউ টেক্সও করে না 🫂💔",
      "আমার একটা প্রিয় মানুষ দরকার 😭",
      "এত মেনশন না দিয়ে ইনবক্সে আসো 😘🥒",
      "Mention দিলে ঠোঁটের কালার change কইরা লামু 💋😾",
      "সৌরভ বস এখন বিজি, যা বলার আমাকে বলো 😼",
      "এত মেনশন না দিয়ে সৌরভরে একটা গফ দে 😒",
      "সিরিয়াস প্রেম করতে চাইলে ইনবক্স 😏",
      "Mention দিস না, সৌরভ প্রচুর বিজি 🥵🤐",
      "চুমু খাওয়ার বয়সটা চকলেট খেয়ে উড়াইছি 🍫🤣"
    ];

    const chosen = replies[Math.floor(Math.random() * replies.length)];

    return api.sendMessage(
      { body: chosen },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("goiadmin handleEvent error:", err);
  }
};

// no manual command needed
module.exports.run = function () {};