module.exports.config = {
  name: "adminNoti",
  eventType: [
    "log:thread-admins",
    "log:user-nickname",
    "log:thread-call",
    "log:thread-icon",
    "log:thread-color",
    "log:link-status",
    "log:magic-words",
    "log:thread-approval-mode",
    "log:thread-poll"
  ],
  version: "1.0.2",
  credits: "shourov",
  description: "Group Information Update",
  envConfig: {
    autoUnsend: true,
    sendNoti: true,
    timeToUnsend: 10
  }
};

module.exports.run = async function ({ event, api, Threads, Users }) {
  try {
    if (!event) return;
    const { author, threadID, logMessageType, logMessageData, logMessageBody } = event;
    if (!threadID) return;

    // safe Threads methods
    const setData = (Threads && typeof Threads.setData === "function") ? Threads.setData.bind(Threads) : null;
    const getData = (Threads && typeof Threads.getData === "function") ? Threads.getData.bind(Threads) : null;

    // safe Users
    const safeGetName = async (id) => {
      try {
        if (Users && typeof Users.getNameUser === "function") return await Users.getNameUser(id);
        if (Users && typeof Users.getData === "function") {
          const ud = await Users.getData(id).catch(()=>null);
          if (ud && ud.name) return ud.name;
        }
      } catch (e) {}
      return `User${String(id).slice(-4)}`;
    };

    // safe configModule access
    const conf = (global.configModule && global.configModule[module.exports.config.name]) ? global.configModule[module.exports.config.name] : {};
    const autoUnsend = (typeof conf.autoUnsend === "boolean") ? conf.autoUnsend : (module.exports.config.envConfig.autoUnsend ?? true);
    const sendNoti = (typeof conf.sendNoti === "boolean") ? conf.sendNoti : (module.exports.config.envConfig.sendNoti ?? true);
    const timeToUnsend = (typeof conf.timeToUnsend === "number") ? conf.timeToUnsend : (module.exports.config.envConfig.timeToUnsend ?? 10);

    // prepare icon cache
    const fs = require("fs");
    const iconPath = __dirname + "/cache/emoji.json";
    try { if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true }); } catch(e){}
    if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, JSON.stringify({}));

    // don't notify on self actions where applicable
    if (author === threadID) return;

    // try get thread data safely
    let dataThread = {};
    try {
      if (getData) {
        const result = await getData(threadID).catch(()=>null);
        // If result has .threadInfo use it, else assume result itself is info
        dataThread = (result && result.threadInfo) ? result.threadInfo : (result || {});
      } else if (global.data && global.data.threadData && typeof global.data.threadData.get === "function") {
        const cached = global.data.threadData.get(parseInt(threadID));
        dataThread = cached || {};
      }
    } catch (e) { dataThread = {}; }

    switch (logMessageType) {
      case "log:thread-admins": {
        if (!logMessageData) break;
        try {
          if (logMessageData.ADMIN_EVENT === "add_admin") {
            dataThread.adminIDs = dataThread.adminIDs || [];
            dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
            const name = await safeGetName(logMessageData.TARGET_ID);
            if (sendNoti) await api.sendMessage(`[ GROUP UPDATE ]\n❯ USER UPDATE ${name} Became a group admin`, threadID);
          } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
            dataThread.adminIDs = (dataThread.adminIDs || []).filter(item => String(item.id) !== String(logMessageData.TARGET_ID));
            if (sendNoti) await api.sendMessage(`[ GROUP UPDATE ]\n❯ Remove user's admin position ${logMessageData.TARGET_ID}`, threadID);
          }
        } catch (e) { console.warn("adminNoti: thread-admins handler error", e && e.message); }
        break;
      }

      case "log:user-nickname": {
        if (!logMessageData) break;
        try {
          const { participant_id, nickname } = logMessageData;
          if (participant_id) {
            dataThread.nicknames = dataThread.nicknames || {};
            dataThread.nicknames[participant_id] = nickname || "";
            const participantName = await safeGetName(participant_id);
            const formattedNickname = nickname || "deleted nickname";
            if (sendNoti) await api.sendMessage(`[ GROUP ]\n❯ Updated nickname for ${participantName}: ${formattedNickname}.`, threadID);
          }
        } catch (e) { console.warn("adminNoti: nickname handler error", e && e.message); }
        break;
      }

      case "log:thread-icon": {
        try {
          const preIcon = JSON.parse(fs.readFileSync(iconPath, "utf8") || "{}");
          dataThread.threadIcon = logMessageData?.thread_icon || dataThread.threadIcon || "👍";
          if (sendNoti) {
            await new Promise(resolve => {
              api.sendMessage(
                `[ GROUP UPDATE ]\n❯ ${String(logMessageBody || "").replace("emoji", "icon")}\n❯ Original Emoji: ${preIcon[threadID] || "unknown"}`,
                threadID,
                async (error, info) => {
                  preIcon[threadID] = dataThread.threadIcon;
                  try { fs.writeFileSync(iconPath, JSON.stringify(preIcon)); } catch(e){}
                  if (autoUnsend && info && info.messageID) {
                    await new Promise(r => setTimeout(r, timeToUnsend * 1000));
                    try { await api.unsendMessage(info.messageID); } catch(e){}
                  }
                  resolve();
                }
              );
            });
          }
        } catch (e) { console.warn("adminNoti: thread-icon error", e && e.message); }
        break;
      }

      case "log:thread-call": {
        try {
          if (!logMessageData) break;
          if (logMessageData.event === "group_call_started") {
            const name = await safeGetName(logMessageData.caller_id);
            if (sendNoti) await api.sendMessage(`[ GROUP UPDATE ]\n❯ ${name} STARTED A ${(logMessageData.video) ? 'VIDEO ' : ''}CALL.`, threadID);
          } else if (logMessageData.event === "group_call_ended") {
            const callDuration = Number(logMessageData.call_duration) || 0;
            const hours = Math.floor(callDuration / 3600);
            const minutes = Math.floor((callDuration - (hours * 3600)) / 60);
            const seconds = callDuration - (hours * 3600) - (minutes * 60);
            const timeFormat = `${hours}:${minutes}:${seconds}`;
            if (sendNoti) await api.sendMessage(`[ GROUP UPDATE ]\n❯ ${(logMessageData.video) ? 'Video' : ''} call has ended.\n❯ Call duration: ${timeFormat}`, threadID);
          } else if (logMessageData.joining_user) {
            const name = await safeGetName(logMessageData.joining_user);
            if (sendNoti) await api.sendMessage(`❯ [ GROUP UPDATE ]\n❯ ${name} Joined the ${(logMessageData.group_call_type == '1') ? 'Video' : ''} call.`, threadID);
          }
        } catch (e) { console.warn("adminNoti: thread-call error", e && e.message); }
        break;
      }

      case "log:link-status": {
        if (sendNoti) await api.sendMessage(String(logMessageBody || ""), threadID);
        break;
      }

      case "log:magic-words": {
        try {
          if (sendNoti) await api.sendMessage(`» [ GROUP UPDATE ] Theme ${logMessageData?.magic_word} added effect: ${logMessageData?.theme_name}\nEmoji: ${logMessageData?.emoji_effect || "No emoji"}\nTotal ${logMessageData?.new_magic_word_count || 0} word effect added`, threadID);
        } catch (e){ console.warn("adminNoti: magic-words error", e && e.message); }
        break;
      }

      case "log:thread-poll": {
        try {
          if (!logMessageData) break;
          if (logMessageData.event_type === "question_creation" || logMessageData.event_type === "update_vote") {
            if (sendNoti) await api.sendMessage(String(logMessageBody || ""), threadID);
          }
        } catch (e) { console.warn("adminNoti: poll error", e && e.message); }
        break;
      }

      case "log:thread-approval-mode": {
        if (sendNoti) await api.sendMessage(String(logMessageBody || ""), threadID);
        break;
      }

      case "log:thread-color": {
        try {
          dataThread.threadColor = logMessageData?.thread_color || dataThread.threadColor || "🌤";
          if (sendNoti) {
            await new Promise(resolve => {
              api.sendMessage(
                `[ GROUP UPDATE ]\n❯ ${String(logMessageBody || "").replace("Theme", "color")}`,
                threadID,
                async (error, info) => {
                  if (autoUnsend && info && info.messageID) {
                    await new Promise(r => setTimeout(r, timeToUnsend * 1000));
                    try { await api.unsendMessage(info.messageID); } catch(e){}
                  }
                  resolve();
                }
              );
            });
          }
        } catch (e) { console.warn("adminNoti: color error", e && e.message); }
        break;
      }

      default:
        break;
    }

    // persist threadInfo if possible
    try {
      if (setData) await setData(threadID, { threadInfo: dataThread });
      else if (global.data && global.data.threadData && typeof global.data.threadData.set === "function") {
        global.data.threadData.set(parseInt(threadID), dataThread);
      }
    } catch (e) {
      console.warn("adminNoti: failed to persist threadInfo", e && e.message);
    }

  } catch (error) {
    console.error("adminNoti error:", error && (error.stack || error));
  }
};
