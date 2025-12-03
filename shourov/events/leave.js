// commands/leave.js  (patched, robust)
module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "1.0.1",
  credits: "shourov",
  description: "notify leave.",
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  try {
    // safety: ensure logMessageData exists
    const log = event && event.logMessageData ? event.logMessageData : null;
    if (!log) return; // nothing to do

    const leftId = log.leftParticipantFbId || log.leftParticipantFbId === 0 ? log.leftParticipantFbId : null;
    if (!leftId) return; // no left participant id -> skip

    // If bot itself left, ignore
    try {
      const botId = (typeof api.getCurrentUserID === "function") ? api.getCurrentUserID() : null;
      if (botId && String(leftId) === String(botId)) return;
    } catch (e) {
      // ignore errors from api.getCurrentUserID
    }

    // safe require for fs-extra and path (support runner that exposes global.nodemodule)
    const fsExtra = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
    const { createReadStream, existsSync, mkdirSync } = fsExtra;
    const pathLib = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
    const { join } = pathLib;

    const threadID = event.threadID;
    if (!threadID) return;

    // safe read thread data: try global.data.threadData first, else Threads.getData
    let data = {};
    try {
      if (global.data && global.data.threadData && typeof global.data.threadData.get === "function") {
        const cached = global.data.threadData.get(parseInt(threadID));
        if (cached) data = cached;
      }
      if ((!data || Object.keys(data).length === 0) && Threads && typeof Threads.getData === "function") {
        const t = await Threads.getData(threadID).catch(() => null);
        if (t && t.data) data = t.data;
        else if (t) data = (t);
      }
    } catch (e) {
      data = {};
    }

    // get user display name safely
    let name = null;
    try {
      if (global.data && global.data.userName && typeof global.data.userName.get === "function") {
        name = global.data.userName.get(String(leftId));
      }
      if (!name && Users && typeof Users.getNameUser === "function") {
        name = await Users.getNameUser(String(leftId)).catch(() => null);
      }
    } catch (e) {
      name = null;
    }
    if (!name) name = `User${String(leftId).slice(-4)}`; // fallback

    // determine type (left voluntarily or kicked)
    const type = (String(event.author) === String(leftId)) ? "লিভ নেউয়ার জন্য ধন্যবাদ 🤢" : "Kicked by Administrator";

    // prepare message template
    const now = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }); // e.g. "DD/MM/YYYY, HH:MM:SS"
    const datePart = now.split(",")[0] || now;
    const timePart = (now.split(",")[1] || "").trim();

    const defaultMsg = `╭═════⊹⊱✫⊰⊹═════╮ 
 ⚠️ গুরুতর ঘোষণা ⚠️
╰═════⊹⊱✫⊰⊹═════╯

{session}||{name} ভাই/বোন...
এই মাত্র গ্রুপ থেকে নিখোঁজ হয়েছেন!
গ্রুপবাসীদের পক্ষ থেকে গভীর উদ্বেগ ও
চাপা কান্নার মাধ্যমে জানানো যাচ্ছে...

— উনি আর নেই... মানে গ্রুপে নেই!
কিন্তু হৃদয়ে থেকে যাবেন, এক্টিভ মেম্বার হিসেবে | 

⏰ তারিখ ও সময়: {time}
⚙️ স্ট্যাটাস: {type} (নিজে গেলো নাকি তাড়ানো হইলো বুঝলাম না)

✍️ মন্তব্য করে জানাও: তোমার কী ফিলিংস হইছে এই বিচ্ছেদে?`;

    let msgTemplate = (data && typeof data.customLeave !== "undefined") ? data.customLeave : defaultMsg;
    msgTemplate = msgTemplate.replace(/\{name\}/g, name).replace(/\{time\}/g, `${datePart} ${timePart}`).replace(/\{type\}/g, type);

    // prepare gif path
    const dirPath = join(__dirname, "shourov", "leaveGif");
    const gifPath = join(dirPath, `l.gif`);

    // ensure directory exists
    try {
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    } catch (e) { /* ignore */ }

    // prepare payload
    let formPush = { body: msgTemplate };
    try {
      if (existsSync(gifPath)) {
        formPush.attachment = createReadStream(gifPath);
      }
    } catch (e) {
      // ignore file errors
    }

    // send message
    try {
      return await api.sendMessage(formPush, threadID);
    } catch (errSend) {
      console.warn("leave: failed to send message", errSend && (errSend.stack || errSend));
      return;
    }
  } catch (err) {
    console.error("leave.js error:", err && (err.stack || err));
  }
};
