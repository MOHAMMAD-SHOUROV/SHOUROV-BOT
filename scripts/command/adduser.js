module.exports.config = {
  name: "adduser",
  version: "1.0.0",
  permission: 0,
  credits: "King_Shourov (Modified from D-Jukie)",
  description: "Add user to group using Facebook profile link or UID",
  prefix: true,
  category: "box",
  usages: "<link or uid>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage("❌ Please enter the Facebook profile link or UID you want to add.", threadID, messageID);
  }

  let uidUser;
  const input = args[0];
  const threadInfo = await api.getThreadInfo(threadID);
  const { participantIDs, approvalMode, adminIDs } = threadInfo;

  try {
    if (input.includes(".com/")) {
      // Convert link to UID using external API
      const res = await axios.get(`https://golike.com.vn/func-api.php?user=${input}`);
      uidUser = res.data.data.uid;
      if (!uidUser) throw new Error("UID not found from link.");
    } else {
      uidUser = input;
    }

    if (participantIDs.includes(uidUser)) {
      return api.sendMessage("⚠️ This user is already in the group.", threadID, messageID);
    }

    api.addUserToGroup(uidUser, threadID, (err) => {
      if (err) {
        return api.sendMessage("❌ Failed to add user. Maybe this account has privacy settings or you are not admin.", threadID, messageID);
      } else if (approvalMode && !adminIDs.some(ad => ad.id == api.getCurrentUserID())) {
        return api.sendMessage("✅ User added to pending list. An admin needs to approve.", threadID, messageID);
      } else {
        return api.sendMessage("✅ User added to group successfully.", threadID, messageID);
      }
    });
  } catch (e) {
    return api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
  }
};
