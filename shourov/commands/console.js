module.exports.config = {
  name: "console",
  version: "1.0.0",
  permission: 3,
  credits: "shourov",
  prefix: true,
  description: "Show all chat logs in console",
  category: "system",
  usages: "",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event, Users }) {
  try {
    const chalk = global.nodemodule["chalk"] || require("chalk");
    const moment = global.nodemodule["moment-timezone"] || require("moment-timezone");

    let { senderID, threadID } = event;
    if (senderID == global.data.botID) return;

    const threadData = global.data.threadData.get(threadID) || {};
    if (threadData["console"] === true) return;

    const time = moment.tz("Asia/Dhaka").format("LLLL");

    let userName = await Users.getNameUser(senderID).catch(() => "Unknown User");
    let message = event.body || "📎 Attachment / Media / Sticker";

    // Detect Group or Private
    let isGroup = false;
    let threadName = "";
    try {
      const info = global.data.threadInfo.get(threadID);
      if (info && info.threadName) {
        isGroup = true;
        threadName = info.threadName;
      }
    } catch (e) {}

    console.log(
      chalk.green(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`) +
      chalk.yellow(`\n           ${isGroup ? "GROUP CHAT MESSAGE" : "PRIVATE CHAT MESSAGE"}`) +
      chalk.green(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`) +

      (isGroup ? 
        chalk.blue(`Group Name : `) + chalk.white(`${threadName}\n`) +
        chalk.blue(`Group ID   : `) + chalk.white(`${threadID}\n`)
      : "") +

      chalk.blue(`User Name  : `) + chalk.white(`${userName}\n`) +
      chalk.blue(`User ID    : `) + chalk.white(`${senderID}\n`) +
      chalk.blue(`Message    : `) + chalk.cyan(`${message}\n`) +

      chalk.green(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`) +
      chalk.magenta(`\n      ${time}`) +
      chalk.green(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    );

  } catch (err) {
    console.log("Console Log Error:", err);
  }
};

module.exports.run = async function () {
  // This command uses handleEvent only
};