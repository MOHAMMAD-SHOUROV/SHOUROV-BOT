module.exports.config = {
  name: "friends",
  version: "1.0.1",
  permission: 3,
  credits: "ryuko",
  description: "List friends and optionally unfriend",
  prefix: true,
  category: "operator",
  usages: "friends [page]\nreply to list message with numbers or 'all' to unfriend",
  cooldowns: 5,
};

function tryRequire(name) {
  try {
    if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name];
  } catch (e) {}
  try {
    return require(name);
  } catch (e) {
    return null;
  }
}

module.exports.handleReply = async function ({ api, handleReply, event }) {
  const { threadID, messageID } = event;
  if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

  try {
    const body = (event.body || "").trim().toLowerCase();

    // if user replied 'all' -> unfriend all shown users
    if (body === "all") {
      let msgList = "";
      for (let i = 0; i < handleReply.uidUser.length; i++) {
        const uid = handleReply.uidUser[i];
        try {
          await api.unfriend(uid);
          msgList += `✅ সরানো হয়েছে: ${handleReply.nameUser[i]} - ${handleReply.uidUser[i]}\n`;
        } catch (e) {
          msgList += `❌ বাদ দেওয়া সম্ভব হয়নি: ${handleReply.nameUser[i]} - ${handleReply.uidUser[i]}\n`;
        }
      }
      await api.sendMessage(`প্রক্রিয়া সম্পন্ন:\n\n${msgList}`, threadID, () => api.unsendMessage(handleReply.messageID));
      return;
    }

    // parse numbers like: "1", "1 2 3", "1,2,5"
    const parts = event.body.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    const nums = parts.map(x => parseInt(x)).filter(n => !isNaN(n) && n > 0);

    if (!nums.length) {
      return api.sendMessage("সঠিক নম্বর দিন (উদাহরণ: 1 বা 1 2 3) অথবা 'all' লিখে সব বন্ধুকে সরান।", threadID, messageID);
    }

    let replyMsg = "";
    for (let n of nums) {
      const idx = n - 1;
      if (idx < 0 || idx >= handleReply.uidUser.length) {
        replyMsg += `⚠️ #${n} তালিকার বাইরে।\n`;
        continue;
      }
      const uid = handleReply.uidUser[idx];
      const name = handleReply.nameUser[idx] || uid;
      try {
        await api.unfriend(uid);
        replyMsg += `✅ সরানো: ${name} ( ${uid} )\n`;
      } catch (err) {
        console.error("unfriend error:", err);
        replyMsg += `❌ সরানো যায়নি: ${name} ( ${uid} )\n`;
      }
    }

    await api.sendMessage(`প্রকিয়া সম্পন্ন:\n\n${replyMsg}`, threadID, () => api.unsendMessage(handleReply.messageID));
  } catch (err) {
    console.error("handleReply error (friends):", err);
    try { await api.sendMessage("একটি ত্রুটি ঘটেছে। কনসোলে চেক করুন।", threadID, messageID); } catch(e) {}
  }
};


module.exports.run = async function ({ event, api, args }) {
  const { threadID, messageID } = event;
  try {
    // get friends list from api
    const dataFriend = await api.getFriendsList();
    if (!dataFriend || !Array.isArray(dataFriend) || dataFriend.length === 0) {
      return api.sendMessage("আপনার ফ্রেন্ড লিস্ট খালি বা পাওয়া যায়নি।", threadID, messageID);
    }

    const listFriend = dataFriend.map(f => ({
      name: f.fullName || "Unknown",
      uid: f.userID,
      gender: f.gender || "unknown",
      vanity: f.vanity || "",
      profileUrl: f.profileUrl || `https://facebook.com/profile.php?id=${f.userID}`
    }));

    const page = Math.max(1, parseInt(args[0]) || 1);
    const limit = 10;
    const numPage = Math.ceil(listFriend.length / limit);
    const start = limit * (page - 1);
    const end = Math.min(start + limit, listFriend.length);

    let msg = `আপনার মোট ${listFriend.length} টি friend আছে\n\n`;
    for (let i = start; i < end; i++) {
      const idx = i + 1;
      const it = listFriend[i];
      msg += `${idx}. ${it.name}\n   id: ${it.uid}\n   gender: ${it.gender}\n   vanity: ${it.vanity}\n   link: ${it.profileUrl}\n\n`;
    }
    msg += `page ${page}/${numPage}\n\nReply to this message with numbers to unfriend (e.g. "1" or "1 2 3") or reply with "all" to unfriend all shown.\n\n`;

    return api.sendMessage(msg, threadID, (err, info) => {
      // push handleReply data for later unfriend action
      global.client.handleReply.push({
        name: this.config.name,
        author: event.senderID,
        messageID: info.messageID,
        nameUser: listFriend.slice(start, end).map(x => x.name),
        urlUser: listFriend.slice(start, end).map(x => x.profileUrl),
        uidUser: listFriend.slice(start, end).map(x => x.uid),
        type: 'reply'
      });
    }, messageID);

  } catch (err) {
    console.error("friends command error:", err);
    return api.sendMessage("ত্রুটি: ফ্রেন্ড লিস্ট আনা যায়নি। ব্রাউজার/API চেক করুন।", threadID, messageID);
  }
};