module.exports.config = {
  name: "admin2",
  version: "2.0.0",
  permission: 0, // <-- এখানে framework-এ কমান্ডকে কারা চালাতে পারবে সেটাই রাখো (0/1/2)
  credits: "Shourov",
  description: "control admin lists",
  prefix: false,
  category: "admin",
  usages: "admin2 [add/remove] [uid]",
  cooldowns: 5,
};

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
}

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
  const content = args.slice(1);
  const { threadID, messageID, mentions } = event;
  const { configPath } = global.client;
  // ensure global.config.ADMINBOT exists
  if (!global.config) global.config = {};
  if (!global.config.ADMINBOT) global.config.ADMINBOT = [];
  const { ADMINBOT } = global.config;
  const { writeFileSync } = global.nodemodule["fs-extra"];

  // reload config file
  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);

  // array of mention ids
  const mentionIds = Object.keys(mentions || {});

  switch (args[0]) {
    case "list":
    case "all":
    case "-a": {
      const listAdmin = ADMINBOT || config.ADMINBOT || [];
      var msg = [];

      for (const idAdmin of listAdmin) {
        if (parseInt(idAdmin)) {
          const name = await Users.getNameUser(idAdmin);
          msg.push(`\nname : ${name}\nid : ${idAdmin}`);
        }
      };

      return api.sendMessage(getText("listAdmin", msg.join('\n')), threadID, messageID);
    }

    case "add": {
      // check caller permission (permssion param should be provided by framework)
      if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

      if (mentionIds.length != 0 && isNaN(content[0])) {
        var listAdd = [];

        for (const id of mentionIds) {
          if (!ADMINBOT.includes(id)) {
            ADMINBOT.push(id);
            config.ADMINBOT = config.ADMINBOT || [];
            config.ADMINBOT.push(id);
            listAdd.push(`${id} - ${event.mentions[id]}`);
          }
        };

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", listAdd.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
      }
      else if (content.length != 0 && !isNaN(content[0])) {
        const uid = content[0];
        if (!ADMINBOT.includes(uid)) {
          ADMINBOT.push(uid);
          config.ADMINBOT = config.ADMINBOT || [];
          config.ADMINBOT.push(uid);
        }
        const name = await Users.getNameUser(uid);
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
      }
      else return global.utils.throwError(this.config.name, threadID, messageID);
    }

    case "secret": {
      if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

      if (mentionIds.length != 0 && isNaN(content[0])) {
        var listGod = [];

        for (const id of mentionIds) {
          if (!ADMINBOT.includes(id)) {
            ADMINBOT.push(id);
            config.ADMINBOT = config.ADMINBOT || [];
            config.ADMINBOT.push(id);
            listGod.push(`${id} - ${event.mentions[id]}`);
          }
        };

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", listGod.length, listGod.join("\n").replace(/\@/g, "")), threadID, messageID);
      }
      else if (content.length != 0 && !isNaN(content[0])) {
        const uid = content[0];
        if (!ADMINBOT.includes(uid)) {
          ADMINBOT.push(uid);
          config.ADMINBOT = config.ADMINBOT || [];
          config.ADMINBOT.push(uid);
        }
        const name = await Users.getNameUser(uid);
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
      }
      else return global.utils.throwError(this.config.name, threadID, messageID);
    }

    case "remove":
    case "rm":
    case "delete": {
      if (permssion != 2) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);

      if (mentionIds.length != 0 && isNaN(content[0])) {
        var listRem = [];

        for (const id of mentionIds) {
          const index = config.ADMINBOT.findIndex(item => item == id);
          if (index !== -1) {
            ADMINBOT.splice(index, 1);
            config.ADMINBOT.splice(index, 1);
            listRem.push(`${id} - ${event.mentions[id]}`);
          }
        };

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("removedAdmin", listRem.length, listRem.join("\n").replace(/\@/g, "")), threadID, messageID);
      }
      else if (content.length != 0 && !isNaN(content[0])) {
        const index = config.ADMINBOT.findIndex(item => item.toString() == content[0]);
        if (index !== -1) {
          const uid = content[0];
          ADMINBOT.splice(index, 1);
          config.ADMINBOT.splice(index, 1);
          const name = await Users.getNameUser(uid);
          writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
          return api.sendMessage(getText("removedAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
        } else {
          return api.sendMessage("UID not found in admin list.", threadID, messageID);
        }
      }
      else global.utils.throwError(this.config.name, threadID, messageID);
    }

    default: {
      return global.utils.throwError(this.config.name, threadID, messageID);
    }
  };
}
