module.exports.config = {
  name: "motivation",
  version: "1.0.0",
  permission: 0,
  credits: "𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯",
  description: "মোটিভেশনাল মেসেজ দেয়",
  prefix: true,
  category: "quotes",
  usages: "/motivation",
  cooldowns: 5,
};

module.exports.run = async function({ api, event }) {
  const quotes = [
    "🌟 স্বপ্ন দেখো, বিশ্বাস রাখো, কঠোর পরিশ্রম করো – সফলতা আসবেই!",
    "💪 কষ্ট ছাড়া কিছুই পাওয়া যায় না। সাহস রেখো।",
    "🔥 তুমি পারবে – এটা বিশ্বাস করো!",
    "🛤️ জার্নিটাই সবচেয়ে গুরুত্বপূর্ণ, শুধু গন্তব্য নয়।"
  ];
  const rand = quotes[Math.floor(Math.random() * quotes.length)];
  return api.sendMessage(`${rand}\n\n- BOT OWNER 𝐊𝐢𝐧𝐠_𝐒𝐡𝐨𝐮𝐫𝐨𝐯`, event.threadID, event.messageID);
                         }
