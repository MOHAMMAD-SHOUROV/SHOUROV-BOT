const chalk = require("chalk");

module.exports.config = {
  name: "join",
  version: "1.0.2",
  permission: 2,
  credits: "shourov",
  prefix: true,
  description: "Join a group from the list",
  category: "admin",
  usages: "",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply, Threads }) {
  const { threadID, messageID, senderID, body } = event;
  const { ID } = handleReply;

  // Validate numeric reply
  const pick = parseInt((body || "").trim(), 10);
  if (Number.isNaN(pick)) return api.sendMessage("Your selection must be a number.", threadID, messageID);

  // bounds check
  if (pick < 1 || pick > ID.length) return api.sendMessage("Your pick is not on the list.", threadID, messageID);

  const targetThreadID = ID[pick - 1];

  try {
    // Threads.getInfo may return { threadInfo: { ... } } or the raw info depending on implementation.
    const infoRaw = await Threads.getInfo(targetThreadID);
    const t = (infoRaw && infoRaw.threadInfo) ? infoRaw.threadInfo : infoRaw;

    if (!t) return api.sendMessage("Unable to read thread info for that group.", threadID, messageID);

    const participantIDs = t.participantIDs || [];
    const approvalMode = Boolean(t.approvalMode);
    const adminIDs = Array.isArray(t.adminIDs) ? t.adminIDs.map(a => (a.id || a)) : [];

    if (participantIDs.includes(senderID)) return api.sendMessage("You are already a member of that group.", threadID, messageID);

    // wrap addUserToGroup in a promise so we can await it and handle errors cleanly
    const addToGroup = (uid, tid) => new Promise((resolve, reject) => {
      try {
        api.addUserToGroup(uid, tid, (err) => {
          if (err) return reject(err);
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });

    await addToGroup(senderID, targetThreadID);

    // if group uses approval mode and bot is not an admin there, the user will receive a request
    const botID = api.getCurrentUserID();
    const botIsAdmin = adminIDs.includes(botID);

    if (approvalMode && !botIsAdmin) {
      return api.sendMessage(
        "You've been added to the group's approval list. Please check your message requests — an admin needs to approve you.",
        threadID,
        messageID
      );
    }

    // success
    return api.sendMessage(
      `You have joined "${t.threadName || t.name || targetThreadID}". If you don't see the group in your chat list, check Message Requests.`,
      threadID,
      messageID
    );
  } catch (error) {
    console.error("JOIN ERROR:", error);
    // friendly message without leaking raw stack to users
    return api.sendMessage("I can't add you to that group. The bot may not have permission or the group settings prevent invites.", threadID, messageID);
  }
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID, senderID } = event;

  try {
    const allThreads = await Threads.getAll();
    if (!Array.isArray(allThreads) || allThreads.length === 0) {
      return api.sendMessage("No groups found.", threadID, messageID);
    }

    let msg = "All groups\n\n";
    const ID = [];
    let number = 0;

    for (const item of allThreads) {
      number++;
      // some implementations store thread metadata under threadInfo
      const info = item.threadInfo || item;
      const name = info.threadName || info.name || "Unnamed group";
      msg += `${number}. ${name}\n`;
      ID.push(info.threadID || item.threadID);
    }

    msg += `\nReply to this message with the number of the group you want to join.`;

    return api.sendMessage(msg, threadID, (err, info) => {
      if (err) {
        console.error("JOIN sendMessage error:", err);
        return;
      }
      global.client.handleReply.push({
        name: this.config.name,
        author: senderID,
        messageID: info.messageID,
        ID: ID
      });
    }, messageID);

  } catch (err) {
    console.error("JOIN RUN ERROR:", err);
    return api.sendMessage("Failed to retrieve group list.", threadID, messageID);
  }
};