const fs = require("fs");

module.exports.config = {
  name: "uid",
  aliases: ["getuid"],
  version: "2.0.0",
  permission: 0,
  prefix: true,
  credits: "Shourov (fixed)",
  description: "Get Facebook UID",
  category: "utility",
  usages: "reply / mention / self",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    let targetID = null;

    // 1️⃣ reply → replied user
    if (event.type === "message_reply" && event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
    }
    // 2️⃣ mention → first mentioned user
    else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }
    // 3️⃣ default → sender
    else {
      targetID = senderID;
    }

    const msg =
`╔══════════════╗
   🆔 USER UID
╚══════════════╝

👤 UID : ${targetID}
🔗 m.me/${targetID}
🌐 https://facebook.com/${targetID}

══════════════`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("UID ERROR:", err);
    return api.sendMessage("❌ UID fetch করতে সমস্যা হয়েছে", threadID, messageID);
  }
};