module.exports.config = {
  name: "listbox",
  version: "0.0.3",
  permission: 2,
  prefix: true,
  credits: "shourov",
  description: "List group threads and allow replying 'out <#>' or 'ban <#>'",
  category: "admin",
  usages: "",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, Threads, handleReply }) {
  try {
    // Only the original author can reply to the message
    if (String(event.senderID) !== String(handleReply.author)) return;

    const parts = event.body.trim().split(/\s+/);
    if (parts.length === 0) return;

    const cmd = parts[0].toLowerCase();
    const index = parseInt(parts[1], 10);

    if (!index || index < 1 || index > (handleReply.groupid || []).length) {
      return api.sendMessage("❌ Invalid index. Example replies: `out 2` or `ban 3`", event.threadID, event.messageID);
    }

    const targetThreadID = handleReply.groupid[index - 1];

    if (cmd === "ban") {
      // use Threads service to set banned flag (if available)
      const threadData = (await Threads.getData(targetThreadID)).data || {};
      threadData.banned = 1;
      await Threads.setData(targetThreadID, { data: threadData });

      // keep global runtime in sync if present
      try {
        global.data.threadBanned.set(parseInt(targetThreadID), 1);
      } catch (e) {}

      return api.sendMessage(`✅ Thread ${targetThreadID} successfully banned (updated Threads data).`, event.threadID, event.messageID);
    }

    if (cmd === "out" || cmd === "leave") {
      // remove the bot from the target group
      try {
        const botId = api.getCurrentUserID();
        // api.removeUserFromGroup(botId, threadID) — some APIs accept (userID, threadID)
        await api.removeUserFromGroup(String(botId), targetThreadID);
        const info = await Threads.getData(targetThreadID);
        return api.sendMessage(`➡️ Left thread: ${targetThreadID}\nName: ${info.name || "Unknown"}`, event.threadID, event.messageID);
      } catch (err) {
        return api.sendMessage(`❌ Failed to leave thread ${targetThreadID} — ${err.message || err}`, event.threadID, event.messageID);
      }
    }

    // unknown subcommand
    return api.sendMessage("❌ Unknown command. Use `ban <number>` or `out <number>`.", event.threadID, event.messageID);
  } catch (err) {
    console.error("handleReply error (listbox):", err);
    return api.sendMessage("❌ An error occurred while processing your reply.", event.threadID, event.messageID);
  }
};

module.exports.run = async function({ api, event, Threads }) {
  try {
    // fetch inbox threads (groups only)
    const inbox = await api.getThreadList(100, null, ["INBOX"]);
    const groups = Array.isArray(inbox) ? inbox.filter(g => g.isSubscribed && g.isGroup) : [];

    if (groups.length === 0) {
      return api.sendMessage("No group threads found in inbox.", event.threadID, event.messageID);
    }

    const listthread = [];
    for (const g of groups) {
      try {
        const info = await api.getThreadInfo(g.threadID);
        const membersCount = Array.isArray(info.userInfo) ? info.userInfo.length : (info.participantIDs ? info.participantIDs.length : 0);
        listthread.push({
          id: g.threadID,
          name: g.name || "Unknown",
          members: membersCount
        });
      } catch (e) {
        // if getThreadInfo fails for a thread, still include minimal info
        listthread.push({
          id: g.threadID,
          name: g.name || "Unknown",
          members: 0
        });
      }
    }

    // sort by member count descending
    listthread.sort((a, b) => b.members - a.members);

    // build message and group id index
    let msg = "📋 Group threads:\n\n";
    const groupid = [];
    let i = 1;
    for (const gr of listthread) {
      msg += `${i}. ${gr.name}\n🧩 TID: ${gr.id}\n👥 Members: ${gr.members}\n\n`;
      groupid.push(gr.id);
      i++;
    }
    msg += "Reply with `ban <number>` to ban or `out <number>` to make the bot leave that thread.";

    // send message and register handleReply
    api.sendMessage(msg, event.threadID, (err, info) => {
      if (err) {
        console.error("listbox sendMessage error:", err);
        return;
      }
      global.client = global.client || {};
      global.client.handleReply = Array.isArray(global.client.handleReply) ? global.client.handleReply : [];
      global.client.handleReply.push({
        name: this.config.name,
        author: event.senderID,
        messageID: info.messageID,
        groupid,
        type: "reply"
      });
    });
  } catch (err) {
    console.error("run error (listbox):", err);
    return api.sendMessage("❌ An error occurred while listing groups.", event.threadID, event.messageID);
  }
};