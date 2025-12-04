module.exports = {
  config: {
    name: "out",
    version: "1.0.6",
    credits: "shourov",
    prefix: false,
    permission: 2,
    description: "make the bot leave a thread (current or given thread id)",
    category: "admin",
    cooldowns: 5
  },

  start: async function ({ shourov, events, args }) {
    try {
      // helper to send a message (supports different runtimes)
      const send = async (text, tid) => {
        if (!tid) tid = events.threadID;
        if (shourov && typeof shourov.sendMessage === "function") return await shourov.sendMessage(text, tid);
        if (shourov && typeof shourov.reply === "function") return await shourov.reply(text, tid);
        return null;
      };

      const botId = (shourov && typeof shourov.getCurrentUserID === "function") ? shourov.getCurrentUserID() : null;

      // if no arg provided -> leave current thread
      if (!args || !args[0]) {
        // inform then leave
        await send("Goodbye 👋", events.threadID);
        if (botId) {
          // some runtimes expect (userID, threadID)
          if (typeof shourov.removeUserFromGroup === "function") {
            await shourov.removeUserFromGroup(botId, events.threadID);
          }
        }
        return;
      }

      // if argument is numeric -> treat as threadID to leave
      const maybeId = args.join(" ").trim();
      if (/^\d+$/.test(maybeId)) {
        await send(`Leaving thread: ${maybeId}`, events.threadID);
        if (botId && typeof shourov.removeUserFromGroup === "function") {
          await shourov.removeUserFromGroup(botId, maybeId);
        }
        return;
      }

      // fallback: invalid usage
      return await send("Usage:\n• out            -> bot leaves current chat\n• out <threadID> -> bot leaves the specified thread", events.threadID);
    } catch (err) {
      console.error("out command error:", err && (err.stack || err));
      try {
        if (shourov && typeof shourov.sendMessage === "function") {
          await shourov.sendMessage("An error occurred while trying to leave the thread.", events.threadID);
        } else if (shourov && typeof shourov.reply === "function") {
          await shourov.reply("An error occurred while trying to leave the thread.", events.threadID);
        }
      } catch (e) { /* ignore */ }
    }
  }
};