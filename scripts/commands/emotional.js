module.exports.config = {
  name: "emotional",
  version: "1.0.0",
  permission: 0,
  credits: "BOT OWNER 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  description: "ইমোশনাল কিছু কথা",
  prefix: true,
  category: "emotion",
  usages: "emotional",
  cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const texts = [
    "কখনো কখনো আমরা হাসি, শুধু অন্যকে কাঁদতে না দিতে।",
    "ভালোবাসা তখনই টেকে, যখন দুজনই ছেড়ে যাওয়ার নয়, বোঝার চেষ্টা করে।",
    "ভালো থাকো বললেও, ভিতরে ভিতরে কেউ হয়তো ভেঙে যাচ্ছে।",
    "নীরবতা অনেক কিছু বলে দেয়, যা শব্দ দিয়ে বলা যায় না।"
  ];
  const msg = texts[Math.floor(Math.random() * texts.length)] + "\n\n💔 BOT OWNER 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯";
  return api.sendMessage(msg, event.threadID, event.messageID);
};
