module.exports.config = {
  name: "goiadmin",
  version: "1.0.0",
  permission: 0,
  credits: "shourov",
  description: "mention",
  prefix: true,
  category: "user",
  usages: "tag",
  cooldowns: 5,
};

module.exports.handleEvent = function ({ api, event }) {
  try {
    // owner id (won't trigger when owner themself sends)
    const ownerId = "100071971474157";

    // ignore events from the owner
    if (String(event.senderID) === ownerId) return;

    // Ensure mentions exist and is an object
    const mentions = event.mentions || {};

    // If no mentions, nothing to do
    if (!Object.keys(mentions).length) return;

    // Check if ownerId is among the mentioned user IDs
    const mentionedIds = Object.values(mentions).map(id => String(id));
    if (!mentionedIds.includes(ownerId)) return;

    // Possible responses (random)
    const replies = [
      "Mantion_দিস না _সৌরভ বস এর মন মন ভালো নেই আস্কে-!💔🥀",
      "- আমার সাথে কেউ সেক্স করে না থুক্কু টেক্স করে নাহ🫂💔",
      "আমার একটা প্রিয়র খুব দরকার কারন আমার চোখে পানি আসার আগে নাকে সর্দি চলে আসে🤣🤣",
      "এত মেনশন না দিয়ে বক্স আসো হট করে দিবো🤷‍ঝাং 😘🥒",
      "Mantion_দিলে চুম্মাইয়া ঠুটের কালার change কইরা,লামু 💋😾😾🔨",
      "এতু ইমুশানাল কথা বলো তল দেশ দিয়ে অজরে বৃষ্টি হচ্ছে আমার 😭😭",
      "সৌরভ বস এখন বিজি — যা বলার আমাকে বলতে পারেন_!!😼🥰",
      "এতো মিনশন নাহ দিয়া সিংগেল সৌরভ রে একটা গফ দে 😒 😏",
      "Mantion_না দিয়ে সিরিয়াস প্রেম করতে চাইলে ইনবক্স",
      "মেনশন দিসনা পারলে একটা গফ দে",
      "Mantion_দিস না বাঁলপাঁক্না সৌরভ প্রচুর বিজি 🥵🥀🤐",
      "চুমু খাওয়ার বয়স টা চকলেট🍫খেয়ে উড়িয়ে দিলাম🤗"
    ];

    const response = replies[Math.floor(Math.random() * replies.length)];
    api.sendMessage({ body: response }, event.threadID, event.messageID);
  } catch (err) {
    console.error("goiadmin.handleEvent error:", err && (err.stack || err.message));
  }
};

module.exports.run = async function ({ api, event, args }) {
  // This command has no direct 'run' usage; it's an event-only module.
  // Keeping empty so loader doesn't fail if it's required to call run.
  return;
};
