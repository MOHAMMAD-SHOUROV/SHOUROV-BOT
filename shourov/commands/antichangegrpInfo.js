// commands/antichange.js
const fs = require("fs-extra");
const path = require("path");

const activeGroupsFilePath = path.join(__dirname, '..', 'events', 'shourov', 'groupSettings.json');

let activeGroups = {};
if (fs.existsSync(activeGroupsFilePath)) {
  try {
    const fileData = fs.readFileSync(activeGroupsFilePath, "utf-8");
    activeGroups = JSON.parse(fileData) || {};
    if (typeof activeGroups !== "object") activeGroups = {};
  } catch (error) {
    console.error("Error loading active groups:", error);
    activeGroups = {};
  }
}

function saveActiveGroups() {
  try {
    fs.ensureDirSync(path.dirname(activeGroupsFilePath));
    fs.writeFileSync(activeGroupsFilePath, JSON.stringify(activeGroups, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving active groups:", error);
  }
}

module.exports.config = {
  name: "antichange",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Prevents unauthorized group changes (toggle on/off)",
  prefix: true,
  category: "box",
  usages: "antichange [on/off]",
  cooldowns: 5
};

module.exports.name = module.exports.config.name;

module.exports.run = async function ({ api, event, args, Threads }) {
  try {
    const threadID = event.threadID;
    const senderID = String(event.senderID || event.author || "");

    // get admins from thread
    let threadInfo = {};
    try {
      if (typeof api.getThreadInfo === "function") threadInfo = await api.getThreadInfo(threadID) || {};
    } catch (e) {
      threadInfo = {};
    }
    const groupAdmins = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs.map(a => String(a.id || a)) : [];

    // bot admins from config
    const botAdmins = Array.isArray(global.config && global.config.ADMINBOT) ? global.config.ADMINBOT.map(String) : [];

    // only allow group admin or bot admin
    if (!groupAdmins.includes(senderID) && !botAdmins.includes(senderID)) {
      return api.sendMessage("⚠️ Only group admins or bot admins can use this command.", threadID);
    }

    // ensure Threads helpers
    const { getData, setData } = Threads || {};
    let groupData = {};
    if (typeof getData === "function") {
      try { groupData = (await getData(threadID)) || {}; } catch (e) { groupData = {}; }
    }

    const opt = (args && args[0]) ? String(args[0]).toLowerCase() : "";

    // fetch initial thread info for snapshot
    let initInfo = {};
    try {
      initInfo = (typeof api.getThreadInfo === "function") ? await api.getThreadInfo(threadID) : {};
    } catch (e) {
      initInfo = {};
    }
    const initialGroupName = initInfo.threadName || "";
    const initialGroupImage = initInfo.imageSrc || initInfo.image || "";

    if (opt === "on") {
      if (activeGroups[threadID]) {
        return api.sendMessage("⚠️ Anti-change feature is already active for this group.", threadID);
      }

      activeGroups[threadID] = {
        name: initialGroupName,
        image: initialGroupImage,
        enabledBy: senderID,
        enabledAt: Date.now()
      };

      // persist to threads data (if setData available)
      try {
        if (typeof setData === "function") {
          // attach a flag in threadInfo so other parts can read it
          const existing = (groupData && groupData.threadInfo) ? groupData.threadInfo : {};
          existing.antichange = true;
          await setData(threadID, { threadInfo: existing });
        }
      } catch (e) {
        console.warn("Could not set Threads data for antichange:", e && e.message ? e.message : e);
      }

      saveActiveGroups();
      return api.sendMessage("✅ Anti-change feature has been activated for this group.", threadID);
    } else if (opt === "off") {
      if (!activeGroups[threadID]) {
        return api.sendMessage("⚠️ Anti-change feature is not active for this group.", threadID);
      }

      delete activeGroups[threadID];

      // remove flag in thread data if possible
      try {
        if (typeof setData === "function") {
          const existing = (groupData && groupData.threadInfo) ? groupData.threadInfo : {};
          if (existing.antichange) delete existing.antichange;
          await setData(threadID, { threadInfo: existing });
        }
      } catch (e) {
        console.warn("Could not update Threads data for antichange:", e && e.message ? e.message : e);
      }

      saveActiveGroups();
      return api.sendMessage("🚫 Anti-change feature has been deactivated for this group.", threadID);
    } else {
      return api.sendMessage("⚠️ Invalid option. Use: antichange on  OR  antichange off", threadID);
    }
  } catch (err) {
    console.error("antichange command error:", err && (err.stack || err));
    try { return api.sendMessage("❗ An error occurred while processing the request.", event.threadID); } catch (_) {}
  }
};
