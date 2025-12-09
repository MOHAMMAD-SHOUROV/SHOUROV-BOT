module.exports.config = {
  name: "friends",
  version: "1.0.3",
  permission: 3,
  credits: "shourov",
  description: "list friends",
  prefix: true,
  category: "operator",
  usages: "friends [page]",
  cooldowns: 5,
};

module.exports.handleReply = async function ({ event, api, handleReply, shourov }) {
  const { threadID, messageID } = event;
  if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

  try {
    const raw = (event.body || "").trim().toLowerCase();
    if (!raw) return await shourov.reply("অনুগ্রহ করে সংখ্যা (1, 2 3) অথবা 'all' লিখুন।", threadID, messageID);

    // If user replied 'all' => unfriend all shown users
    if (raw === "all") {
      let resultMsg = "";
      for (let i = 0; i < handleReply.uidUser.length; i++) {
        const uid = handleReply.uidUser[i];
        const name = handleReply.nameUser[i] || uid;
        try {
          await api.unfriend(uid);
          resultMsg += `✅ সরানো হয়েছে: ${name} — ${uid}\n`;
        } catch (err) {
          console.error("unfriend error:", err);
          resultMsg += `❌ সরানো যায়নি: ${name} — ${uid}\n`;
        }
      }
      await shourov.reply(`প্রক্রিয়া সম্পন্ন:\n\n${resultMsg}`, threadID, messageID);
      return api.unsendMessage(handleReply.messageID).catch(()=>{});
    }

    // parse numbers: accept "1", "1 2 3", "1,2,5"
    const tokens = raw.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    const nums = tokens.map(x => parseInt(x)).filter(n => !isNaN(n) && n > 0);

    if (nums.length === 0) return await shourov.reply("সঠিক নম্বর দিন (উদাহরণ: 1 বা 1 2 3) অথবা 'all' লিখে সব সরান।", threadID, messageID);

    let replyMsg = "";
    for (const n of nums) {
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

    await shourov.reply(`প্রক্রিয়া সম্পন্ন:\n\n${replyMsg}`, threadID, messageID);
    return api.unsendMessage(handleReply.messageID).catch(()=>{});
  } catch (err) {
    console.error("handleReply (friends) error:", err);
    return await shourov.reply("একটি ত্রুটি ঘটেছে। কনসোলে লগ চেক করুন।", threadID, messageID);
  }
};


module.exports.run = async function ({ event, api, args, shourov }) {
  const { threadID, messageID } = event;
  try {
    const dataFriend = await api.getFriendsList();
    if (!Array.isArray(dataFriend) || dataFriend.length === 0) {
      return await shourov.reply("আপনার ফ্রেন্ড লিস্ট খালি বা পাওয়া যায়নি।", threadID, messageID);
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

    // send via shourov.reply and capture sent message (some loaders return the message object)
    const info = await shourov.reply(msg, threadID, messageID);
    // normalize messageID if possible for handleReply usage
    const sentMessageID = (info && info.messageID) ? info.messageID : (info && info.id) ? info.id : null;

    // push handleReply with the users in current page only
    global.client.handleReply.push({
      name: this.config.name,
      author: event.senderID,
      messageID: sentMessageID || messageID,
      nameUser: listFriend.slice(start, end).map(x => x.name),
      urlUser: listFriend.slice(start, end).map(x => x.profileUrl),
      uidUser: listFriend.slice(start, end).map(x => x.uid),
      type: 'reply'
    });

  } catch (err) {
    console.error("friends command error:", err);
    return await shourov.reply("ত্রুটি: ফ্রেন্ড লিস্ট আনা যায়নি। টোকেন/পারমিশন চেক করুন।", threadID, messageID);
  }
};