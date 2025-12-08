module.exports.config = {
  name: "time",
  version: "1.0.2",
  permission: 0,
  prefix: true,
  credits: "Md Shourov Islam (optimized)",
  description: "Exact time & date (KING_SHOUROV_STYLE)",
  category: "Time and Date",
  usages: "time",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, Users }) {
  const moment = require("moment-timezone");

  try {
    // Time Zone Based Time
    const timeNow = moment.tz("Asia/Dhaka").format("hh:mm:ss A");
    const dateNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
    const dayNow  = moment.tz("Asia/Dhaka").format("dddd");

    // Safe Username Fetch
    let username = event.senderID;
    try {
      if (Users && typeof Users.getNameUser === "function") {
        username = await Users.getNameUser(event.senderID);
      }
    } catch {}

    // SHOUROV Styled Reply
    const msg =
`╔════•| ✦ |•════╗
      ⏳ 𝙏𝙄𝙈𝙀 & 𝘿𝘼𝙏𝙀  
╚════•| ✦ |•════╝

👤 𝐇𝐞𝐥𝐥𝐨, ${username} 💛
🕒 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐓𝐢𝐦𝐞: ${timeNow}
📅 𝐃𝐚𝐭𝐞: ${dateNow}
📆 𝐃𝐚𝐲: ${dayNow}

✨ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲: 𝐀𝐋𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕 👑`;

    return api.sendMessage(msg, event.threadID, event.messageID);

  } catch (err) {
    console.error("TIME CMD ERROR:", err);
    return api.sendMessage("⚠️ Time module error: " + (err.message || err), event.threadID, event.messageID);
  }
};