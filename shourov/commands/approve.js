// commands/approve.js
module.exports.config = {
  name: "approve",
  version: "2.0.1",
  permission: 0,
  credits: "shourov (fixed)",
  description: "approve thread using thread id",
  prefix: false,
  category: "admin",
  usages: "approve [list|box|remove] [threadid|@mention]",
  cooldowns: 5,
};

module.exports.name = module.exports.config.name;

module.exports.languages = {
  "vi": {
    "listAdmin": 'Danh sách toàn bộ người/phòng đã approve: \n\n%1',
    "notHavePermssion": 'Bạn không đủ quyền hạn để có thể sử dụng chức năng "%1"',
    "addedNewAdmin": 'Đã thêm %1 mục vào danh sách approved :\n\n%2',
    "removedAdmin": 'Đã gỡ bỏ %1 mục khỏi danh sách approved:\n\n%2'
  },
  "en": {
    "listAdmin": 'Approved list : \n\n%1',
    "notHavePermssion": 'you have no permission to use "%1"',
    "addedNewAdmin": 'Approved %1 item(s):\n\n%2',
    "removedAdmin": 'Removed %1 item(s) from approved list:\n\n%2'
  }
};

module.exports.run = async function ({ api, event, args = [], Threads, Users, permssion, getText }) {
  try {
    const { threadID, messageID, mentions = {} } = event;
    const content = args.slice(1);
    const mentionIds = Object.keys(mentions || {});
    const configPath = (global.client && global.client.configPath) ? global.client.configPath : null;

    // load config safely
    let config = (function () {
      try {
        if (configPath) {
          delete require.cache[require.resolve(configPath)];
          return require(configPath);
        }
      } catch (e) { /* ignore */ }
      return global.config || {};
    })();

    // ensure APPROVED arrays exist both in memory and config
    if (!Array.isArray(global.config.APPROVED)) global.config.APPROVED = Array.isArray(config.APPROVED) ? config.APPROVED : [];
    if (!Array.isArray(config.APPROVED)) config.APPROVED = Array.isArray(global.config.APPROVED) ? global.config.APPROVED : [];

    // getText fallback
    if (typeof getText !== 'function') {
      const lang = (global.config && global.config.language) ? global.config.language : 'en';
      getText = (key, a, b) => {
        const tmpl = (module.exports.languages[lang] && module.exports.languages[lang][key]) || module.exports.languages.en[key] || key;
        return tmpl.replace('%1', a || '').replace('%2', b || '');
      };
    }

    // permission check: we expect permssion param (as in your loader) - require level 3 for modify ops
    const userPerm = (typeof permssion !== 'undefined') ? permssion : 0;

    const sub = (args[0] || "").toLowerCase();

    switch (sub) {
      case "list":
      case "all":
      case "-a": {
        const listApproved = Array.isArray(global.config.APPROVED) ? global.config.APPROVED : [];
        if (listApproved.length === 0) {
          return api.sendMessage(getText("listAdmin", "No approved boxes/users found."), threadID, messageID);
        }

        const lines = [];
        for (const id of listApproved) {
          try {
            if (/^\d+$/.test(String(id))) {
              // try thread name from cached threadInfo if available
              let boxname = "";
              try {
                const tinfo = (global.data && global.data.threadInfo && global.data.threadInfo.get) ? global.data.threadInfo.get(id) : (global.data && global.data.threadInfo ? global.data.threadInfo[id] : null);
                const groupName = tinfo && tinfo.threadName ? tinfo.threadName : null;
                if (groupName) boxname = `group name : ${groupName}\ngroup id : ${id}`;
                else {
                  const userName = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(id) : id;
                  boxname = `user name : ${userName}\nuser id : ${id}`;
                }
              } catch (e) {
                const userName = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(id) : id;
                boxname = `user name : ${userName}\nuser id : ${id}`;
              }
              lines.push(boxname);
            } else {
              // non-numeric entry: display as-is
              lines.push(String(id));
            }
          } catch (e) {
            lines.push(String(id));
          }
        }

        return api.sendMessage(getText("listAdmin", lines.join('\n\n')), threadID, messageID);
      }

      case "box": {
        // require highest permission (3) to add boxes/users
        if (userPerm < 3) return api.sendMessage(getText("notHavePermssion", "box"), threadID, messageID);

        // add via mentions
        if (mentionIds.length && !content[0]) {
          const added = [];
          for (const id of mentionIds) {
            if (!global.config.APPROVED.includes(String(id))) {
              global.config.APPROVED.push(String(id));
              config.APPROVED.push(String(id));
            }
            const display = event.mentions && event.mentions[id] ? event.mentions[id].replace(/\@/g, "") : (await Users.getNameUser(id));
            added.push(`${id} - ${display}`);
          }
          // persist
          try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e && e.message); }
          return api.sendMessage(getText("addedNewAdmin", added.length, added.join("\n")), threadID, messageID);
        }

        // add via id
        if (content.length && /^\d+$/.test(String(content[0]))) {
          const idToAdd = String(content[0]);
          if (!global.config.APPROVED.includes(idToAdd)) {
            global.config.APPROVED.push(idToAdd);
            config.APPROVED.push(idToAdd);
          }

          // build box info (group name if possible)
          let boxname;
          try {
            const tinfo = (global.data && global.data.threadInfo && global.data.threadInfo.get) ? global.data.threadInfo.get(idToAdd) : (global.data && global.data.threadInfo ? global.data.threadInfo[idToAdd] : null);
            const groupname = tinfo && tinfo.threadName ? tinfo.threadName : null;
            if (groupname) boxname = `group name : ${groupname}\ngroup id : ${idToAdd}`;
            else {
              const username = await Users.getNameUser(idToAdd);
              boxname = `user name : ${username}\nuser id : ${idToAdd}`;
            }
          } catch (e) {
            const username = await Users.getNameUser(idToAdd);
            boxname = `user name : ${username}\nuser id : ${idToAdd}`;
          }

          // persist and notify
          try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e && e.message); }
          // send a direct approve notification to the box/thread (best-effort)
          try {
            await api.sendMessage('This box has been approved ✅', idToAdd);
          } catch (e) { /* ignore */ }
          return api.sendMessage(getText("addedNewAdmin", 1, boxname), threadID, messageID);
        }

        return api.sendMessage("Usage: approve box @mention  OR  approve box <threadID>", threadID, messageID);
      }

      case "remove":
      case "rm":
      case "delete": {
        if (userPerm < 3) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);

        if (mentionIds.length && !content[0]) {
          const removed = [];
          for (const id of mentionIds) {
            const idx = config.APPROVED.findIndex(item => String(item) === String(id));
            if (idx !== -1) config.APPROVED.splice(idx, 1);
            const idx2 = global.config.APPROVED.findIndex(item => String(item) === String(id));
            if (idx2 !== -1) global.config.APPROVED.splice(idx2, 1);
            const disp = event.mentions && event.mentions[id] ? event.mentions[id].replace(/\@/g, "") : (await Users.getNameUser(id));
            removed.push(`${id} - ${disp}`);
          }
          try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e && e.message); }
          return api.sendMessage(getText("removedAdmin", removed.length, removed.join("\n")), threadID, messageID);
        }

        if (content.length && /^\d+$/.test(String(content[0]))) {
          const idToRemove = String(content[0]);
          const idx = config.APPROVED.findIndex(item => String(item) === idToRemove);
          if (idx !== -1) config.APPROVED.splice(idx, 1);
          const idx2 = global.config.APPROVED.findIndex(item => String(item) === idToRemove);
          if (idx2 !== -1) global.config.APPROVED.splice(idx2, 1);

          let boxname;
          try {
            const tinfo = (global.data && global.data.threadInfo && global.data.threadInfo.get) ? global.data.threadInfo.get(idToRemove) : (global.data && global.data.threadInfo ? global.data.threadInfo[idToRemove] : null);
            const groupname = tinfo && tinfo.threadName ? tinfo.threadName : null;
            if (groupname) boxname = `group name : ${groupname}\ngroup id : ${idToRemove}`;
            else {
              const username = await Users.getNameUser(idToRemove);
              boxname = `user name : ${username}\nuser id : ${idToRemove}`;
            }
          } catch (e) {
            const username = await Users.getNameUser(idToRemove);
            boxname = `user name : ${username}\nuser id : ${idToRemove}`;
          }

          try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e && e.message); }
          // try to notify removed box
          try { await api.sendMessage('This box has been removed from approved list ❌', idToRemove); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("removedAdmin", 1, boxname), threadID, messageID);
        }

        return api.sendMessage("Usage: approve remove @mention  OR  approve remove <threadID>", threadID, messageID);
      }

      default:
        return global.utils && typeof global.utils.throwError === 'function' ? global.utils.throwError(this.config.name, threadID, messageID) : api.sendMessage(`Usage: ${this.config.usages}`, threadID, messageID);
    }
  } catch (err) {
    console.error("approve command error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while processing the approve command.", event.threadID || event.senderID); } catch (e) {}
  }
};
