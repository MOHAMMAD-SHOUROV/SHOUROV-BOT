const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "mentionKing",
  version: "2.0.0",
  eventType: ["message"],
  credits: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  description: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 কে মেনশন করলে রেসপন্স দেয়"
};

const KING_UID = "100070297030133";
const KING_FB_LINK = "https://www.facebook.com/www.xsxx.com365";

const replies = [
  "💎 বস 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 কে ডাক দিছো! সালাম দেও আগে! 🫡",
  "🔥 তোমরা জানো না, 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 কে mention করলে গ্রুপ কাঁপে!",
  "🥀 ভাই, ওই যে বললাম না, 𝐒𝐡𝐨𝐮𝐫𝐨𝐯 এখন ঘুমে!",
  "🚀 কিং তো এখন চাঁদে মিশন চালাচ্ছে, পরে আসো!",
  "👑 𝐁𝐎𝐒𝐒 কে ডাক দেওয়ার আগে অনুমতি নেও প্রয়োজন!",
  "⚡ 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 is offline now... Be patient!",
  "🎩 Legend never sleeps — শৌরভ ভাই এক্সপার্ট মোডে আছে!",
  "🎤 ভাইরে ভাই! 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 নাম শুনলেই respect আসে!",
  "🌈 তোর এমন সাহস! কিং কে mention করিস!",
  "📣 আবার বলছি... 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯 = Legend 🔥",
  "🤴 তোকে বলতেই হবে, '𝐒𝐡𝐨𝐮𝐫𝐨𝐯 ভাই রে সালাম' 😌",
  "🔔 শৌরভ ভাই available না... Try again later 😴",
  "📷 প্রোফাইল দেখতে চাও? 👉 " + KING_FB_LINK,
  "💌 ভাইরে, কিং তো এক্সাম দিচ্ছে, পরেও ডাক দিও!",
  "🕶️ কিং এখন 'coding zone'-এ, disturb করা মানা!",
  "🌟 তোমার সৌভাগ্য যে কিং তোমার মেনশন দেখেছে!",
  "🪄 যেই বলবি কিং, অমনি জাদু শুরু!",
  "🎖️ কিং কে মেনশন মানেই Power trigger!",
  "🕵️‍♂️ কিং দেখেছে, কিন্তু কিছু বলবে না... Royal Silence!",
  "🍫 কিং এখন Chocolate খাচ্ছে, ব্যস্ত!",
  "🛡️ কিং চাইলেই তোমাকে গ্রুপ থেকে উঠিয়ে দিতে পারে 😈",
  "🌪️ KING মেনশন হলেই group এ ঝড় ওঠে!",
  "🎯 রিস্পেক্ট দে কিং কে! না হলে... 😏",
  "💬 কিং বললো – 'I'm watching you...' 👀",
  "🔮 কিং তো এখন meditation এ বসে আছে... 😌"
];

module.exports.run = async function ({ api, event }) {
  const mentions = event.mentions;
  if (!mentions || !Object.keys(mentions).includes(KING_UID)) return;

  try {
    const url = `https://graph.facebook.com/${KING_UID}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;
    const pathImg = path.join(__dirname, "kingMention.jpg");
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(response.data, "binary"));

    const msg = {
      body: `${replies[Math.floor(Math.random() * replies.length)]}\n\n📌 প্রোফাইল: ${KING_FB_LINK}`,
      attachment: fs.createReadStream(pathImg)
    };

    api.sendMessage(msg, event.threadID, () => {
      fs.unlinkSync(pathImg);
    });
  } catch (err) {
    console.error("❌ Error sending mentionKing reply:", err);
  }
};
