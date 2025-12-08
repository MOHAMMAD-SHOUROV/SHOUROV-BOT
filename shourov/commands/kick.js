module.exports.config = {
  name: "kick",
  version: "1.0.1",
  permission: 2,
  prefix: true,
  credits: "shourov",
  description: "Remove tagged user(s) from the group",
  category: "other",
  usages: "[tag]",
  cooldowns: 0,
};

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const botID = api.getCurrentUserID();
  try {
    // mentions -> array of ids
    const mentionIds = Object.keys(event.mentions || {});

    if (!mentionIds.length) {
      return api.sendMessage("Please tag the user(s) you want to kick.", threadID, messageID);
    }

    // promisify getThreadInfo
    const info = await new Promise((resolve, reject) => {
      api.getThreadInfo(threadID, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // admin id set for quick lookup
    const adminSet = new Set((info.adminIDs || []).map(a => a.id));

    // bot must be admin to remove users
    if (!adminSet.has(botID)) {
      return api.sendMessage("I need group admin rights to remove members. Please promote me and try again.", threadID, messageID);
    }

    // sender must be admin
    if (!adminSet.has(event.senderID)) {
      return api.sendMessage("You must be a group admin to use this command.", threadID, messageID);
    }

    const kicked = [];
    const skipped = [];

    // small delay helper
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (const uid of mentionIds) {
      // don't try to kick bot or the command issuer
      if (uid === botID) {
        skipped.push({ id: uid, reason: "target is the bot" });
        continue;
      }
      if (uid === event.senderID) {
        skipped.push({ id: uid, reason: "target is command issuer" });
        continue;
      }

      // don't kick other admins
      if (adminSet.has(uid)) {
        skipped.push({ id: uid, reason: "target is an admin" });
        continue;
      }

      try {
        // remove user (provide callback to catch any API error)
        await new Promise((resolve, reject) => {
          api.removeUserFromGroup(uid, threadID, err => {
            if (err) return reject(err);
            resolve();
          });
        });
        kicked.push(uid);
      } catch (err) {
        // API error: record as skipped with reason
        skipped.push({ id: uid, reason: `API error: ${err.message || err}` });
      }

      // small delay to avoid race conditions / rate limits
      await delay(1200);
    }

    // build report message
    let report = "";
    if (kicked.length) report += `✅ Kicked: ${kicked.join(", ")}\n`;
    if (skipped.length) {
      report += `⚠️ Skipped:\n`;
      skipped.forEach(s => {
        report += `• ${s.id} — ${s.reason}\n`;
      });
    }
    if (!report) report = "No changes made.";

    return api.sendMessage(report, threadID, messageID);

  } catch (error) {
    console.error("KICK CMD ERROR:", error);
    return api.sendMessage("An error occurred while trying to remove users. Check console for details.", threadID, messageID);
  }
};