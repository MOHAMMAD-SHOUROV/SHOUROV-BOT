module.exports.config = {
  name: "frok",
  version: "1.0.2",
  permission: 0,
  credits: "King_Shourov",
  description: "📦 Shourov's GitHub fork link (no prefix)",
  category: "system",
  usages: "",
  cooldowns: 3,
  prefix: false // no prefix command
};

module.exports.handleEvent = async function ({ event, api }) {
  const msg = (event.body || "").toLowerCase();

  // 🔥 Trigger words
  const keywords = [
    "frok", "fork", "forklink", "myfork", "myfrok",
    "github", "githublink", "repo", "shourov fork"
  ];

  // যদি ইউজারের মেসেজ ঠিক keyword এর সাথে মিলে যায়
  if (keywords.includes(msg)) {

    const reply = `
╭━━〔 🚀 *SHOUROV BOT OFFICIAL FORK* 〕━━╮

🔰 *GitHub Repository (Fork Here)*  
👉 https://github.com/MOHAMMAD-SHOUROV/SHOUROV-BOT

🌐 *Facebook Profile*  
👉 https://www.facebook.com/www.xsxx.com365

💎 *GitHub Profile*  
👉 https://github.com/MOHAMMAD-SHOUROV

╰━━━━━━━━━━━━━━━━━━━━━━╯
    `.trim();

    return api.sendMessage(reply, event.threadID, event.messageID);
  }
};

module.exports.run = async ({ api, event }) => {
  // prefix দিলে run কাজ করবে
  return api.sendMessage(
    "🔥 এই কমান্ড prefix ছাড়াই কাজ করে!\n\nJust type: frok / forklink / repo",
    event.threadID,
    event.messageID
  );
};