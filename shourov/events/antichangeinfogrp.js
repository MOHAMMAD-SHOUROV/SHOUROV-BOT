// events/antichange.js
'use strict';

module.exports.config = {
  name: "antichange",
  eventType: ["log:subscribe", "log:thread-name", "log:thread-image"],
  version: "1.0.1",
  credits: "shourov",
  description: "Prevent unauthorized group changes",
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  try {
    if (!event) return;
    const { threadID, author, logMessageType, logMessageData, logMessageBody } = event;

    // safe services & helpers
    const ThreadsService = Threads || global.ThreadsService || global._fallbackThreads || null;
    const UsersService = Users || global.UsersService || global._fallbackUsers || null;

    const isAdminAllowed = (uid) => {
      try {
        const adminList = Array.isArray(global.config?.ADMINBOT) ? global.config.ADMINBOT.map(String) : [];
        // also treat ownerId as super-admin if present
        if (global.config?.ownerId) adminList.push(String(global.config.ownerId));
        return adminList.includes(String(uid));
      } catch (e) {
        return false;
      }
    };

    // helper: get previous thread info (safe)
    const loadThreadInfo = async (tid) => {
      try {
        if (ThreadsService && typeof ThreadsService.getData === 'function') {
          const d = await ThreadsService.getData(tid).catch(() => null);
          return (d && d.threadInfo) ? d.threadInfo : (d || {});
        } else if (global.data && global.data.threadData && typeof global.data.threadData.get === 'function') {
          return global.data.threadData.get(parseInt(tid)) || {};
        }
      } catch (e) {}
      return {};
    };

    // helper: persist threadInfo (safe)
    const saveThreadInfo = async (tid, info) => {
      try {
        if (ThreadsService && typeof ThreadsService.setData === 'function') {
          await ThreadsService.setData(tid, { threadInfo: info }).catch(() => null);
        } else if (global.data && global.data.threadData && typeof global.data.threadData.set === 'function') {
          global.data.threadData.set(parseInt(tid), info);
        }
      } catch (e) {}
    };

    // ignore if author is null or bot itself
    const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : null;
    if (!author || (botId && String(author) === String(botId))) return;

    // If author is allowed admin -> do nothing
    if (isAdminAllowed(author)) return;

    // fetch thread info (may contain previous title/image stored by you)
    const threadInfo = await loadThreadInfo(threadID);

    // HANDLE thread name change
    if (logMessageType === 'log:thread-name') {
      // logMessageData may contain 'name' or 'thread_name'
      const newName = logMessageData?.name || logMessageData?.thread_name || logMessageBody || null;
      const oldName = threadInfo?.threadName || threadInfo?.name || null;

      // save new name into storage if not present (so we have record)
      if (!oldName && newName) {
        threadInfo.threadName = newName;
        await saveThreadInfo(threadID, threadInfo);
        return;
      }

      // if someone changed and we have oldName, try to restore
      if (oldName && newName && String(newName) !== String(oldName)) {
        // attempt to set title back if api supports it
        try {
          if (typeof api.setTitle === 'function') {
            await api.setTitle(oldName, threadID).catch(()=>null);
            await api.sendMessage(`🔒 Unauthorized name change detected. Reverted to previous name.`, threadID);
          } else {
            // fallback: notify
            await api.sendMessage(`⚠️ Unauthorized name change detected by ${author}. Please restore name manually to: ${oldName}`, threadID);
          }
        } catch (e) {
          try { await api.sendMessage(`⚠️ Detected unauthorized name change but failed to revert. Please check manually.`, threadID); } catch(_){}
        }
        // keep stored oldName intact
        return;
      }
    }

    // HANDLE thread image change
    if (logMessageType === 'log:thread-image') {
      // thread image info may be in logMessageData.thread_image or similar
      const newImage = logMessageData?.thread_image || logMessageData?.image || null;
      const prevImage = threadInfo?.threadImage || null;

      // if no prev stored, store current as prev and inform
      if (!prevImage && newImage) {
        threadInfo.threadImage = newImage;
        await saveThreadInfo(threadID, threadInfo);
        return;
      }

      // if changed and we have prevImage, try to revert (only if API has method)
      if (prevImage && newImage && String(prevImage) !== String(newImage)) {
        try {
          // some API wrappers provide changeThreadImage or setThreadImage or setAvatar - try a few
          if (typeof api.changeThreadImage === 'function') {
            await api.changeThreadImage(prevImage, threadID).catch(()=>null);
            await api.sendMessage(`🔒 Unauthorized image change detected. Restored previous group image.`, threadID);
          } else if (typeof api.setThreadImage === 'function') {
            await api.setThreadImage(prevImage, threadID).catch(()=>null);
            await api.sendMessage(`🔒 Unauthorized image change detected. Restored previous group image.`, threadID);
          } else {
            await api.sendMessage(`⚠️ Unauthorized image change detected by ${author}. Please restore the previous image manually.`, threadID);
          }
        } catch (e) {
          try { await api.sendMessage(`⚠️ Detected unauthorized image change but failed to revert.`, threadID); } catch(_){}
        }
        return;
      }
    }

    // HANDLE new subscription / join
    if (logMessageType === 'log:subscribe') {
      // logMessageData may contain 'addedParticipants' or 'participant_id'
      const joined = logMessageData?.addedParticipants || logMessageData?.participant_id || null;
      // If someone invited or joined and you want to block invites by non-admins -> implement here
      // For now: notify admins that unauthorized join happened (since checking invite perms might be complex)
      try {
        const joiner = Array.isArray(joined) ? joined[0] : joined;
        if (joiner && !isAdminAllowed(author)) {
          // notify thread
          const name = (UsersService && typeof UsersService.getNameUser === 'function') ? await UsersService.getNameUser(joiner).catch(()=>null) : null;
          await api.sendMessage(`⚠️ ${name || joiner} joined the group. Invite performed by non-whitelisted user (${author}). If this is unwanted, remove them.`, threadID);
        }
      } catch (e) {
        // ignore
      }
      return;
    }

  } catch (err) {
    console.error('antichange event error:', err && (err.stack || err));
  }
};
