// commands/antispam.js
const num = 3; // number of times spam triggers ban (e.g. 3)
const timee = 10; // time window in seconds

module.exports.config = {
  name: "antispam",
  version: "1.0.1",
  permission: 0,
  credits: "shourov (fixed)",
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
  return api.sendMessage(`Automatically ban users if they spam ${num} times within ${timee} seconds.`, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  try {
    const { senderID: rawSenderID, threadID } = event;
    const senderID = String(rawSenderID);

    // make sure Threads and Users helpers exist
    const getThreadData = Threads && typeof Threads.getData === 'function' ? Threads.getData : null;
    const setUserData = Users && typeof Users.setData === 'function' ? Users.setData : null;
    const getUserData = Users && typeof Users.getData === 'function' ? Users.getData : null;

    // ensure autoban tracker exists
    if (!global.client) global.client = {};
    if (!global.client.autoban) global.client.autoban = {}; // keyed by senderID

    // get thread settings (try global.data.threadData then fallback)
    const threadSetting = (global.data && global.data.threadData && global.data.threadData.get) ? global.data.threadData.get(threadID) || {} : {};
    const prefix = (threadSetting && threadSetting.PREFIX) ? threadSetting.PREFIX : (global.config && global.config.PREFIX) ? global.config.PREFIX : "/";

    // only consider messages that start with prefix and have body
    const body = (event.body || "");
    if (!body || !body.startsWith(prefix)) return;

    // initialize sender entry if needed
    if (!global.client.autoban[senderID]) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };
    }

    // reset window if time exceeded
    const entry = global.client.autoban[senderID];
    if ((entry.timeStart + (timee * 1000)) <= Date.now()) {
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 1 // count current message
      };
      return;
    } else {
      entry.number++;
    }

    // if exceeded threshold -> ban (mark in Users data) and notify admins
    if (entry.number >= num) {
      // reset counter for this user
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };

      // fetch user info (best-effort)
      let userData = {};
      try {
        if (getUserData) userData = (await getUserData(senderID)) || {};
      } catch (e) {
        userData = {};
      }
      const data = userData.data || {};
      if (data && data.banned) {
        // already banned — do nothing
        return;
      }

      // ban record
      const moment = require("moment-timezone");
      const timeDate = moment.tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss");

      data.banned = true;
      data.reason = `Spam ${num} times / ${timee}s`;
      data.dateAdded = timeDate;

      try {
        if (setUserData) {
          await setUserData(senderID, { data });
        }
        // also set global map
        if (!global.data) global.data = {};
        if (!global.data.userBanned) global.data.userBanned = new Map();
        global.data.userBanned.set(senderID, { reason: data.reason, dateAdded: data.dateAdded });
      } catch (e) {
        console.warn("Failed to persist user ban data:", e && e.message ? e.message : e);
      }

      // Prepare notification messages
      // thread name from Threads.getData or api.getThreadInfo
      let threadName = threadID;
      try {
        if (getThreadData) {
          const th = await getThreadData(threadID);
          if (th && th.threadInfo && th.threadInfo.threadName) threadName = th.threadInfo.threadName;
        } else if (typeof api.getThreadInfo === 'function') {
          const ti = await api.getThreadInfo(threadID);
          if (ti && ti.threadName) threadName = ti.threadName;
        }
      } catch (e) { /* ignore */ }

      // user display name
      let userName = senderID;
      try {
        if (Users && typeof Users.getNameUser === 'function') userName = await Users.getNameUser(senderID);
      } catch (e) {}

      // notify group (short)
      try {
        const notifyText = `🚫 User has been auto-banned for spamming commands.\n\nName: ${userName}\nUID: ${senderID}\nGroup: ${threadName}\nReason: ${data.reason}\nTime: ${data.dateAdded}`;
        await api.sendMessage(notifyText, threadID);
      } catch (e) {
        console.warn("Failed to send ban notice to group:", e && e.message ? e.message : e);
      }

      // notify bot admins
      try {
        const adminList = Array.isArray(global.config && global.config.ADMINBOT) ? global.config.ADMINBOT : [];
        const adminNotice = `🔔 Auto-ban alert\n\nOffender: ${userName}\nUID: ${senderID}\nGroup: ${threadName}\nReason: ${data.reason}\nTime: ${data.dateAdded}`;
        for (const adm of adminList) {
          try {
            await api.sendMessage(adminNotice, String(adm));
          } catch (e) { /* ignore per admin */ }
        }
      } catch (e) {
        console.warn("Failed to notify admins:", e && e.message ? e.message : e);
      }

    } // end if threshold
  } catch (err) {
    console.error("antispam handleEvent error:", err && (err.stack || err));
  }
};
