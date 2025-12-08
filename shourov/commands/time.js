module.exports.config = {
  name: "time",
  version: "1.0.1",
  permssion: 0,
  prefix: true,
  credits: "Md Shourov Islam",
  description: "Exact time & date (KING_SHOUROV STYLE)",
  category: "Time and Date",
  usages: "time",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, Users }) {

  const moment = require("moment-timezone");

  // Time Zone Based Time
  const timeNow = moment.tz("Asia/Dhaka").format("hh:mm:ss A");
  const dateNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
  const dayNow = moment.tz("Asia/Dhaka").format("dddd");

  // User Name
  let username = await Users.getNameUser(event.senderID);

  // Response Text (Custom SHOUROV Style)
  const message = 
`╔════•| ✦ |•════╗
     ⏳ 𝙏𝙄𝙈𝙀 & 𝘿𝘼𝙏𝙀  
╚════•| ✦ |•════╝

👤 𝐇𝐞𝐥𝐥𝐨, ${username} 💛
🕒 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐓𝐢𝐦𝐞: ${timeNow}
📅 𝐃𝐚𝐭𝐞: ${dateNow}
📆 𝐃𝐚𝐲: ${dayNow}

✨ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲:  𝐀𝐥𝐈𝐇𝐒𝐀𝐍 𝐒𝐇𝐎𝐔𝐑𝐎𝐕👑
`;

  return api.sendMessage(message, event.threadID, event.messageID);
}