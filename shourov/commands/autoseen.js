const fs = require("fs-extra");
const path = require("path");

const pathDir = path.resolve(__dirname, "autoseen");
const pathFile = path.join(pathDir, "autoseen.txt");

module.exports.config = {
  name: "autoseen",
  version: "1.0.1",
  permission: 2,
  credits: "shourov",
  description: "turn on/off automatic seen for new messages",
  prefix: true,
  category: "system",
  usages: "autoseen [on|off]",
  cooldowns: 5
};

// ensure folder & file exist
if (!fs.existsSync(pathDir)) fs.mkdirSync(pathDir, { recursive: true });
if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, "false", "utf8");

module.exports.handleEvent = async ({ api, event }) => {
  try {
    // read setting
    const isEnable = (fs.readFileSync(pathFile, "utf8") || "false").trim() === "true";
    if (isEnable) {
      // mark as read (some frameworks provide markAsReadAll or markAsRead)
      if (typeof api.markAsReadAll === "function") {
        api.markAsReadAll(() => {});
      } else if (typeof api.markAsRead === "function") {
        // mark just the thread (fallback)
        try { api.markAsRead(event.threadID, (err) => {}); } catch(e) {}
      }
    }
  } catch (err) {
    console.error("autoseen handleEvent error:", err);
  }
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const arg = (args[0] || "").toLowerCase();
    if (arg === "on") {
      fs.writeFileSync(pathFile, "true", "utf8");
      return api.sendMessage("✅ Autoseen enabled. New messages will be marked seen automatically.", event.threadID, event.messageID);
    } else if (arg === "off") {
      fs.writeFileSync(pathFile, "false", "utf8");
      return api.sendMessage("⛔ Autoseen disabled.", event.threadID, event.messageID);
    } else {
      // show current status
      const cur = (fs.readFileSync(pathFile, "utf8") || "false").trim() === "true" ? "✅ ON" : "⛔ OFF";
      return api.sendMessage(`Autoseen status: ${cur}\nUse: autoseen on | autoseen off`, event.threadID, event.messageID);
    }
  } catch (err) {
    console.error("autoseen run error:", err);
    return api.sendMessage("❌ কিছু সমস্যা হয়েছে। লগ চেক করো।", event.threadID, event.messageID);
  }
};
