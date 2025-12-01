// commands/admin2.js
module.exports.config = {
  name: "admin2",
  version: "2.0.0",
  permission: 0,
  credits: "shourov (fixed)",
  description: "control admin lists",
  prefix: false,
  category: "admin",
  usages: "admin2 [list|add|remove|secret] [uid|@mention]",
  cooldowns: 5,
};

module.exports.name = module.exports.config.name;

module.exports.languages = {
  "vi": {
    "listAdmin": 'Danh sách toàn bộ người điều hành bot: \n\n%1',
    "notHavePermssion": 'Bạn không đủ quyền hạn để có thể sử dụng chức năng "%1"',
    "addedNewAdmin": 'Đã thêm %1 người dùng trở thành người điều hành bot:\n\n%2',
    "removedAdmin": 'Đã gỡ bỏ %1 người điều hành bot:\n\n%2'
  },
  "en": {
    "listAdmin": 'admin list: \n\n%1',
    "notHavePermssion": 'you have no permission to use "%1"',
    "addedNewAdmin": 'added %1 Admin :\n\n%2',
    "removedAdmin": 'remove %1 Admin:\n\n%2'
  }
};

module.exports.run = async function ({ api, event, args = [], Users, Threads, permssion, getText }) {
  try {
    const { threadID, messageID, mentions = {} } = event;
    const configPath = (global.client && global.client.configPath) ? global.client.configPath : null;

    // load config safely
    let config = (configPath) ? (() => {
      try {
        delete require.cache[require.resolve(configPath)];
        return require(configPath);
      } catch (e) {
        return global.config || {};
      }
    })() : (global.config || {});

    // helper getText fallback
    if (typeof getText !== 'function') {
      const lang = (global.config && global.config.language) ? global.config.language : 'en';
      getText = (key, ...repl) => {
        const tmpl = (module.exports.languages[lang] && module.exports.languages[lang][key]) || (module.exports.languages.en && module.exports.languages.en[key]) || key;
        return repl.length ? tmpl.replace('%1', repl[0]).replace('%2', repl[1] || '') : tmpl;
      };
    }

    // compute permission if not provided
    const senderID = event.senderID || event.author || null;
    let perm = typeof permssion !== 'undefined' ? permssion : 0;
    try {
      if (perm === 0) {
        const owners = (global.config && Array.isArray(global.config.OWNER)) ? global.config.OWNER.map(String) : [];
        const admins = (global.config && Array.isArray(global.config.ADMINBOT)) ? global.config.ADMINBOT.map(String) : [];
        if (owners.includes(String(senderID))) perm = 2;
        else if (admins.includes(String(senderID))) perm = 1;
        else perm = 0;
      }
    } catch (e) { /* ignore */ }

    // Normalize ADMINBOT array in memory
    if (!Array.isArray(global.config.ADMINBOT)) global.config.ADMINBOT = Array.isArray(config.ADMINBOT) ? config.ADMINBOT : [];
    if (!Array.isArray(config.ADMINBOT)) config.ADMINBOT = [];

    const sub = (args[0] || "").toLowerCase();
    const content = args.slice(1);
    const mentionIds = Object.keys(mentions || {}).map(id => String(id));

    switch (sub) {
      case "list":
      case "all":
      case "-a": {
        const listAdmin = Array.isArray(global.config.ADMINBOT) ? global.config.ADMINBOT : (Array.isArray(config.ADMINBOT) ? config.ADMINBOT : []);
        if (listAdmin.length === 0) return api.sendMessage(getText("listAdmin", "No admins found"), threadID, messageID);

        const lines = [];
        for (const idAdmin of listAdmin) {
          try {
            const name = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(idAdmin) : idAdmin;
            lines.push(`name : ${name}\nid : ${idAdmin}`);
          } catch (e) {
            lines.push(`name : unknown\nid : ${idAdmin}`);
          }
        }
        return api.sendMessage(getText("listAdmin", lines.join('\n\n')), threadID, messageID);
      }

      case "add": {
        if (perm < 2) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

        // via mention(s)
        if (mentionIds.length) {
          const listAdd = [];
          for (const id of mentionIds) {
            if (!global.config.ADMINBOT.includes(String(id))) {
              global.config.ADMINBOT.push(String(id));
              if (!config.ADMINBOT) config.ADMINBOT = [];
              config.ADMINBOT.push(String(id));
            }
            const disp = (mentions[id] && mentions[id].replace ? mentions[id].replace(/\@/g, "") : (await Users.getNameUser(id)).toString());
            listAdd.push(`${id} - ${disp}`);
          }
          // persist
          if (configPath) try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e.message); }
          return api.sendMessage(getText("addedNewAdmin", mentionIds.length, listAdd.join("\n")), threadID, messageID);
        }

        // via UID(s)
        if (content.length && content[0] && /^\d+$/.test(String(content[0]))) {
          const uid = String(content[0]);
          if (!global.config.ADMINBOT.includes(uid)) {
            global.config.ADMINBOT.push(uid);
            if (!config.ADMINBOT) config.ADMINBOT = [];
            config.ADMINBOT.push(uid);
          }
          const name = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(uid) : uid;
          if (configPath) try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e.message); }
          return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
        }

        return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);
      }

      case "secret": {
        // secret behaves like add but same permission
        if (perm < 2) return api.sendMessage(getText("notHavePermssion", "secret"), threadID, messageID);

        if (mentionIds.length) {
          const listAdd = [];
          for (const id of mentionIds) {
            if (!global.config.ADMINBOT.includes(String(id))) {
              global.config.ADMINBOT.push(String(id));
              if (!config.ADMINBOT) config.ADMINBOT = [];
              config.ADMINBOT.push(String(id));
            }
            const disp = (mentions[id] && mentions[id].replace ? mentions[id].replace(/\@/g, "") : (await Users.getNameUser(id)).toString());
            listAdd.push(`${id} - ${disp}`);
          }
          if (configPath) try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e.message); }
          return api.sendMessage(getText("addedNewAdmin", mentionIds.length, listAdd.join("\n")), threadID, messageID);
        }

        if (content.length && content[0] && /^\d+$/.test(String(content[0]))) {
          const uid = String(content[0]);
          if (!global.config.ADMINBOT.includes(uid)) {
            global.config.ADMINBOT.push(uid);
            if (!config.ADMINBOT) config.ADMINBOT = [];
            config.ADMINBOT.push(uid);
          }
          const name = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(uid) : uid;
          if (configPath) try { require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { console.warn('Could not write config:', e.message); }
          return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
        }

        return api.sendMessage(getText("notHavePerm
