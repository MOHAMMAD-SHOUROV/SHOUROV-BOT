const num = 3;   // spam গণনা: যদি ব্যবহারকারী এই many times কমান্ড স্প্যাম করে তাহলে ban করবে
const timee = 10; // উপরের সংখ্যা timee সেকেন্ডের মধ্যে হলে ban হবে

module.exports.config = {
  name: "antispam",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "automatically ban spammer",
  prefix: true,
  category: "system",
  usages: "none",
  cooldowns: 0,
};

module.exports.languages = {
  "vi": {},
  "en": {}
}

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(`Auto-ban: if you spam ${num} times within ${timee}s, you will be banned.`, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  try {
    const { senderID, threadID } = event;

    // Ensure thread data retrieval safe
    let datathread = {};
    try {
      datathread = (await Threads.getData(threadID)).threadInfo || {};
    } catch (e) {
      datathread = {};
    }

    // init structures
    if (!global.client.autoban) global.client.autoban = {};
    if (!global.data) global.data = {};
    if (!global.data.userBanned) global.data.userBanned = new Map();

    // skip if message is from bot
    if (String(senderID) === String(global.data.botID || global.config.BOTID || "")) return;

    // keep user record
    if (!global.client.autoban[senderID]) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };
    }

    // get prefix for this thread
    const threadSetting = global.data.threadData ? (global.data.threadData.get(threadID) || {}) : {};
    const prefix = threadSetting.PREFIX || global.config.PREFIX || "";

    // only count when message begins with prefix (i.e., command spam)
    if (!event.body || prefix === "" || event.body.indexOf(prefix) !== 0) return;

    // reset counter if time window passed
    if ((global.client.autoban[senderID].timeStart + (timee * 1000)) <= Date.now()) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };
      return;
    } else {
      global.client.autoban[senderID].number++;
      // if exceed limit -> ban
      if (global.client.autoban[senderID].number >= num) {

        // don't ban admins/operators/bot owner
        try {
          const adminList = global.config.ADMINBOT || [];
          const operators = global.config.OPERATOR || [];
          if (adminList.includes(senderID.toString()) || operators.includes(senderID.toString())) {
            // reset counter and ignore
            global.client.autoban[senderID] = { timeStart: Date.now(), number: 0 };
            return;
          }
        } catch (e) { /* ignore */ }

        // check if already banned
        let dataUser = await Users.getData(senderID) || {};
        let data = dataUser.data || {};
        if (data && data.banned == true) {
          // already banned - reset counter
          global.client.autoban[senderID] = { timeStart: Date.now(), number: 0 };
          return;
        }

        // prepare ban data
        const moment = require("moment-timezone");
        const timeDate = moment.tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");
        data.banned = true;
        data.reason = `spam bot ${num} times/${timee}s`;
        data.dateAdded = timeDate;
        await Users.setData(senderID, { data });
        global.data.userBanned.set(senderID, { reason: data.reason, dateAdded: data.dateAdded });

        // reset counter for this user
        global.client.autoban[senderID] = {
          timeStart: Date.now(),
          number: 0
        };

        // notify group and admins
        const nameUser = dataUser.name || senderID;
        const groupName = datathread.threadName || "Unknown";
        const notifyMsg = `🔒 Spam-ban executed\n\nName: ${nameUser}\nUser ID: ${senderID}\nReason: ${data.reason}\nGroup: ${groupName}\nGroup ID: ${threadID}\nTime: ${timeDate}`;

        // send message to group (mentioning user id to show info)
        try {
          await api.sendMessage(`User ${nameUser} (${senderID}) has been banned for spamming commands (${num}/${timee}s).\nReport sent to admins.`, threadID);
        } catch (e) { /* ignore errors sending to group */ }

        // notify admins from config.ADMINBOT
        try {
          const adminIDs = global.config.ADMINBOT || [];
          for (const ad of adminIDs) {
            try {
              await api.sendMessage(notifyMsg, ad);
            } catch (e) { /* ignore per-admin send failure */ }
          }
        } catch (e) { /* ignore */ }

      }
    }
  } catch (err) {
    console.error("antispam handleEvent error:", err);
  }
};// commands/antispam.js
const numDefault = 3; // default number of times spam triggers ban
const timeDefault = 10; // default time window in seconds

module.exports.config = {
  name: "antispam",
  version: "1.0.2",
  permission: 0,
  credits: "shourov",
  description: "Automatically mark users banned when they spam commands",
  prefix: true,
  category: "system",
  usages: "none",
  cooldowns: 0
};

module.exports.name = module.exports.config.name;

