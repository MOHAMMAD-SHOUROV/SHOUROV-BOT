module.exports = {
  name: "ping",       // command name
  aliases: ["p"],     // optional aliases
  description: "Replies with Pong!", // optional description
  version: "1.0",
  role: 0,            // permission level (optional)
  countDown: 3,       // cooldown in seconds (optional)

  // The main function that runs when command is called
  run: async ({ event, api, args }) => {
    try {
      const threadID = event.threadID || event.senderID;
      if (!threadID) return;

      await api.sendMessage({ body: "Pong! 🏓" }, threadID);
      console.log("Ping command executed in thread:", threadID);
    } catch (e) {
      console.error("Error running ping command:", e.message);
    }
  }
};
