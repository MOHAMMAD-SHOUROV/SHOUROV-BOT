module.exports.config = {
  name: "approve",
  version: "2.0.0",
  permission: 0,
  credits: "shourov",
  description: "approve thread using thread id",
  prefix: false,
  category: "admin",
  usages: "approve [group/remove] [threadid]",
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
    "listAdmin": 'approved list : \n\n%1',
    "notHavePermssion": 'you have no permission to use "%1"',
    "addedNewAdmin": 'approved %1 box :\n\n%2',
    "removedAdmin": 'remove %1 box in approve lists :\n\n%2'
  }
}

module.exports.run = async function ({ api, event, args, Threads, Users, permssion, getText }) {
  const content = args.slice(1, args.length);
  const { threadID, messageID, mentions } = event;
  const { configPath } = global.client;
  const { APPROVED } = global.config;
  const { writeFileSync } = global.nodemodule["fs-extra"];
  const mention = Object.keys(mentions || {});
  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);

  try {
    switch (args[0]) {
      case "list":
      case "all":
      case "-a": {
        const listApproved = APPROVED || config.APPROVED || [];
        var msg = [];

        for (const idApproved of listApproved) {
          if (idApproved) {
            let boxname;
            try {
              const groupName = (await global.data.threadInfo.get(idApproved)).threadName || "name does not exist";
              boxname = `group name : ${groupName}\ngroup id : ${idApproved}`;
            } catch (error) {
              const userName = await Users.getNameUser(idApproved);
              boxname = `user name : ${userName}\nuser id : ${idApproved}`;
            }
            msg.push(`\n${boxname}`);
          }
        }

        return api.sendMessage(`approved users and groups :\n${msg.join('\n')}`, threadID, messageID);
      }

      case "box": {
        if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

        // If mentions present and first content is not a number -> add mentioned ids
        if (mention.length != 0 && isNaN(content[0])) {
          var listAdd = [];
          for (const id of mention) {
            if (!APPROVED.includes(id)) {
              APPROVED.push(id);
              config.APPROVED.push(id);
            }
            listAdd.push(`${id} - ${event.mentions[id] || ''}`);
          }

          writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
          return api.sendMessage(getText("addedNewAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
        }
        // If a numeric thread id provided
        else if (content.length != 0 && !isNaN(content[0])) {
          const targetId = content[0].toString();
          if (!APPROVED.includes(targetId)) {
            APPROVED.push(targetId);
            config.APPROVED.push(targetId);
          }

          let boxname;
          try {
            const groupname = (await global.data.threadInfo.get(targetId)).threadName || "name does not exist";
            boxname = `group name : ${groupname}\ngroup id : ${targetId}`;
          } catch (error) {
            const username = await Users.getNameUser(targetId);
            boxname = `user name : ${username}\nuser id : ${targetId}`;
          }

          writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
          // send confirmation to the approved thread (if possible) and summary back to caller
          try {
            await api.sendMessage('this box has been approved', targetId);
          } catch (e) {
            // ignore if can't send to that thread
          }
          return api.sendMessage(getText("addedNewAdmin", 1, `${boxname}`), threadID, messageID);
        }
        else return global.utils.throwError(this.config.name, threadID, messageID);
      }

      case "remove":
      case "rm":
      case "delete": {
        if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);

        if (mention.length != 0 && isNaN(content[0])) {
          const mentionIds = Object.keys(mentions);
          var listRemoved = [];

          for (const id of mentionIds) {
            const index = config.APPROVED.findIndex(item => item == id);
            if (index !== -1) {
              APPROVED.splice(index, 1);
              config.APPROVED.splice(index, 1);
            }
            listRemoved.push(`${id} - ${event.mentions[id] || ''}`);
          }

          writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
          return api.sendMessage(getText("removedAdmin", mentionIds.length, listRemoved.join("\n").replace(/\@/g, "")), threadID, messageID);
        }
        else if (content.length != 0 && !isNaN(content[0])) {
          const targetId = content[0].toString();
          const index = config.APPROVED.findIndex(item => item.toString() == targetId);
          if (index !== -1) {
            APPROVED.splice(index, 1);
            config.APPROVED.splice(index, 1);
          }

          let boxname;
          try {
            const groupname = (await global.data.threadInfo.get(targetId)).threadName || "name does not exist";
            boxname = `group name : ${groupname}\ngroup id : ${targetId}`;
          } catch (error) {
            const username = await Users.getNameUser(targetId);
            boxname = `user name : ${username}\nuser id : ${targetId}`;
          }

          writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
          try {
            await api.sendMessage('this box has been removed from approved list', targetId);
          } catch (e) {
            // ignore if can't send to that thread
          }
          return api.sendMessage(getText("removedAdmin", 1, `${boxname}`), threadID, messageID);
        }
        else return global.utils.throwError(this.config.name, threadID, messageID);
      }

      default: {
        return global.utils.throwError(this.config.name, threadID, messageID);
      }
    }
  } catch (err) {
    console.error(`[approve] Error:`, err);
    return api.sendMessage("An unexpected error occurred while running approve command.", threadID, messageID);
  }
}