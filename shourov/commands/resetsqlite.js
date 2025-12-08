'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");

module.exports.config = {
  name: "resetsqlite",
  version: "7.0.0",
  permission: 3,                 // operators only (fits your loader)
  credits: "ryuko | fixed by Shourov",
  prefix: true,
  description: "Reset bot database (SQLite) safely",
  category: "operator",
  usages: "",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args, config }) {
  try {
    const { threadID, messageID, senderID } = event;

    // Optional strict owner lock (uncomment if needed)
    // if (String(senderID) !== String(config.ownerId)) {
    //   return api.sendMessage("❌ Only the owner can reset the database.", threadID, messageID);
    // }

    // --- Resolve database absolute path ---
    const dbPath = path.join(__dirname, '..', '..', 'system', 'database', 'datasqlite', 'Nayan.sqlite');

    if (!fs.existsSync(dbPath)) {
      await api.sendMessage("⚠ Database file does not exist. Nothing to reset.", threadID, messageID);
      return;
    }

    await api.sendMessage("🔄 Deleting database file...\nPlease wait...", threadID);

    // Delete using exec or fs.unlinkSync — exec is kept per your original design
    exec(`rm -rf "${dbPath}"`, async (error, stdout, stderr) => {
      if (error) {
        return api.sendMessage(`❌ Error:\n${error.message}`, threadID, messageID);
      }
      if (stderr) {
        return api.sendMessage(`⚠ stderr:\n${stderr}`, threadID, messageID);
      }

      await api.sendMessage("✅ Database reset successfully!\n🔁 Restarting bot...", threadID);

      setTimeout(() => {
        try { process.exit(1); }
        catch { process.abort(); }
      }, 800);
    });

  } catch (err) {
    console.error("ResetSQLite Error:", err);
    return api.sendMessage("❌ Failed to reset database:\n" + err.message, event.threadID, event.messageID);
  }
};