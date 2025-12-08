module.exports.config = {
  name: "groups",
  version: "0.0.4",
  permission: 2,
  credits: "Shourov",
  prefix: true,
  description: "Ban / Unban or Search groups in DB",
  category: "admin",
  usages: "[unban/ban/search] [id or text]",
  cooldowns: 5
};

module.exports.handleReaction = async ({ event, api, Threads, handleReaction }) => {
  try {
    // only author of the original command can react to confirm
    if (parseInt(event.userID) !== parseInt(handleReaction.author)) return;

    const target = String(handleReaction.target);
    const type = handleReaction.type;
    if (!target) return;

    if (type === "ban") {
      const threadDataObj = (await Threads.getData(target)) || {};
      const data = threadDataObj.data || {};
      data.banned = 1;
      await Threads.setData(target, { data });
      global.data.threadBanned.set(parseInt(target), 1);
      await api.sendMessage(`✅ Successfully banned group id ${target}`, event.threadID, () => {
        try { api.unsendMessage(handleReaction.messageID); } catch (e) {}
      });
    } else if (type === "unban") {
      const threadDataObj = (await Threads.getData(target)) || {};
      const data = threadDataObj.data || {};
      data.banned = 0;
      await Threads.setData(target, { data });
      global.data.threadBanned.delete(parseInt(target));
      await api.sendMessage(`✅ Successfully unbanned group id ${target}`, event.threadID, () => {
        try { api.unsendMessage(handleReaction.messageID); } catch (e) {}
      });
    }
  } catch (err) {
    console.error("handleReaction (groups) error:", err);
    try { api.sendMessage("An error occurred while processing reaction.", event.threadID); } catch(e) {}
  }
};

module.exports.run = async ({ event, api, args, Threads }) => {
  try {
    if (!args || args.length === 0) return global.utils.throwError(this.config.name, event.threadID, event.messageID);

    const action = args[0].toString().toLowerCase();
    const content = args.slice(1);

    if (action === "ban") {
      if (content.length === 0) return api.sendMessage("❗ Please enter one or more thread IDs to ban.\nUsage: ban <id1> <id2> ...", event.threadID, event.messageID);

      for (let rawId of content) {
        const idThread = String(rawId).trim();
        if (!/^\d+$/.test(idThread)) {
          await api.sendMessage(`❌ "${idThread}" is not a valid group id. Skipping.`, event.threadID);
          continue;
        }

        const threadData = await Threads.getData(idThread);
        if (!threadData) {
          await api.sendMessage(`❌ Thread not found in database:\nGroup id: ${idThread}`, event.threadID);
          continue;
        }

        const data = threadData.data || {};
        if (data.banned == 1) {
          await api.sendMessage(`ℹ️ Already banned: ${idThread}`, event.threadID);
          continue;
        }

        // Ask for reaction confirmation
        return api.sendMessage(`⚠️ Do you want to ban group id ${idThread}?\n\nPlease react to this message to confirm.`, event.threadID, (err, info) => {
          global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "ban",
            target: idThread
          });
        }, event.messageID);
      }
    } else if (action === "unban") {
      if (content.length === 0) return api.sendMessage("❗ Please enter one or more thread IDs to unban.\nUsage: unban <id1> <id2> ...", event.threadID, event.messageID);

      for (let rawId of content) {
        const idThread = String(rawId).trim();
        if (!/^\d+$/.test(idThread)) {
          await api.sendMessage(`❌ "${idThread}" is not a valid group id. Skipping.`, event.threadID);
          continue;
        }

        const threadDataObj = await Threads.getData(idThread);
        if (!threadDataObj || !threadDataObj.data) {
          await api.sendMessage(`❌ Thread not found in database:\nGroup id: ${idThread}`, event.threadID);
          continue;
        }

        const data = threadDataObj.data || {};
        if (data.banned != 1) {
          await api.sendMessage(`ℹ️ Group id ${idThread} is not banned.`, event.threadID);
          continue;
        }

        return api.sendMessage(`⚠️ Do you want to unban group id ${idThread}?\n\nPlease react to this message to confirm.`, event.threadID, (err, info) => {
          global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "unban",
            target: idThread
          });
        }, event.messageID);
      }
    } else if (action === "search") {
      const query = content.join(" ").trim();
      if (!query) return api.sendMessage("❗ Please provide text to search for. Usage: search <group name text>", event.threadID);

      // get all threads with name, filter by query
      const allThreads = await Threads.getAll(['threadID', 'name']);
      const matched = (allThreads || []).filter(t => t && t.threadInfo && t.threadInfo.name && t.threadInfo.name.toLowerCase().includes(query.toLowerCase()));

      if (!matched.length) return api.sendMessage("🔍 No results found for: " + query, event.threadID);

      // build message (limit to first 30 results to avoid huge messages)
      const limited = matched.slice(0, 30);
      let reply = `🔍 Found ${matched.length} result(s). Showing ${limited.length}:\n\n`;
      let index = 0;
      for (const t of limited) {
        index++;
        reply += `${index}. ${t.threadInfo.name} — ${t.threadID}\n`;
      }
      if (matched.length > limited.length) reply += `\n...and ${matched.length - limited.length} more results. Narrow your search to see fewer results.`;

      return api.sendMessage(reply, event.threadID, event.messageID);
    } else {
      return global.utils.throwError(this.config.name, event.threadID, event.messageID);
    }
  } catch (err) {
    console.error("groups command error:", err);
    return api.sendMessage("❌ An error occurred while executing the groups command.", event.threadID, event.messageID);
  }
};