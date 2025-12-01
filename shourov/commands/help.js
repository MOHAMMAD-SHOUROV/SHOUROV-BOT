const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "help",
  version: "1.0.5",
  permission: 0,
  credits: "shourov",
  description: "Show all commands or detailed info for a specific command",
  prefix: true,
  category: "guide",
  usages: "[page | commandName]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: true,
    delayUnsend: 60 // seconds
  }
};

module.exports.languages = {
  "en": {
    "helpListTitle": "📚 Command List — Page %1/%2",
    "helpListFooter": "Use: %1help <command> to see details of a command\nTotal commands: %2",
    "noCommand": "❌ Command '%1' not found.",
    "moduleInfo": "「 %1 」\n%2\n\n❯ Usage: %3\n❯ Category: %4\n❯ Cooldown: %5 second(s)\n❯ Permission: %6\n❯ Credits: %7",
    "perm_user": "Anyone",
    "perm_admin": "Group Admin",
    "perm_op": "Bot Operator",
    "pageArgErr": "❗ Invalid page number, showing page 1."
  },
  "bn": {
    "helpListTitle": "📚 কমান্ড তালিকা — পৃষ্ঠা %1/%2",
    "helpListFooter": "ব্যবহার: %1help <command> — একটি কমান্ডের বিবরণ দেখার জন্য\nমোট কমান্ড: %2",
    "noCommand": "❌ '%1' নামক কমান্ড পাওয়া যায়নি।",
    "moduleInfo": "「 %1 」\n%2\n\n❯ ব্যবহার: %3\n❯ বিভাগ: %4\n❯ অপেক্ষার সময়: %5 সেকেন্ড\n❯ অনুমতি: %6\n❯ ক্রেডিট: %7",
    "perm_user": "সবার জন্য",
    "perm_admin": "গ্রুপ অ্যাডমিন",
    "perm_op": "বট অপারেটর",
    "pageArgErr": "❗ ভুল পৃষ্ঠা সংখ্যা, পৃষ্ঠা 1 দেখানো হচ্ছে।"
  }
};

/**
 * Helper to get language text (fallback to en)
 */
module.exports.getText = function (key, lang = "en") {
  try {
    if (this.languages && this.languages[lang] && this.languages[lang][key]) return this.languages[lang][key];
  } catch (e) { }
  return this.languages.en[key] || "";
};

module.exports.handleEvent = function ({ api, event, getText }) {
  // Keep compatibility: if someone uses 'help <command>' as message (not command invocation)
  // we will not handle it here to avoid duplicate behavior — the run method covers explicit calls.
  return;
};

module.exports.run = async function ({ api, event, args, Users, Threads, getText }) {
  try {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const lang = (global.data && global.data.threadData && global.data.threadData.get(threadID) && global.data.threadData.get(threadID).lang) ? global.data.threadData.get(threadID).lang : "en";
    const text = (key, ...rest) => {
      const tpl = this.getText(key, lang);
      return rest.length ? tpl.replace(/%(\d+)/g, (_, n) => rest[parseInt(n) - 1]) : tpl;
    };

    const prefix = (global.data && global.data.threadData && global.data.threadData.get(threadID) && global.data.threadData.get(threadID).PREFIX) ? global.data.threadData.get(threadID).PREFIX : (global.config && global.config.PREFIX ? global.config.PREFIX : "");

    // If user asked for a specific command: help <command>
    if (args && args.length > 0 && isNaN(args[0])) {
      const name = args[0].toLowerCase();
      const command = global.client.commands.get(name);
      if (!command) {
        return api.sendMessage(text("noCommand", name), threadID, messageID);
      }

      // Prepare permission text
      const perm = (cmd) => {
        const p = cmd.config.hasPermssion || cmd.config.permission || 0;
        if (p === 0) return text("perm_user");
        if (p === 1) return text("perm_admin");
        return text("perm_op");
      };

      const usage = `${prefix}${command.config.name}${command.config.usages ? " " + command.config.usages : ""}`;
      const infoMsg = text("moduleInfo",
        command.config.name,
        command.config.description || "No description provided.",
        usage,
        command.config.category || command.config.commandCategory || "Unknown",
        command.config.cooldowns != null ? String(command.config.cooldowns) : "0",
        perm(command),
        command.config.credits || command.config.credits || "unknown"
      );

      return api.sendMessage(infoMsg, threadID, messageID);
    }

    // Otherwise show paginated list
    const allCommands = Array.from(global.client.commands.values())
      .filter(cmd => cmd && cmd.config && cmd.config.name)
      // optionally filter out hidden commands if you have that flag
      //.filter(cmd => !cmd.config.hidden)
      .sort((a, b) => {
        // sort by category then name
        const ca = (a.config.category || a.config.commandCategory || "").toLowerCase();
        const cb = (b.config.category || b.config.commandCategory || "").toLowerCase();
        if (ca < cb) return -1;
        if (ca > cb) return 1;
        return a.config.name.localeCompare(b.config.name);
      });

    const numberOfOnePage = 10;
    let page = parseInt(args[0]) || 1;
    const totalPages = Math.max(1, Math.ceil(allCommands.length / numberOfOnePage));
    if (isNaN(page) || page < 1 || page > totalPages) {
      page = 1;
      // inform user if they provided bad page (optional)
      if (args[0]) await api.sendMessage(text("pageArgErr"), threadID);
    }

    const start = (page - 1) * numberOfOnePage;
    const pageSlice = allCommands.slice(start, start + numberOfOnePage);

    // Build nice message
    let msg = "";
    msg += `╭─── ${text("helpListTitle", page, totalPages)} ───╮\n\n`;
    let index = start;
    for (const cmd of pageSlice) {
      index++;
      const usages = cmd.config.usages ? ` ${cmd.config.usages}` : "";
      const cat = cmd.config.category || cmd.config.commandCategory || "Unknown";
      msg += `╭─ ${index}. ${prefix}${cmd.config.name}${usages}\n`;
      msg += `│  ↳ ${cmd.config.description ? cmd.config.description : "No description"}\n`;
      msg += `│  ↳ Category: ${cat} • Cooldown: ${cmd.config.cooldowns || 0}s\n`;
      msg += `╰────────────────────\n`;
    }

    msg += `\n` + text("helpListFooter", prefix, allCommands.length) + `\n`;

    // Send message and unsend if configured in envConfig
    const { autoUnsend, delayUnsend } = (global.configModule && global.configModule[this.config.name]) ? global.configModule[this.config.name] : this.config.envConfig || { autoUnsend: false, delayUnsend: 60 };

    api.sendMessage(msg, threadID, async (err, info) => {
      if (err) return console.error("help: sendMessage error:", err);
      if (autoUnsend) {
        try {
          // delayUnsend is in seconds — ensure positive and not extremely large
          const delay = Math.max(5, parseInt(delayUnsend) || 60);
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
          return api.unsendMessage(info.messageID);
        } catch (e) {
          // ignore unsend errors
        }
      }
    }, messageID);

  } catch (error) {
    console.error("help command error:", error && (error.stack || error));
    try { return api.sendMessage("❗ An unexpected error occurred while fetching help.", event.threadID, event.messageID); } catch (e) {}
  }
};
