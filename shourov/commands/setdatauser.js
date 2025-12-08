/**
 * setdatauser.js
 * Compatible with your shourovbot loader (uses provided Users/Threads services or fallbacks)
 */

module.exports.config = {
  name: "setdatauser",
  version: "1.2.0",
  permission: 2,
  credits: "Shourov",
  description: "Safely update user database from current group (shourovbot-compatible)",
  category: "admin",
  usages: "",
  cooldowns: 5,
  prefix: true
};

module.exports.run = async function (payload) {
  // Accept many loader styles: ({ Users, event, api, Threads }) or ({ event, api, Users, Threads })
  const Users = payload.Users || payload.UsersService || global.UsersService || global._fallbackUsers;
  const Threads = payload.Threads || payload.ThreadsService || global.ThreadsService || global._fallbackThreads;
  const api = payload.api || payload.shourov || global.api;
  const event = payload.event || payload.events || payload;

  // Determine threadID defensively
  const threadID = event && (event.threadID || (event.thread && event.thread.threadID) ||
    (event.thread_key && event.thread_key.thread_fbid) || event.senderID) || null;

  if (!api) {
    console.warn("[setdatauser] Missing 'api' interface. Aborting.");
    if (event && threadID && typeof api?.sendMessage === "function") {
      try { api.sendMessage("⚠️ Command cannot run: missing API interface.", threadID); } catch(e){}
    }
    return;
  }

  if (!Users) {
    console.warn("[setdatauser] Missing 'Users' service. Aborting.");
    return api.sendMessage("⚠️ Command cannot run: missing Users service.", threadID);
  }

  if (!threadID) {
    return api.sendMessage("⚠️ Không thể xác định thread ID.", event.threadID || threadID);
  }

  try {
    // Try to get thread info using Threads service first, else api.getThreadInfo
    let threadInfo = null;
    try {
      if (Threads && typeof Threads.getInfo === 'function') {
        threadInfo = await Threads.getInfo(threadID);
      } else if (typeof api.getThreadInfo === 'function') {
        threadInfo = await api.getThreadInfo(threadID);
      }
    } catch (e) {
      // fallback to api.getThreadInfo
      try { threadInfo = await api.getThreadInfo(threadID); } catch (err) { threadInfo = null; }
    }

    // Normalize participant list shapes
    let participants = [];
    if (threadInfo) {
      if (Array.isArray(threadInfo.participantIDs)) {
        // Could be ['1000', '1001'] or [{id:'1000'}, {id:'1001'}]
        if (threadInfo.participantIDs.length && typeof threadInfo.participantIDs[0] === 'object') {
          participants = threadInfo.participantIDs.map(p => p.id || p);
        } else {
          participants = threadInfo.participantIDs.slice();
        }
      } else if (Array.isArray(threadInfo.userInfo)) {
        participants = threadInfo.userInfo.map(u => u.id || u);
      }
    }

    // If still empty, attempt to use api.getThreadInfo directly as last resort
    if (!participants.length) {
      try {
        const t2 = await api.getThreadInfo(threadID);
        if (t2 && Array.isArray(t2.participantIDs)) {
          participants = t2.participantIDs.map(p => (typeof p === 'object' ? p.id : p));
        }
      } catch (e) {
        // ignore
      }
    }

    if (!participants || participants.length === 0) {
      return api.sendMessage("❗ Không tìm thấy thành viên trong cuộc trò chuyện này.", threadID);
    }

    let updated = 0;
    // Loop through participants and update Users data safely
    for (const uidRaw of participants) {
      const uid = String(uidRaw);
      if (!uid) continue;

      try {
        // Fetch user info from api if possible
        let info = null;
        try {
          if (typeof api.getUserInfo === 'function') {
            info = await api.getUserInfo(uid);
          }
        } catch (e) {
          info = null;
        }

        // Resolve name from various possible shapes
        let name = "Unknown User";
        if (info) {
          if (info[uid] && info[uid].name) name = info[uid].name;
          else if (info.name) name = info.name;
          else {
            const keys = Object.keys(info);
            if (keys.length && info[keys[0]] && info[keys[0]].name) name = info[keys[0]].name;
          }
        } else {
          // try Threads.getData or fallback name retrieval
          try {
            if (typeof Users.getNameUser === 'function') {
              name = await Users.getNameUser(uid) || name;
            } else if (typeof Threads.getData === 'function') {
              const tdata = await Threads.getData(threadID);
              if (tdata && tdata.nicknames && tdata.nicknames[uid]) name = tdata.nicknames[uid];
            }
          } catch (e){}
        }

        // Preserve existing structure: load old data if possible
        let oldData = {};
        try {
          if (typeof Users.getData === 'function') {
            oldData = (await Users.getData(uid)) || {};
          } else if (typeof Users.get === 'function') {
            oldData = (await Users.get(uid)) || {};
          }
        } catch (e) {
          oldData = {};
        }

        const finalData = {
          // copy previous fields (if any) to preserve unknown structure
          ...(oldData || {}),
          name: name,
          data: (oldData && oldData.data) ? oldData.data : {}
        };

        // Save with available setter
        if (typeof Users.setData === 'function') {
          await Users.setData(uid, finalData);
        } else if (typeof Users.update === 'function') {
          await Users.update(uid, finalData);
        } else if (typeof Users.set === 'function') {
          await Users.set(uid, finalData);
        } else {
          console.warn("[setdatauser] No supported Users.save function found for", uid);
        }

        updated++;
        console.log(`[setdatauser] Updated ${uid} -> ${name}`);
        // gentle pacing to avoid rate limits (optional)
        // await new Promise(r => setTimeout(r, 150));
      } catch (err) {
        console.error(`[setdatauser] Failed to update ${uid}:`, err && err.message ? err.message : err);
        // continue to next user
      }
    }

    return api.sendMessage(`✔ Successfully updated user data.\n👥 Total updated users: ${updated}`, threadID);
  } catch (error) {
    console.error('[setdatauser] Fatal error:', error && (error.stack || error.message || error));
    return api.sendMessage(`❌ Error updating data: ${error && error.message ? error.message : String(error)}`, threadID);
  }
};