module.exports.languages = {
  "vi": {},
  "en": {}
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    `Automatically ban users if they spam ${numDefault} times within ${timeDefault} seconds.`,
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  try {
    // Only consider messages with a body
    const body = event && (event.body || "");
    if (!body) return;

    const { senderID: rawSenderID, threadID } = event;
    const senderID = String(rawSenderID);

    // Ensure global.client.autoban exists
    if (!global.client) global.client = {};
    if (!global.client.autoban) global.client.autoban = {}; // keyed by senderID

    // get thread settings (best-effort)
    let threadSetting = {};
    try {
      if (global.data && global.data.threadData && typeof global.data.threadData.get === "function") {
        threadSetting = global.data.threadData.get(threadID) || {};
      }
    } catch (e) {
      threadSetting = {};
    }

    // Determine prefix (fallback to "/" if not found)
    const prefix = (threadSetting && threadSetting.PREFIX) || (global.config && global.config.PREFIX) || "/";

    // Only consider messages that start with prefix
    if (!body.startsWith(prefix)) return;

    // track usage (best-effort: allow override via config at top)
    const num = typeof module.exports.config.num === "number" ? module.exports.config.num : numDefault;
    const timee = typeof module.exports.config.timee === "number" ? module.exports.config.timee : timeDefault;

    // initialize sender entry if needed
    if (!global.client.autoban[senderID]) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 1 // count current message
      };
      return;
    }

    const entry = global.client.autoban[senderID];

    // if window expired -> reset and count current
    if ((entry.timeStart + timee * 1000) <= Date.now()) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 1
      };
      return;
    } else {
      entry.number = (entry.number || 0) + 1;
    }

    // if exceeded threshold -> ban (mark in Users data) and notify admins
    if (entry.number >= num) {
      // reset counter
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };

      // fetch user data & ban flag
      let userData = {};
      try {
        if (Users && typeof Users.getData === "function") userData = (await Users.getData(senderID)) || {};
      } catch (e) { userData = {}; }

      const data = userData.data || {};
      if (data && data.banned) {
        // already banned
        return;
      }

      // prepare ban metadata
      const moment = require("moment-timezone");
      const timeDate = moment.tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss");
      data.banned = true;
      data.reason = `Spam ${num} times / ${timee}s`;
      data.dateAdded = timeDate;

      try {
        if (Users && typeof Users.setData === "function") {
          await Users.setData(senderID, { data });
        }
        // also set global map for quick lookup
        if (!global.data) global.data = {};
        if (!global.data.userBanned) global.data.userBanned = new Map();
        global.data.userBanned.set(senderID, { reason: data.reason, dateAdded: data.dateAdded });
      } catch (e) {
        console.warn("[antispam] Failed to persist user ban data:", e && e.message ? e.message : e);
      }

      // resolve thread name
      let threadName = threadID;
      try {
        if (Threads && typeof Threads.getData === "function") {
          const th = await Threads.getData(threadID);
          if (th && th.threadInfo && (th.threadInfo.threadName || th.threadInfo.name)) threadName = th.threadInfo.threadName || th.threadInfo.name;
        } else if (typeof api.getThreadInfo === "function") {
          const ti = await api.getThreadInfo(threadID);
          if (ti && (ti.threadName || ti.name)) threadName = ti.threadName || ti.name;
        }
      } catch (e) { /* ignore */ }

      // user display name
      let userName = senderID;
      try {
        if (Users && typeof Users.getNameUser === "function") userName = await Users.getNameUser(senderID);
      } catch (e) { /* ignore */ }

      // notify group
      try {
        const notifyText = `🚫 User has been auto-banned for spamming commands.\n\nName: ${userName}\nUID: ${senderID}\nGroup: ${threadName}\nReason: ${data.reason}\nTime: ${data.dateAdded}`;
        await api.sendMessage(notifyText, threadID);
      } catch (e) {
        console.warn("[antispam] Failed to send ban notice to group:", e && e.message ? e.message : e);
      }

      // notify bot admins
      try {
        const adminList = Array.isArray(global.config && global.config.ADMINBOT) ? global.config.ADMINBOT : [];
        const adminNotice = `🔔 Auto-ban alert\n\nOffender: ${userName}\nUID: ${senderID}\nGroup: ${threadName}\nReason: ${data.reason}\nTime: ${data.dateAdded}`;
        for (const adm of adminList) {
          try { await api.sendMessage(adminNotice, String(adm)); } catch (_) { /* ignore per admin */ }
        }
      } catch (e) {
        console.warn("[antispam] Failed to notify admins:", e && e.message ? e.message : e);
      }
    }
  } catch (err) {
    console.error("[antispam] handleEvent error:", err && (err.stack || err));
  }
};