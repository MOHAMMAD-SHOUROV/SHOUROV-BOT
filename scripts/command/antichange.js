const fs = require("fs-extra");
const path = require("path");

const activeGroupsFilePath = path.join(__dirname, "..", "events", "groupSettings.json");

// Load active groups
let activeGroups = {};
if (fs.existsSync(activeGroupsFilePath)) {
  try {
    activeGroups = JSON.parse(fs.readFileSync(activeGroupsFilePath, "utf-8"));
    if (typeof activeGroups !== "object") activeGroups = {};
  } catch (err) {
    console.error("❌ Error loading groupSettings.json:", err);
    activeGroups = {};
  }
}

// Save active groups
const saveActiveGroups = () => {
  try {
    fs.writeFileSync(activeGroupsFilePath, JSON.stringify(activeGroups, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Error saving groupSettings.json:", err);
  }
};

module.exports = {
  config: {
    name: "antichange",
    version: "1.0.0",
    permission: 0,
    credits: "ShourovXSXX",
    description: "Prevent unauthorized group changes (name / photo)",
    prefix: true,
    category: "box",
    usages: "antichange [on/off]",
    cooldowns: 5,
  },

  execute: async ({ api, message, args }) => {
    const threadID = message.threadID;
    const senderID = message.senderID;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupAdmins = threadInfo.adminIDs.map(admin => admin.id);
    const botAdmins = (process.env.ADMIN_IDS || "").split(",");

    // Permission check
    if (!groupAdmins.includes(senderID) && !botAdmins.includes(senderID)) {
      return api.sendMessage("⚠️ Only group admins or bot admins can use this command.", threadID);
    }

    if (args[0] === "on") {
      if (!activeGroups[threadID]) {
        activeGroups[threadID] = {
          name: threadInfo.threadName,
          image: threadInfo.imageSrc || ""
        };
        saveActiveGroups();
        return api.sendMessage("✅ Anti-change has been enabled for this group.", threadID);
      } else {
        return api.sendMessage("⚠️ Anti-change is already active here.", threadID);
      }
    }

    if (args[0] === "off") {
      if (activeGroups[threadID]) {
        delete activeGroups[threadID];
        saveActiveGroups();
        return api.sendMessage("🚫 Anti-change has been disabled for this group.", threadID);
      } else {
        return api.sendMessage("⚠️ Anti-change was not active here.", threadID);
      }
    }

    return api.sendMessage("⚠️ Invalid option.\nUsage: antichange [on/off]", threadID);
  }
};
