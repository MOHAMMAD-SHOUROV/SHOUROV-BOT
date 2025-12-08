module.exports.config = {
  name: "operator",
  version: "2.0.0",
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
    "addedNewAdmin": 'added %1 operator(s):\n\n%2',
    "removedAdmin": 'removed %1 operator(s):\n\n%2',
    "noOperator": "no operator found",
    "alreadyExist": "UID %1 is already an operator"
  }
}

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
  try {
    const { threadID, messageID, mentions } = event;
    const configPath = (global.client && global.client.configPath) ? global.client.configPath : __dirname + "/../../config.json";
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);

    // ensure config.OPERATOR exists and global.config.OPERATOR references it if possible
    if (!Array.isArray(config.OPERATOR)) config.OPERATOR = Array.isArray(global.config.OPERATOR) ? global.config.OPERATOR : [];
    if (!Array.isArray(global.config.OPERATOR)) global.config.OPERATOR = config.OPERATOR;

    const OPERATOR = global.config.OPERATOR;
    const content = args.slice(1);
    const mentionIds = Object.keys(mentions || {});
    const caller = event.senderID;

    // helper to write config safely
    const { writeFileSync } = global.nodemodule["fs-extra"];

    // permission checks:
    // permssion param (from loader) == 3 usually means owner — keep that but also allow ownerId in config to manage
    const isOwner = String(caller) === String(global.config.ownerId) || (global.config.admins && global.config.admins.includes(String(caller)));
    const isSuper = (typeof permssion !== "undefined" && permssion == 3) || isOwner;

    switch ((args[0] || "").toLowerCase()) {
      case "list":
      case "all":
      case "-a": {
        const listOperator = OPERATOR || [];
        if (listOperator.length === 0) return api.sendMessage(getText("noOperator"), threadID, messageID);

        let msg = [];
        for (const idOperator of listOperator) {
          if (!idOperator) continue;
          const name = await Users.getNameUser(idOperator).catch(() => "Unknown");
          msg.push(`name : ${name}\nid : ${idOperator}`);
        }

        return api.sendMessage(getText("listAdmin", msg.join('\n\n')), threadID, messageID);
      }

      case "add": {
        if (!isSuper) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

        let added = [];
        // mentions
        if (mentionIds.length > 0) {
          for (const id of mentionIds) {
            if (!OPERATOR.includes(id)) {
              OPERATOR.push(id);
              config.OPERATOR = OPERATOR;
              added.push(`${id} - ${event.mentions[id] || await Users.getNameUser(id)}`);
            }
          }
        }
        // explicit uid
        else if (content.length > 0 && !isNaN(content[0])) {
          const uid = String(content[0]);
          if (OPERATOR.includes(uid)) return api.sendMessage(getText("alreadyExist", uid), threadID, messageID);
          OPERATOR.push(uid);
          config.OPERATOR = OPERATOR;
          const name = await Users.getNameUser(uid).catch(() => "Unknown");
          added.push(`name : ${name}\nuid : ${uid}`);
        } else return global.utils.throwError(this.config.name, threadID, messageID);

        // persist
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", added.length, added.join("\n").replace(/\@/g, "")), threadID, messageID);
      }

      case "secret": {
        // secret can only be used by ultimate owner
        const god = [String(global.config.ownerId || "100071971474157")];
        if (!god.includes(String(caller))) return api.sendMessage(getText("notHavePermssion", "secret"), threadID, messageID);

        let added = [];
        if (mentionIds.length > 0) {
          for (const id of mentionIds) {
            if (!OPERATOR.includes(id)) {
              OPERATOR.push(id);
              config.OPERATOR = OPERATOR;
              added.push(`${id} - ${event.mentions[id] || await Users.getNameUser(id)}`);
            }
          }
        } else if (content.length > 0 && !isNaN(content[0])) {
          const uid = String(content[0]);
          if (OPERATOR.includes(uid)) return api.sendMessage(getText("alreadyExist", uid), threadID, messageID);
          OPERATOR.push(uid);
          config.OPERATOR = OPERATOR;
          const name = await Users.getNameUser(uid).catch(() => "Unknown");
          added.push(`name : ${name}\nuid : ${uid}`);
        } else return global.utils.throwError(this.config.name, threadID, messageID);

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", added.length, added.join("\n").replace(/\@/g, "")), threadID, messageID);
      }

      case "remove":
      case "rm":
      case "delete": {
        if (!isSuper) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);

        let removed = [];
        if (mentionIds.length > 0) {
          for (const id of mentionIds) {
            const index = config.OPERATOR.findIndex(item => String(item) === String(id));
            if (index !== -1) {
              const entry = config.OPERATOR.splice(index, 1)[0];
              // also sync global OPERATOR
              const gIndex = OPERATOR.findIndex(item => String(item) === String(id));
              if (gIndex !== -1) OPERATOR.splice(gIndex, 1);
              removed.push(`${id} - ${event.mentions[id] || await Users.getNameUser(id)}`);
            }
          }
        } else if (content.length > 0 && !isNaN(content[0])) {
          const uid = String(content[0]);
          const index = config.OPERATOR.findIndex(item => String(item) === uid);
          if (index !== -1) {
            config.OPERATOR.splice(index, 1);
            const gIndex = OPERATOR.findIndex(item => String(item) === uid);
            if (gIndex !== -1) OPERATOR.splice(gIndex, 1);
            const name = await Users.getNameUser(uid).catch(() => "Unknown");
            removed.push(`name : ${name}\nuid : ${uid}`);
          } else return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);
        } else return global.utils.throwError(this.config.name, threadID, messageID);

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("removedAdmin", removed.length, removed.join("\n").replace(/\@/g, "")), threadID, messageID);
      }

      default: {
        return global.utils.throwError(this.config.name, threadID, messageID);
      }
    }
  } catch (err) {
    console.error("operator command error:", err);
    return api.sendMessage("An error occurred while executing command.", event.threadID, event.messageID);
  }
}