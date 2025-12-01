// commands/adduser.js
module.exports.config = {
  name: "adduser",
  version: "1.0.1",
  permission: 0,
  credits: "D-Jukie (fixed)",
  description: "Add a user to the group by link or UID",
  prefix: true,
  category: "Box chat",
  usages: "<link|UID>",
  cooldowns: 5
};

const axios = require('axios');

async function addUserToGroupAsync(api, uid, threadID) {
  if (!api || !uid || !threadID) throw new Error('Missing parameters for addUserToGroup');

  // Try promise-style first
  try {
    const maybePromise = api.addUserToGroup(uid, threadID);
    if (maybePromise && typeof maybePromise.then === 'function') {
      return await maybePromise;
    }
  } catch (e) {
    // continue to callback-wrap below
  }

  // Fallback: wrap callback-style api.addUserToGroup(uid, threadID, cb)
  return new Promise((resolve, reject) => {
    try {
      api.addUserToGroup(uid, threadID, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports.run = async function ({ api, event, args, Threads, Users }) {
  const { threadID, messageID } = event;
  const text = args.join(" ").trim();

  if (!text) {
    return api.sendMessage("❗ Please provide a profile link or a user ID to add.", threadID, messageID);
  }

  try {
    // get thread info (participants, approval mode, admins)
    let threadInfo = {};
    try {
      threadInfo = (typeof api.getThreadInfo === 'function') ? await api.getThreadInfo(threadID) : {};
    } catch (e) {
      threadInfo = {};
    }

    const participantIDs = Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs.map(String) : [];
    const approvalMode = !!threadInfo.approvalMode;
    const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];

    // determine UID from link or direct input
    let uidToAdd = null;
    if (text.indexOf(".com/") !== -1) {
      try {
        const resp = await axios.get(`https://golike.com.vn/func-api.php?user=${encodeURIComponent(text)}`, { timeout: 8000 });
        if (resp && resp.data && resp.data.data && resp.data.data.uid) {
          uidToAdd = String(resp.data.data.uid);
        } else {
          return api.sendMessage("❗ Could not extract UID from the provided link. Please provide a direct UID if possible.", threadID, messageID);
        }
      } catch (e) {
        console.error("Link->UID lookup failed:", e && e.message ? e.message : e);
        return api.sendMessage("❗ Failed to resolve link to UID (network or service error). Try direct UID.", threadID, messageID);
      }
    } else {
      uidToAdd = text;
    }

    // validate numeric UID
    if (!uidToAdd || !/^\d+$/.test(String(uidToAdd))) {
      return api.sendMessage("❗ The UID looks invalid. Make sure you provided a numeric UID.", threadID, messageID);
    }

    // check if already in group
    if (participantIDs.includes(String(uidToAdd))) {
      return api.sendMessage("✅ That user is already a member of this group.", threadID, messageID);
    }

    // attempt to add
    try {
      await addUserToGroupAsync(api, uidToAdd, threadID);
    } catch (errAdd) {
      console.error("addUserToGroup error:", errAdd && (errAdd.stack || errAdd));
      return api.sendMessage("❗ Failed to add user. Possible reasons: user has invite privacy, bot lacks permission, or the UID is invalid.", threadID, messageID);
    }

    // after successful add: check approval mode
    const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;
    const isAdmin = adminIDs.some(a => {
      const id = a && (a.id || a) ? String(a.id || a) : null;
      return id && botId && id === String(botId);
    });

    if (approvalMode && !isAdmin) {
      return api.sendMessage("✅ Invitation sent — user added to the approval list (group requires admin approval).", th
