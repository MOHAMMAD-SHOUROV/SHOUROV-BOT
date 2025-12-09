module.exports.config = {
  name: "banned",
  version: "1.0.1",
  permission: 2,
  credits: "shourov",
  prefix: false,
  description: "Show ban list for users and threads",
  category: "admin",
  usages: "[thread|user|all]",
  cooldowns: 5,
};

function formatUserLine(index, name, id) {
  return `${index}. ${name}\n   ID: ${id}\n`;
}

function formatThreadLine(index, name, id) {
  return `${index}. ${name}\n   ID: ${id}\n`;
}

module.exports.run = async function({ api, args, Users, event, Threads }) {
  try {
    const type = (args[0] || "").toLowerCase();

    if (!type || !["user", "thread", "all"].includes(type)) {
      const usage = `Usage:\n` +
                    `${global.config && global.config.PREFIX ? global.config.PREFIX : ""}${this.config.name} user  -> list banned users\n` +
                    `${global.config && global.config.PREFIX ? global.config.PREFIX : ""}${this.config.name} thread -> list banned threads\n` +
                    `${global.config && global.config.PREFIX ? global.config.PREFIX : ""}${this.config.name} all    -> both lists`;
      return api.sendMessage(usage, event.threadID, event.messageID);
    }

    // Helper to fetch banned users
    const getBannedUsersOutput = async () => {
      const list = global.data && Array.isArray(global.data.userBanned) ? global.data.userBanned : [];
      if (list.length === 0) return "✅ Currently no user is banned.";

      const lines = [];
      let counter = 1;
      for (const iduser of list) {
        try {
          const userData = await Users.getData(iduser);
          // `userData.banned` expected to be 1 for banned
          if (userData && userData.banned == 1) {
            const name = userData.name || "Unknown";
            lines.push(formatUserLine(counter, name, iduser));
            counter++;
          }
        } catch (e) {
          // if Users.getData fails for one user, skip but continue
          console.error(`Error fetching user ${iduser}:`, e);
        }
      }
      if (lines.length === 0) return "✅ Currently no user is banned.";
      return "❎ Users banned by the system:\n\n" + lines.join("\n");
    };

    // Helper to fetch banned threads
    const getBannedThreadsOutput = async () => {
      const list = global.data && Array.isArray(global.data.threadBanned) ? global.data.threadBanned : [];
      if (list.length === 0) return "✅ Currently no thread is banned.";

      const lines = [];
      let counter = 1;
      for (const idthread of list) {
        try {
          const threadData = await Threads.getData(idthread);
          if (threadData && threadData.banned == 1) {
            let threadName = idthread;
            try {
              const info = await api.getThreadInfo(idthread);
              threadName = info && info.threadName ? info.threadName : threadName;
            } catch (err) {
              // can't get thread info: leave id as name fallback
            }
            lines.push(formatThreadLine(counter, threadName, idthread));
            counter++;
          }
        } catch (e) {
          console.error(`Error fetching thread ${idthread}:`, e);
        }
      }
      if (lines.length === 0) return "✅ Currently no thread is banned.";
      return "❎ Threads banned by the system:\n\n" + lines.join("\n");
    };

    // Respond according to requested type
    if (type === "user") {
      const out = await getBannedUsersOutput();
      return api.sendMessage(out, event.threadID, event.messageID);
    } else if (type === "thread") {
      const out = await getBannedThreadsOutput();
      return api.sendMessage(out, event.threadID, event.messageID);
    } else if (type === "all") {
      const [usersOut, threadsOut] = await Promise.all([getBannedUsersOutput(), getBannedThreadsOutput()]);
      return api.sendMessage(`${usersOut}\n\n${threadsOut}`, event.threadID, event.messageID);
    }
  } catch (err) {
    console.error("banned command error:", err);
    return api.sendMessage("An error occurred while fetching the ban list.", event.threadID, event.messageID);
  }
};