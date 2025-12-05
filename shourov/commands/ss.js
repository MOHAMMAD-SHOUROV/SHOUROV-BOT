module.exports.config = {
  name: "ss",
  version: "1.0.0",
  permission: 2,
  credits: "shourov",
  description: "Blast message safely",
  prefix: true,
  category: "test",
  usages: "admin",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID } = event;

  const msg = "Shourov re gf de gadha 😭💔";

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      api.sendMessage(msg, threadID);
    }, i * 700); // প্রতি 0.7 সেকেন্ডে ১টা করে যাবে
  }
};