module.exports.config = {
  name: "count",
  version: "1.0.0",
  permission: 0,
  prefix: true,
  credits: "shourov",
  description: "Count message, admin, members, gender, total groups & users",
  category: "user",
  usages: "count message/admin/member/male/female/other/allgroup/alluser",
  cooldowns: 5,
};

module.exports.run = async function ({ api, Threads, Users, event, args }) {

  let type = args[0]; // args.join() ভুল, শুধু args[0] নেওয়াই ঠিক

  const out = (msg) => api.sendMessage(msg, event.threadID, event.messageID);

  // ⚠️ Argument না দিলে হেল্প মেসেজ
  if (!type) {
    return out(
`⚠️ আপনি কোনো ট্যাগ দেননি!

ব্যবহার করুন:
🔹 count message
🔹 count admin
🔹 count member
🔹 count male
🔹 count female
🔹 count other
🔹 count allgroup
🔹 count alluser`
    );
  }

  // 🔥 বর্তমান গ্রুপ তথ্য
  const threadInfo = await api.getThreadInfo(event.threadID);

  let male = 0,
      female = 0,
      other = 0;

  // ✔ Gender Count Fix
  for (let user of threadInfo.userInfo) {
    if (user.gender === "MALE") male++;
    else if (user.gender === "FEMALE") female++;
    else other++;
  }

  // 🔥 Total Groups & Users Using Bot
  const allGroups = await Threads.getAll(["threadID"]);
  const allUsers = await Users.getAll(["userID"]);

  // ==========================
  //         OUTPUT AREA
  // ==========================

  switch (type.toLowerCase()) {

    case "message":
      return out(`📩 এই গ্রুপে মোট মেসেজঃ ${threadInfo.messageCount}`);

    case "admin":
      return out(`🛡 এই গ্রুপে মোট অ্যাডমিনঃ ${threadInfo.adminIDs.length}`);

    case "member":
      return out(`👥 এই গ্রুপে মোট মেম্বারঃ ${threadInfo.participantIDs.length}`);

    case "male":
      return out(`👨 এই গ্রুপে মোট পুরুষঃ ${male}`);

    case "female":
      return out(`👩 এই গ্রুপে মোট মহিলাঃ ${female}`);

    case "other":
      return out(`⚧ এই গ্রুপে অন্যান্য জেন্ডারঃ ${other}`);

    case "allgroup":
      return out(`💬 বট মোট ${allGroups.length} টি গ্রুপে চলছে`);

    case "alluser":
      return out(`👤 বট ব্যবহার করছে মোট ${allUsers.length} জন ইউজার`);

    default:
      return out("❌ ভুল ট্যাগ! পুনরায় সঠিক ট্যাগ ব্যবহার করুন।");
  }
};