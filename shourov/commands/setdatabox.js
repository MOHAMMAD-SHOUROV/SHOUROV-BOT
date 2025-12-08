/**
 * setdatagroup.js
 * Adapted for shourovbot loader (uses Threads service or fallback)
 */

module.exports.config = {
  name: "setdatagroup",
  version: "1.1.0",
  permission: 2,
  credits: "ryuko | adapted by Shourov",
  prefix: true,
  description: "Safely update thread (group/box) data cache from current inbox",
  category: "admin",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function (payload) {
  const api = payload.api || global.api || payload.shourov;
  const Threads = payload.Threads || payload.ThreadsService || global.ThreadsService || global._fallbackThreads;
  const event = payload.event || {};
  const threadID = event.threadID || (event.thread && event.thread.threadID) || event.senderID || null;

  if (!api) {
    console.warn('[setdatagroup] Missing api');
    return;
  }

  if (!threadID) {
    return api.sendMessage("❗ Không thể xác định thread ID.", event.threadID || null);
  }

  try {
    // Get inbox list via api.getThreadList (best-effort)
    let inbox = [];
    try {
      // try to fetch more items if possible, but some APIs limit to 100-300. Using 200 as safer default.
      inbox = await api.getThreadList(200, null, ['INBOX']);
      if (!Array.isArray(inbox)) inbox = [];
    } catch (e) {
      console.warn('[setdatagroup] api.getThreadList failed, trying fallback:', e && e.message);
      inbox = [];
    }

    // Filter to groups only
    const groups = Array.isArray(inbox) ? inbox.filter(g => g && g.isSubscribed && g.isGroup) : [];

    if (groups.length === 0) {
      return api.sendMessage("❗ No group threads found in inbox to update.", threadID);
    }

    let updated = 0;
    // iterate groups and update Threads data safely
    for (const groupInfo of groups) {
      try {
        const gid = groupInfo.threadID || groupInfo.id;
        if (!gid) continue;

        // fetch fresh threadInfo if possible
        let threadInfo = null;
        try {
          threadInfo = await api.getThreadInfo(gid);
        } catch (e) {
          // if api.getThreadInfo fails, fallback to the object from getThreadList
          threadInfo = groupInfo;
        }

        // save to Threads service if available
        if (Threads && typeof Threads.setData === 'function') {
          // store only threadInfo to avoid overwriting other thread data
          await Threads.setData(gid, { threadInfo });
        } else if (Threads && typeof Threads.setData === 'undefined' && typeof Threads.set === 'function') {
          // some systems use set
          await Threads.set(gid, { threadInfo });
        } else {
          // fallback: try to set into global._fallbackThreads
          if (global._fallbackThreads && typeof global._fallbackThreads.setData === 'function') {
            await global._fallbackThreads.setData(gid, { threadInfo });
          } else if (global._fallbackThreads && typeof global._fallbackThreads.setData === 'undefined' && typeof global._fallbackThreads.setData === 'undefined') {
            // nothing else to do
          }
        }

        updated++;
        console.log(`[setdatagroup] Updated group: ${gid} (${threadInfo && threadInfo.threadName ? threadInfo.threadName : 'unknown'})`);
        // small delay to reduce chance of hitting rate limits
        await new Promise(r => setTimeout(r, 120));
      } catch (errGroup) {
        console.error('[setdatagroup] Failed to update a group:', errGroup && (errGroup.message || errGroup));
        // continue with next group
      }
    }

    return api.sendMessage(`✔ Data has been updated for ${updated} groups.`, threadID);
  } catch (err) {
    console.error('[setdatagroup] Fatal error:', err && (err.stack || err.message || err));
    return api.sendMessage(`❌ Error updating groups: ${err && err.message ? err.message : String(err)}`, threadID);
  }
};