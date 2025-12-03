module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "1.0.1",
  credits: "shourov",
  description: "notify leave."
};

module.exports.run = async function({ api, event, Users, Threads }) {
  try {
    const leftId = event.logMessageData && event.logMessageData.leftParticipantFbId;
    if (!leftId) return; // nothing to do
    if (leftId == api.getCurrentUserID()) return; // bot left — ignore

    const { createReadStream, existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const threadID = event.threadID;
    const data = global.data.threadData.get(parseInt(threadID)) || ((await Threads.getData(threadID))?.data || {});
    const name = global.data.userName.get(leftId) || await Users.getNameUser(leftId);

    // who removed / left?
    const type = (event.author && event.author == leftId) ? "লিভ নেয়ার জন্য ধন্যবাদ 🤢" : "Kicked by Administrator";

    // prepare path for gif (ensure directory exists)
    const dirPath = join(__dirname, "shourov", "leaveGif");
    const gifPath = join(dirPath, `l.gif`);
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

    // time (Asia/Dhaka)
    const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }); // you can change format

    // default message (Bengali), allow thread-level customLeave message from thread data
    let msgTemplate = typeof data.customLeave === "undefined" ? 
`╭═════⊹⊱✫⊰⊹═════╮
⚠️ গুরুতর ঘোষণা ⚠️
╰═════⊹⊱✫⊰⊹═════╯

{session} || {name} ভাই/বোন...
এই মাত্র গ্রুপ থেকে নিখোঁজ হয়েছেন!
গ্রুপবাসীদের পক্ষ থেকে গভীর উদ্বেগ ও চাপা কান্নার মাধ্যমে জানানো যাচ্ছে...

— উনি আর নেই... মানে গ্রুপে নেই!
কিন্তু হৃদয়ে থেকে যাবেন, এক্টিভ মেম্বার হিসেবে |

⏰ তারিখ ও সময়: {time}
⚙️ স্ট্যাটাস: {type} (নিজে গেলো নাকি তাড়ানো হইলো বুঝলাম না)

✍️ মন্তব্য করে জানাও: তোমার কী ফিলিংস হইছে এই বিচ্ছেদে?`
    : data.customLeave;

    // replace placeholders
    msgTemplate = msgTemplate
      .replace(/\{name\}/g, name || "অ্যাঙ্কন")
      .replace(/\{type\}/g, type)
      .replace(/\{time\}/g, time)
      .replace(/\{session\}/g, "অনুত্তপ্ত সেশন"); // adjust session text if you have real session value

    // prepare payload
    const formPush = existsSync(gifPath) ? { body: msgTemplate, attachment: createReadStream(gifPath) } : { body: msgTemplate };

    // send message (best-effort)
    try {
      await api.sendMessage(formPush, threadID);
    } catch (err) {
      console.error("Failed to send leave message:", err && err.message || err);
    }

  } catch (err) {
    console.error("leave command error:", err && err.stack ? err.stack : err);
  }
};
