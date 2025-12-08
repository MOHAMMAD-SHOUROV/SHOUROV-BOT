module.exports.config = {
  name: "kickall",
  version: "1.1.0",
  permission: 2,
  credits: "shourov",
  description: "Kick out all non-admin members inside the group (safe).",
  category: "group",
  usages: "confirm (optional)",
  cooldowns: 3,
  prefix: true
};

module.exports.run = async function({ api, event, args, Threads }) {
  try {
    const { threadID, senderID, messageID } = event;

    // Safety: only run inside a group
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (err) {
      return api.sendMessage("❌ Failed to fetch thread info. Try again later.", threadID, messageID);
    }

    if (!threadInfo || threadInfo.isGroup === false) {
      return api.sendMessage("❌ This command only works inside group threads.", threadID, messageID);
    }

    // Check sender is an admin/owner
    const adminIDs = Array.isArray(threadInfo.adminIDs) ? threadInfo.adminIDs.map(x => String(x.id || x)) : [];
    const ownerID = threadInfo.ownerID ? String(threadInfo.ownerID) : null;
    const isSenderAdmin = adminIDs.includes(String(senderID)) || String(senderID) === ownerID;

    if (!isSenderAdmin) {
      return api.sendMessage("❌ You must be a group admin/owner to use this command.", threadID, messageID);
    }

    // Confirm intention: to avoid accidental mass-kick, require the word "confirm" as first arg.
    // If user passed "confirm" proceed; otherwise, ask for confirmation.
    const confirm = (args || []).map(a => String(a).toLowerCase()).includes("confirm");
    if (!confirm) {
      return api.sendMessage(
        "⚠️ WARNING: This will remove **all non-admin members** from the group.\n" +
        "If you really want to proceed, re-run the command with the word `confirm`.\n\n" +
        "Example: /kickall confirm",
        threadID, messageID
      );
    }

    // Build list of participant IDs to kick:
    // Keep: owner, admins, and the bot itself.
    const botID = String(api.getCurrentUserID ? api.getCurrentUserID() : (await api.getCurrentUserID?.()) || "");
    const keepSet = new Set(adminIDs.map(id => String(id)));
    if (ownerID) keepSet.add(String(ownerID));
    if (botID) keepSet.add(String(botID));

    // participantIDs sometimes exists, otherwise derive from threadInfo
    const participants = Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs.map(String) :
                         (Array.isArray(threadInfo.userInfo) ? threadInfo.userInfo.map(u => String(u.id || u.fbId || u.userID || u)) : []);

    // Filter targets: participants that are not in keepSet
    const targets = (participants || []).filter(pid => !keepSet.has(String(pid)));

    if (!targets.length) {
      return api.sendMessage("✅ No removable members found (either everyone is admin/owner or nothing to remove).", threadID, messageID);
    }

    // Ask optional Threads service / store action (not required)
    // Start kicking with delay to reduce rate-limit issues
    const total = targets.length;
    let kicked = 0;
    let failed = 0;

    // Inform start
    await api.sendMessage(`🚀 Starting to remove ${total} member(s). This may take a while — progress will be posted in this thread.`, threadID, messageID);

    // configurable delay in ms between kicks
    const DELAY_MS = 3500; // 3.5 seconds — safe default; increase if you get rate-limited

    for (let i = 0; i < targets.length; i++) {
      const uid = String(targets[i]);
      try {
        // attempt remove; API signature may be removeUserFromGroup(userID, threadID, callback)
        // we try common variants and await a Promise if possible
        if (typeof api.removeUserFromGroup === "function") {
          // Some implementations accept (userID, threadID) or (userID, threadID, authorID)
          try {
            // preferred: await promise if returns one
            const res = api.removeUserFromGroup(uid, threadID);
            if (res && typeof res.then === "function") await res;
          } catch (e1) {
            // try alternate signature
            try {
              const res2 = api.removeUserFromGroup(String(api.getCurrentUserID ? api.getCurrentUserID() : ""), threadID, uid);
              if (res2 && typeof res2.then === "function") await res2;
            } catch (e2) {
              // fallback to callback style
              await new Promise((resolve, reject) => {
                try {
                  api.removeUserFromGroup(uid, threadID, (err) => {
                    if (err) return reject(err);
                    resolve();
                  });
                } catch (ee) {
                  // can't remove with this API
                  reject(ee);
                }
              });
            }
          }
        } else {
          throw new Error("removeUserFromGroup not supported by API");
        }

        kicked++;
        // optional progress update every N removals
        if (kicked % 5 === 0 || i === targets.length - 1) {
          await api.sendMessage(`✅ Progress: removed ${kicked}/${total} members...`, threadID);
        }
      } catch (err) {
        failed++;
        console.error(`Failed to remove ${uid}:`, err && (err.stack || err.message || err));
        // report smaller failure inline occasionally
        if (failed <= 5) {
          await api.sendMessage(`❌ Failed to remove <${uid}> — ${err && err.message ? err.message : "unknown error"}`, threadID);
        }
      }

      // delay between operations
      await new Promise(r => setTimeout(r, DELAY_MS));
    } // end for

    // Final summary
    await api.sendMessage(`📋 Done.\nTotal requested: ${total}\nRemoved: ${kicked}\nFailed: ${failed}`, threadID);

    // Optionally, mark thread as banned or update Threads data if desired:
    try {
      const data = (await Threads.getData(threadID)).data || {};
      data.lastKickAll = Date.now();
      await Threads.setData(threadID, { data });
    } catch (e) {
      // non-fatal
      console.warn("Threads update failed (kickall):", e && e.message);
    }

  } catch (err) {
    console.error("kickall command error:", err);
    return api.sendMessage("❌ An unexpected error occurred while executing kickall.", event.threadID, event.messageID);
  }
};