module.exports.config = {
  name: "count",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "shourov (fixed)",
  description: "Show counts: message/admin/member/male/female/other/allgroup/alluser",
  category: "user",
  usages: "count <message|admin|member|male|female|other|allgroup|alluser>",
  cooldowns: 5,
};

module.exports.run = async function({ api, Threads, Users, event, args }) {
  try {
    const choice = (args[0] || "").toString().toLowerCase().trim();

    const reply = (text) => api.sendMessage(text, event.threadID, event.messageID);

    // if no argument
    if (!choice) {
      return reply(
        "Please provide a tag. Usage:\n" +
        "message | admin | member | male | female | other | allgroup | alluser"
      );
    }

    // get current thread info
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(event.threadID);
    } catch (err) {
      console.error("getThreadInfo error:", err);
      return reply("Failed to fetch thread info. Try again later.");
    }

    // compute genders in the thread (some APIs return undefined gender)
    const userInfos = threadInfo.userInfo || [];
    const male = userInfos.filter(u => (u.gender || "").toString().toUpperCase() === "MALE").length;
    const female = userInfos.filter(u => (u.gender || "").toString().toUpperCase() === "FEMALE").length;
    const other = userInfos.length - male - female;

    // get global lists (may be heavy on large bots; keep as-is if you need it)
    let allGroups = [];
    let allUsers = [];
    try {
      allGroups = await Threads.getAll(['threadID']) || [];
    } catch (e) {
      allGroups = [];
    }
    try {
      allUsers = await Users.getAll(['userID']) || [];
    } catch (e) {
      allUsers = [];
    }

    switch (choice) {
      case "message":
        return reply(`This group has ${threadInfo.messageCount || 0} messages.`);
      case "admin":
        return reply(`This group has ${ (threadInfo.adminIDs && threadInfo.adminIDs.length) || 0 } administrator(s).`);
      case "member":
        return reply(`This group has ${ (threadInfo.participantIDs && threadInfo.participantIDs.length) || 0 } member(s).`);
      case "male":
        return reply(`This group has ${male} male member(s).`);
      case "female":
        return reply(`This group has ${female} female member(s).`);
      case "other":
      case "gei":
      case "gay":
        return reply(`This group has ${other} member(s) with other/unknown gender.`);
      case "allgroup":
        return reply(`Bot is currently in ${allGroups.length} group(s).`);
      case "alluser":
        return reply(`Total ${allUsers.length} user(s) in database.`);
      default:
        return reply(
          `Unknown tag "${choice}". Use one of:\n` +
          "message | admin | member | male | female | other | allgroup | alluser"
        );
    }
  } catch (err) {
    console.error("count command error:", err);
    try { return api.sendMessage("An unexpected error occurred while running count.", event.threadID, event.messageID); } catch(e){}
  }
};
