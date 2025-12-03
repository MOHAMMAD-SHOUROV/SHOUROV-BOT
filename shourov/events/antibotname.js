// commands/antibotname.js
module.exports.config = {
  name: "antibotname",
  eventType: ["log:user-nickname"],
  version: "0.0.2",
  credits: "shourov",
  description: "Prevent changing the Bot's nickname"
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  try {
    if (!event || !event.logMessageData) return;

    const { logMessageData, threadID, author } = event;
    const botID = (typeof api.getCurrentUserID === "function") ? api.getCurrentUserID() : null;
    if (!botID) return;

    // safe config access
    const BOTNAME = (global.config && global.config.BOTNAME) ? global.config.BOTNAME : "BOT";
    const ADMINBOT = Array.isArray(global.config?.ADMINBOT) ? global.config.ADMINBOT : [];

    // if the change wasn't for the bot, ignore
    if (!logMessageData.participant_id || String(logMessageData.participant_id) !== String(botID)) return;

    // fetch thread data safely (Threads.getData may return different shapes)
    let nicknameFromData = null;
    try {
      if (Threads && typeof Threads.getData === "function") {
        const tdata = await Threads.getData(threadID).catch(() => null);
        // tdata might be { data: { nickname: '...' } } or just { nickname: '...' }
        if (tdata) {
          if (typeof tdata === "object" && tdata.data && typeof tdata.data.nickname !== "undefined") {
            nicknameFromData = tdata.data.nickname;
          } else if (typeof tdata.nickname !== "undefined") {
            nicknameFromData = tdata.nickname;
          }
        }
      }
    } catch (e) {
      nicknameFromData = null;
    }

    const expectedNickname = nicknameFromData || BOTNAME;

    // If the author is bot itself, ignore
    if (String(author) === String(botID)) return;

    // If author is admin in ADMINBOT whitelist, allow
    if (ADMINBOT.includes(String(author))) return;

    // If new nickname is same as expected, ignore
    const newNick = (typeof logMessageData.nickname !== "undefined") ? String(logMessageData.nickname) : null;
    if (!newNick) return; // nothing to compare

    if (newNick === expectedNickname) return;

    // change nickname back (wrapped in try/catch)
    try {
      const desired = `『 ${global.config?.PREFIX || "/"} 』• ${BOTNAME}`;
      if (typeof api.changeNickname === "function") {
        await api.changeNickname(desired, threadID, botID).catch(() => null);
      }
    } catch (e) {
      // ignore changeNickname errors
    }

    // get author name for message
    let authorName = null;
    try {
      if (Users && typeof Users.getData === "function") {
        const udata = await Users.getData(author).catch(() => null);
        if (udata && udata.name) authorName = udata.name;
      }
      if (!authorName && Users && typeof Users.getNameUser === "function") {
        authorName = await Users.getNameUser(author).catch(() => null);
      }
    } catch (e) {
      authorName = null;
    }
    if (!authorName) authorName = `User${String(author).slice(-4)}`;

    // send warn message
    try {
      const warn = `[WARN] - ${authorName} - bot change protection is enabled`;
      if (typeof api.sendMessage === "function") {
        return api.sendMessage(warn, threadID);
      } else if (typeof api.send === "function") {
        return api.send(warn, threadID);
      }
    } catch (e) {
      // ignore send errors
    }
  } catch (err) {
    console.error("antibotname handler error:", err && (err.stack || err.message));
  }
};
