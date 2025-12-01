module.exports.config = {
  name: "adduser",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Add a user to the group by link or UID",
  prefix: true,
  category: "Box chat",
  usages: "<link|UID>",
  cooldowns: 5
};

const axios = require('axios');

async function addUserToGroupAsync(api, uid, threadID) {
  // support both callback-style and promise-style implementations
  if (!api || !uid || !threadID) throw new Error('Missing parameters for addUserToGroup');
  // If api.addUserToGroup returns a promise, use it
  try {
    const res = api.addUserToGroup(uid, threadID);
    if (res && typeof res.then === 'function') {
      return await res;
    }
  } catch (e) {
    // if it throws synchronously, we'll try callback version below
  }

  // fallback: wrap callback-style in a Promise
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
  const { threadID, messageID, senderID } = event;
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
    const participantIDs = Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs : [];
    const approvalMode = !!threadInfo.approvalMode;
    const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs : [];

    // decide if input is a link (contains .com/) or direct uid
    let uidToAdd = null;
    if (text.indexOf(".com/") !== -1) {
      // try to resolve link -> uid using golike (as original)
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

    // sanity check uid format
    if (!uidToAdd || !/^\d+$/.test(String(uidToAdd))) {
      return api.sendMessage("❗ The UID looks invalid. Make sure you provided a numeric UID.", threadID, messageID);
    }

    // check already in group
    if (participantIDs.includes(uidToAdd)) {
      return api.sendMessage("✅ That user is already a member of this group.", threadID, messageID);
    }

    // attempt to add
    try {
      await addUserToGroupAsync(api, uidToAdd, threadID);
    } catch (errAdd) {
      console.error("addUserToGroup error:", errAdd && errAdd.stack ? errAdd.stack : errAdd);
      // common reason: Privacy / cannot add (user disabled invites) or missing permission
      return api.sendMessage("❗ Failed to add user. Possible reasons: user has invite privacy, bot lacks permission, or the UID is invalid.", threadID, messageID);
    }

    // On success: behavior depends on approval mode and admin presence
    const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;
    const isAdmin = adminIDs.some
