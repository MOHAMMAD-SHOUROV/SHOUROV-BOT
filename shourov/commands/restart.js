// shourov/commands/restart.js
'use strict';

module.exports.config = {
  name: "restart",
  version: "7.0.0",
  permission: 2,
  credits: "shourov",
  prefix: false,
  description: "Restart bot system",
  category: "admin",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function({ event, api, args, config, Threads, Users, Currencies, language }) {
  try {
    const { threadID, messageID, senderID } = event;

    // Optional: restrict to owner/admins more strictly (uncomment if you want)
    // const owners = Array.isArray(config.ownerId) ? config.ownerId : [String(config.ownerId)];
    // if (!owners.includes(String(senderID))) {
    //   return api.sendMessage("You do not have permission to restart the bot.", threadID, messageID);
    // }

    const botName = (config && (config.BOTNAME || config.botName)) ? (config.BOTNAME || config.botName) : "Bot";

    // Inform users (best-effort) and then exit
    await api.sendMessage(`🔄 Restarting ${botName} — please wait...`, threadID);

    // small delay to ensure message deliver (non-blocking)
    setTimeout(() => {
      // graceful exit to allow external process manager to restart (pm2, systemd, forever, etc.)
      try { process.exit(1); } catch (e) { process.abort(); }
    }, 800);

  } catch (err) {
    // if something goes wrong, log and notify
    console.error("Restart command error:", err);
    try { await api.sendMessage("❌ Failed to restart: " + err.message, event.threadID, event.messageID); } catch(e){ /* ignore */ }
  }
};