module.exports.config = {
  name: "sorrybol",
  version: "1.0.0",
  permission: 2, // anyone can use (you can change back to 2)
  credits: "Fixed by Shourov",
  description: "Send 'SORRY' message multiple times with delay",
  prefix: true,
  category: "fun",
  usages: "/sorrybol",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID } = event;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const msgText = "🅂🄾🅁🅁🅈 ❤️";

  // safe limit
  for (let i = 1; i <= 20; i++) {
    api.sendMessage(`${msgText} (${i}/20)`, threadID);
    await delay(600); // safer delay
  }
};