module.exports.config = {
  name: "allgroups",
  version: "2.0.1",
  permission: 2,
  credits: "shourov",
  description: "Show all groups and control them (ban/out)",
  prefix: true,
  category: "admin",
  usages: "allgroups",
  cooldowns: 5,
};

module.exports.handleReply = async function ({ api, event, handleReply, Threads }) {
  if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

  const args = event.body.trim().split(" ");
  const action = args[0]?.toLowerCase();
  const index = parseInt(args[1]);

  if (isNaN(index) || index < 1 || index > handleReply.groupid.length) {
    return api.sendMessage("❌ Invalid group number!", event.threadID, event.messageID);
  }

  const groupID = handleReply.groupid[index - 1];

  switch (action) {
    case "ban": {
      const threadData = (await Threads.getData(groupID)).data || {};
      threadData.banned = 1;

      await Threads.setData(groupID, { data: threadData });
      global.data.threadBanned.set(parseInt(groupID), 1);

      return api.sendMessage(
        `✅ Successfully banned group:\n📌 ID: ${groupID}`,
        event.threadID,
        event.messageID
      );
    }

    case "out": {
      try {
        api.removeUserFromGroup(api.getCurrentUserID(), groupID);
      } catch (e) {}

      return api.sendMessage(
        `🚪 Left the group:\n📌 ID: ${groupID}`,
        event.threadID,
        event.messageID
      );
    }

    default:
      return api.sendMessage(
        `❌ Invalid action!\nUse:\n👉 ban <number>\n👉 out <number>`,
        event.threadID,
        event.messageID
      );
  }
};

module.exports.run = async function ({ api, event }) {
  try {
    const threads = await api.getThreadList(200, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup && t.isSubscribed);

    let list = [];

    for (const group of groups) {
      try {
        const info = await api.getThreadInfo(group.threadID);

        list.push({
          id: group.threadID,
          name: group.name || "No Name",
          members: info.userInfo.length
        });
      } catch (e) {}
    }

    // sort by members (descending)
    list.sort((a, b) => b.members - a.members);

    let msg = "📌 GROUP LIST\n\n";
    let groupid = [];
    let index = 1;

    for (const g of list) {
      msg += `${index}. ${g.name}\n🆔 ID: ${g.id}\n👥 Members: ${g.members}\n\n`;
      groupid.push(g.id);
      index++;
    }

    msg += `Reply with:\n👉 ban <number> to ban a group\n👉 out <number> to leave a group`;

    api.sendMessage(msg, event.threadID, (err, data) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: data.messageID,
        author: event.senderID,
        groupid,
        type: "reply"
      });
    });
  } catch (e) {
    console.log(e);
    api.sendMessage("⚠️ Error fetching group list!", event.threadID);
  }
};
