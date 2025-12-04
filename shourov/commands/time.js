module.exports.config = {
  name: "time",
  version: "1.0.1",
  permission: 0,
  prefix: true,
  credits: "shourov",
  description: "( Exact time & date )",
  category: "Time and Date",
  usages: "( Exact time )",
  cooldowns: 0,
  dependencies: []
};

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const moment = require("moment-timezone");

  try {
    // Primary timezone for time
    const tzTime = "Asia/Dhaka";
    // Secondary timezone for date/day (if you intended Manila originally)
    const tzDate = "Asia/Manila";

    const timeStr = moment.tz(tzTime).format("HH:mm:ss");
    const dateStr = moment.tz(tzDate).format("DD/MM/YYYY");
    const weekday = moment.tz(tzDate).format("dddd"); // e.g. Monday, Tuesday

    const name = await Users.getNameUser(event.senderID);

    const message =
`〘───── •『 𝙏𝙞𝙢𝙚 』• ─────〙
Hello 「﹝${name}﹞」
Current time ( ${tzTime} ) : ${timeStr}
Date ( ${tzDate} ) : ${dateStr} (${weekday})
〘───── •『 𝙏𝙞𝙢𝙚 』• ─────〙`;

    return api.sendMessage(message, event.threadID, event.messageID);
  } catch (err) {
    console.error("time command error:", err);
    return api.sendMessage("An error occurred while fetching the time.", event.threadID, event.messageID);
  }
};