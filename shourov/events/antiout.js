module.exports.config = {
  name: "antiout",
  eventType: ["log:unsubscribe"],
  version: "1.0.0",
  credits: "shourov (fixed)",
  description: "Re-add users who left (if antiout enabled)"
};

module.exports.run = async function ({ event, api, Threads, Users }) {
  try {
    if (!event || !event.logMessageData) return;

    const threadID = event.threadID || (event.thread_key && event.thread_key.thread_fbid);
    if (!threadID) return;

    const botId = (typeof api.getCurrentUserID === "function") ? api.getCurrentUserID() : null;
    const leftId = event.logMessageData.leftParticipantFbId;
    if (!leftId) return;

    // ignore if bot itself left
    if (botId && String(leftId) === String(botId)) return;

    // safe Threads.getData usage
    let threadData = {};
    try {
      if (Threads && typeof Threads.getData === "function") {
        const res = await Threads.getData(threadID).catch(() => null);
        // Many implementations return { data: { ... } } or { threadInfo: {...} } etc.
        if (res && res.data) threadData = res.data;
        else if (res && res.threadInfo) threadData = res.threadInfo;
        else threadData = res || {};
      } else if (global.data && global.data.threadData && typeof global.data.threadData.get === "function") {
        threadData = global.data.threadData.get(parseInt(threadID)) || {};
      }
    } catch (e) {
      threadData = {};
    }

    // if antiout explicitly set to false, do nothing
    if (threadData.hasOwnProperty('antiout') && threadData.antiout === false) return;

    // who left (name)
    let name = null;
    try {
      if (global.data && global.data.userName && global.data.userName.get) {
        name = global.data.userName.get(leftId);
      }
      if (!name && Users && typeof Users.getNameUser === "function") {
        name = await Users.getNameUser(leftId).catch(() => null);
      }
    } catch (e) {
      name = null;
    }
    if (!name) name = `User${String(leftId).slice(-4)}`;

    // determine if user left by themself or was kicked
    const leftBySelf = (String(event.author) === String(leftId));
    const type = leftBySelf ? "self-left" : "removed-by-admin";

    // only try to re-add when user left by themself (common use-case)
    if (leftBySelf) {
      try {
        // Many APIs expect (userID, threadID, callback) or return a promise.
        if (typeof api.addUserToGroup === "function") {
          // try promise-style
          const maybePromise = api.addUserToGroup(leftId, threadID);
          if (maybePromise && typeof maybePromise.then === "function") {
            await maybePromise;
            await api.sendMessage(`${name} has been re-added to the group (antiout).`, threadID);
            return;
          } else {
            // callback-style
            api.addUserToGroup(leftId, threadID, (err, info) => {
              if (err) {
                api.sendMessage(`Unable to re-add ${name}. They may have blocked the bot or disabled receiving messages from non-friends.`, threadID);
              } else {
                api.sendMessage(`${name} has been re-added to the group (antiout).`, threadID);
              }
            });
            return;
          }
        } else {
          // No addUserToGroup available: notify admins
          await api.sendMessage(`⚠️ Cannot re-add ${name} automatically: api.addUserToGroup not available.`, threadID);
          return;
        }
      } catch (err) {
        console.warn("antiout: addUserToGroup failed:", err && (err.message || err));
        try {
          await api.sendMessage(`Attempt to re-add ${name} failed. They may have blocked the bot or changed privacy settings.`, threadID);
        } catch (_) {}
        return;
      }
    } else {
      // If user was kicked by admin, do not auto re-add; just notify
      try {
        await api.sendMessage(`${name} left the group (${type}). antiout attempted only for self-leaves.`, threadID);
      } catch (e) {}
      return;
    }

  } catch (err) {
    console.error("antiout handler error:", err && (err.stack || err));
  }
};
