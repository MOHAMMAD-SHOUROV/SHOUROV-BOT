// commands/allgroups.js
module.exports.config = {
  name: "allgroups",
  version: "2.0.1",
  permission: 2,
  credits: "SHOUROV (fixed)",
  description: "List all groups; reply to leave/ban by number",
  prefix: true,
  category: "admin",
  usages: "allgroups",
  cooldowns: 5,
};

module.exports.name = module.exports.config.name;

module.exports.handleReply = async function ({ api, event, args, Threads, handleReply }) {
  try {
    // only original requester can use the reply menu
    if (String(event.senderID) !== String(handleReply.author)) return;

    const text = (event.body || "").trim();
    if (!text) return;

    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const idx = parseInt(parts[1], 10);

    if (!idx || idx <= 0) {
      return api.sendMessage("Please reply with: out <number>  or  ban <number>", event.threadID, event.messageID);
    }

    const groupId = handleReply.groupid && handleReply.groupid[idx - 1];
    if (!groupId) {
      return api.sendMessage("Group not found for that number.", event.threadID, event.messageID);
    }

    // fetch thread data safely
    let threadData = {};
    try {
      if (Threads && typeof Threads.getData === 'function') {
        threadData = (await Threads.getData(groupId)) || {};
      } else if (typeof api.getThreadInfo === 'function') {
        const info = await api.getThreadInfo(groupId);
        threadData = { data: {} , name: info.threadName };
      }
    } catch (e) {
      threadData = {};
    }

    switch (cmd) {
      case "ban":
      case "Ban":
      case "BAN": {
        // set banned flag using Threads if available
        try {
          if (Threads && typeof Threads.getData === 'function' && typeof Threads.setData === 'function') {
            const existing = (await Threads.getData(groupId)) || {};
            const data = existing.data || {};
            data.banned = 1;
            await Threads.setData(groupId, { data });
            if (global && global.data && global.data.threadBanned) global.data.threadBanned.set(parseInt(groupId), 1);
          } else {
            // fallback: set global map
            if (global && global.data && global.data.threadBanned) global.data.threadBanned.set(parseInt(groupId), 1);
          }
          return api.sendMessage(`✅ Successfully banned group id: ${groupId}`, event.threadID, event.messageID);
        } catch (e) {
          console.error("Ban error:", e);
          return api.sendMessage("❗ Failed to ban the group.", event.threadID, event.messageID);
        }
      }

      case "out":
      case "Out":
      case "leave": {
        try {
          const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;
          // remove bot from group
          if (typeof api.removeUserFromGroup === 'function') {
            await api.removeUserFromGroup(String(botId), groupId);
            // Try to get group name for a friendly message
            let tName = (threadData && (threadData.name || (threadData.data && threadData.data.name))) ? (threadData.name || threadData.data.name) : groupId;
            return api.sendMessage(`✅ Left thread: ${tName} (id: ${groupId})`, event.threadID, event.messageID);
          } else {
            return api.sendMessage("❗ API does not support removeUserFromGroup in this environment.", event.threadID, event.messageID);
          }
        } catch (e) {
          console.error("Leave error:", e);
          return api.sendMessage("❗ Failed to leave the group.", event.threadID, event.messageID);
        }
      }

      default:
        return api.sendMessage('Unknown action. Use "out <number>" or "ban <number>".', event.threadID, event.messageID);
    }

  } catch (err) {
    console.error("handleReply(allgroups) error:", err && (err.stack || err));
  }
};

module.exports.run = async function ({ api, event, client, Threads }) {
  try {
    // get thread list - adjust args if your API differs
    let inbox = [];
    try {
      if (typeof api.getThreadList === 'function') inbox = await api.getThreadList(100, null, ['INBOX']);
    } catch (e) {
      console.warn("getThreadList fallback:", e && e.message ? e.message : e);
    }

    // filter subscribed group threads
    const list = Array.isArray(inbox) ? inbox.filter(g => g && g.isSubscribed && g.isGroup) : [];

    const listthread = [];

    for (const groupInfo of list) {
      try {
        const info = (typeof api.getThreadInfo === 'function') ? await api.getThreadInfo(groupInfo.threadID) : {};
        const name = groupInfo.name || info.threadName || "Unknown";
        const members = (info && info.userInfo && Array.isArray(info.userInfo)) ? info.userInfo.length : (info && info.participantIDs ? info.participantIDs.length : 0);
        listthread.push({
          id: groupInfo.threadID,
          name,
          sotv: members
        });
      } catch (e) {
        // if specific thread fails, still continue
        listthread.push({
          id: groupInfo.threadID,
          name: groupInfo.name || "Unknown",
          sotv: 0
        });
      }
    }

    // sort by member count desc
    listthread.sort((a, b) => b.sotv - a.sotv);

    // build message (chunk if too long)
    const lines = [];
    const groupid = [];
    let i = 1;
    for (const g of listthread) {
      lines.push(`${i}. ${g.name}\ngroup id : ${g.id}\nmembers : ${g.sotv}\n`);
      groupid.push(g.id);
      i++;
    }

    if (lines.length === 0) return api.sendMessage("No groups found.", event.threadID);

    // FB may limit message length; send in chunks of ~1500 chars
    const CHUNK_SIZE = 1500;
    let assembled = "";
    const chunks = [];
    for (const l of lines) {
      if ((assembled + l).length > CHUNK_SIZE) {
        chunks.push(assembled);
        assembled = l;
      } else assembled += l;
    }
    if (assembled) chunks.push(assembled);

    // send first chunk and register handleReply with entire groupid array
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      if (idx === chunks.length - 1) {
        // last chunk: attach handleReply
        api.sendMessage(chunk + '\nReply "out <no>" or "ban <no>" to act on that group.', event.threadID, (err, info) => {
          try {
            if (!global.client) global.client = {};
            if (!Array.isArray(global.client.handleReply)) global.client.handleReply = [];
            global.client.handleReply.push({
              name: this.config.name,
              author: event.senderID,
              messageID: info.messageID,
              groupid,
              type: 'reply'
            });
          } catch (e) { console.warn(e); }
        });
      } else {
        // intermediate chunk
        await new Promise(res => api.sendMessage(chunk, event.threadID, res));
      }
    }

  } catch (err) {
    console.error("allgroups run error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while fetching groups.", event.threadID); } catch(e) {}
  }
};
