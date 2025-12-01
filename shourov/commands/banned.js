// commands/banned.js
module.exports.config = {
  name: "banned",
  version: "1.0.1",
  permission: 2,
  credits: "shourov (fixed)",
  prefix: true,
  description: "Show banned users or threads",
  category: "admin",
  usages: "banned user | banned thread",
  cooldowns: 5,
};

module.exports.run = async function ({ api, args, Users, event, Threads }) {
  try {
    const type = (args[0] || "").toString().toLowerCase();

    if (type === "user") {
      // global.data.userBanned may be a Map, Set, Array or plain Object
      const raw = global.data && global.data.userBanned ? global.data.userBanned : [];
      const ids = [];

      if (raw instanceof Map) {
        for (const key of raw.keys()) ids.push(String(key));
      } else if (Array.isArray(raw)) {
        for (const v of raw) ids.push(String(v));
      } else if (raw && typeof raw === "object") {
        // object or Set-like
        if (raw instanceof Set) for (const v of raw) ids.push(String(v));
        else ids.push(...Object.keys(raw));
      }

      const bannedUsers = [];
      for (const uid of ids) {
        try {
          const udata = (await Users.getData(uid)) || {};
          // check various possible banned flags
          const bannedFlag = udata.banned || (udata.data && udata.data.banned) || udata.isBanned;
          if (bannedFlag === true || bannedFlag === 1) {
            const name = udata.name || (await Users.getNameUser(uid)).toString();
            bannedUsers.push({ id: uid, name });
          }
        } catch (e) {
          // ignore individual errors, continue
        }
      }

      if (bannedUsers.length === 0) {
        return api.sendMessage("✅ Currently no users are banned.", event.threadID, event.messageID);
      }

      let msg = "❎ Users banned from the system:\n\n";
      bannedUsers.forEach((u, i) => {
        msg += `${i + 1}. Name: ${u.name}\n   ID: ${u.id}\n\n`;
      });

      return api.sendMessage(msg.trim(), event.threadID, event.messageID);
    }

    else if (type === "thread" || type === "group") {
      const raw = global.data && global.data.threadBanned ? global.data.threadBanned : [];
      const ids = [];

      if (raw instanceof Map) {
        for (const key of raw.keys()) ids.push(String(key));
      } else if (Array.isArray(raw)) {
        for (const v of raw) ids.push(String(v));
      } else if (raw && typeof raw === "object") {
        if (raw instanceof Set) for (const v of raw) ids.push(String(v));
        else ids.push(...Object.keys(raw));
      }

      const bannedThreads = [];
      for (const tid of ids) {
        try {
          const tdata = (await Threads.getData(tid)) || {};
          const bannedFlag = tdata.banned || (tdata.data && tdata.data.banned) || tdata.isBanned;
          if (bannedFlag === true || bannedFlag === 1) {
            // attempt to get thread name (may fail if bot left)
            let threadName = tid;
            try {
              const info = await api.getThreadInfo(tid);
              threadName = info.threadName || threadName;
            } catch (e) {}
            bannedThreads.push({ id: tid, name: threadName });
          }
        } catch (e) {
          // ignore
        }
      }

      if (bannedThreads.length === 0) {
        return api.sendMessage("✅ Currently no threads are banned.", event.threadID, event.messageID);
      }

      let msg = "❎ Threads banned from the system:\n\n";
      bannedThreads.forEach((t, i) => {
        msg += `${i + 1}. Name: ${t.name}\n   ID: ${t.id}\n\n`;
      });

      return api.sendMessage(msg.trim(), event.threadID, event.messageID);
    }

    else {
      return api.sendMessage("⚠️ Usage: banned user   |   banned thread", event.threadID, event.messageID);
    }
  } catch (err) {
    console.error("banned command error:", err && (err.stack || err));
    try { return api.sendMessage("❗ An unexpected error occurred while fetching banned list.", event.threadID, event.messageID); } catch (e) {}
  }
};
