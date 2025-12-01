// commands/console.js
module.exports.config = {
  name: "console",
  version: "1.0.1",
  permission: 3,
  credits: "shourov",
  prefix: true,
  description: "Log incoming messages to terminal with nice styling",
  category: "system",
  usages: "",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, Users, event }) {
  try {
    const { messageID, threadID, senderID } = event;

    // safety: don't process bot's own messages
    const botId = (typeof api.getCurrentUserID === "function") ? api.getCurrentUserID() : global.data.botID;
    if (String(senderID) === String(botId)) return;

    // load optional deps safely
    let chalk;
    try { chalk = require('chalk'); } catch (e) { chalk = { green: (s)=>s, blue: (s)=>s, blueBright: (s)=>s, white: (s)=>s }; }
    let moment;
    try { moment = require("moment-timezone"); } catch (e) { moment = { tz: () => ({ format: ()=> new Date().toString() }) }; }

    const time = moment.tz("Asia/Dhaka").format("LLLL");

    // thread specific data (may be undefined)
    const thread = global.data.threadData.get(threadID) || {};

    // allow disabling console per-thread: if thread.console === true -> skip logging
    if (typeof thread["console"] !== "undefined" && thread["console"] == true) return;

    // try to determine group name (if group) otherwise treat as private
    let nameBox = "";
    let threadIdDisplay = "";
    let headerType = "PRIVATE CHAT MESSAGE";
    let groupLabel = "";
    try {
      const tInfo = await global.data.threadInfo.get(threadID);
      if (tInfo && tInfo.threadName) {
        nameBox = `${tInfo.threadName}\n`;
        threadIdDisplay = `${threadID}\n`;
        headerType = "GROUP CHAT MESSAGE";
        groupLabel = chalk.blue('group name : ');
      }
    } catch (err) {
      // ignore - treat as private
    }

    // user display
    const nameUser = await Users.getNameUser(senderID);
    const userLabel = chalk.blue('user name : ');
    const userIdLabel = chalk.blue('user id : ');

    // message content fallback
    let msg = "photos, videos or special characters";
    if (event.body && event.body.trim()) msg = event.body;
    else if (event.attachments && event.attachments.length) {
      // try list attachment types
      try {
        msg = event.attachments.map(a => a.type ? `[${a.type}]` : '[attachment]').join(' ');
      } catch (e) {
        msg = 'attachments';
      }
    }

    // nice delim
    const line = chalk.green('────────────────────────────────────────────────────────────────');

    // build output
    const parts = [];
    parts.push('\n' + line);
    parts.push('              ' + headerType);
    parts.push(line);
    if (groupLabel) parts.push(groupLabel + nameBox + chalk.blue('group id : ') + threadIdDisplay);
    parts.push(userLabel + chalk.white(nameUser));
    parts.push(userIdLabel + chalk.white(senderID));
    parts.push(chalk.blue('message : ') + chalk.blueBright(msg));
    parts.push('\n' + line);
    parts.push('        ' + time);
    parts.push(line + '\n');

    // output to console
    console.log(parts.join('\n'));

  } catch (error) {
    // don't crash bot if console logger fails
    try { console.error("console module error:", error); } catch (e) {}
  }
};

module.exports.run = async function ({ api, event, args }) {
  // optional: allow toggling per-thread console with command args (admin only)
  try {
    const { threadID, senderID } = event;
    if (!args || !args[0]) return api.sendMessage('Use: console on | console off (admin only)', threadID);

    const arg = args[0].toString().toLowerCase();
    const thread = global.data.threadData.get(threadID) || {};
    if (arg === 'on') {
      thread.console = true;
      global.data.threadData.set(threadID, thread);
      return api.sendMessage('Console logging disabled for this thread (thread.console = true).', threadID);
    } else if (arg === 'off') {
      thread.console = false;
      global.data.threadData.set(threadID, thread);
      return api.sendMessage('Console logging enabled for this thread (thread.console = false).', threadID);
    } else {
      return api.sendMessage('Unknown argument. Use: console on | console off', threadID);
    }
  } catch (err) {
    console.error(err);
  }
};
