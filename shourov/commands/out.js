module.exports = {
  config: {
    name: "out",
    version: "1.0.5",
    credits: "shourov",
    prefix: false,
    permission: 2,
    description: "make the bot leave a thread (or specified thread id)",
    category: "admin",
    cooldowns: 5
  },

  run: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    try {
      // if no argument -> leave current thread
      if (!args[0]) {
        await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
        return api.sendMessage("Goodbye 👋", threadID, messageID);
      }

      // if an argument is provided and it's a numeric thread id -> leave that thread
      const target = args.join(" ").trim();
      if (!isNaN(target)) {
        await api.removeUserFromGroup(api.getCurrentUserID(), target);
        return api.sendMessage(`Left thread ${target} ✅`, threadID, messageID);
      }

      // invalid input
      return api.sendMessage("Invalid thread id. Use a numeric thread ID or omit to leave this chat.", threadID, messageID);

    } catch (err) {
      console.error("out command error:", err);
      return api.sendMessage(`Error while trying to leave: ${err.message}`, threadID, messageID);
    }
  }
};