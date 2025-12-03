// shourov/events/leave.js
module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "1.0.2",
  credits: "shourov",
  description: "notify leave (with mention & session)",
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  try {
    // safety checks
    if (!event || !event.logMessageData) return;
    const log = event.logMessageData;
    const leftId = log.leftParticipantFbId ?? null;
    if (!leftId) return;

    // ignore if bot itself left
    try {
      const botId = (typeof api.getCurrentUserID === "function") ? api.getCurrentUserID() : null;
      if (botId && String(botId) === String(leftId)) return;
    } catch (e) { /* ignore */ }

    // require safe modules (support environments exposing global.nodemodule)
    const fsExtra = (global.nodemodule && global.nodemodule["fs-extra"]) ? global.nodemodule["fs-extra"] : require("fs-extra");
    const { existsSync, mkdirSync, createReadStream } = fsExtra;
    const path = (global.nodemodule && global.nodemodule["path"]) ? global.nodemodule["path"] : require("path");
    const join = path.join;

    const threadID = event.threadID;
    if (!threadID) return;

    // Get thread data (try global cache first, then Threads.getData)
    let data = {};
    try {
      if (global.data && global.data.threadData && typeof global.data.threadData.get === "function") {
        const cached = global.data.threadData.get(parseInt(threadID));
        if (cached) data = cached;
      }
      if ((!data || Object.keys(data).length === 0) && Threads && typeof Threads.getData === "function") {
        const td = await Threads.getData(threadID).catch(() => null);
        if (td && td.data) data = td.data;
        else if (td) data = td;
      }
    } catch (e) {
      data = {};
    }

    // get name (from global cache or Users service)
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
    if (!name) name = `User${String(leftId).slice(-4)}`;

    // determine leave type
    const type = (String(event.author) === String(leftId)) ? "লিভ নেউয়ার জন্য ধন্যবাদ 🤢" : "Kicked by Administrator";

    // fill session placeholder based on Dhaka hour
    let session = "day";
    try {
      // use Intl with timeZone to avoid extra dependency
      const nowDhaka = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
      const hour = nowDhaka.getHours(); // 0-23
      if (hour >= 0 && hour < 4) session = "midnight";
      else if (hour >= 4 && hour < 8) session = "early morning";
      else if (hour >= 8 && hour < 12) session = "morning";
      else if (hour >= 12 && hour < 17) session = "afternoon";
      else if (hour >= 17 && hour < 21) session = "evening";
      else session = "night";
    } catch (e) {
      session = "day";
    }

    // build time string (Dhaka)
    const nowStr = new Date(new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }));
    const datePart = nowStr.toLocaleDateString("en-GB"); // DD/MM/YYYY
    const timePart = nowStr.toLocaleTimeString("en-GB"); // HH:MM:SS

    // default message template
    const defaultMsg = `╭═════⊹⊱✫⊰⊹═════╮ 
 ⚠️ গুরুতর ঘোষণা ⚠️
╰═════⊹⊱✫⊰⊹═════╯

{session} || {name} ভাই/বোন...
এই মাত্র গ্রুপ থেকে নিখোঁজ হয়েছেন!
গ্রুপবাসীদের পক্ষ থেকে গভীর উদ্বেগ ও
চাপা কান্নার মাধ্যমে জানানো যাচ্ছে...

— উনি আর নেই... মানে গ্রুপে নেই!
কিন্তু হৃদয়ে থেকে যাবেন, এক্টিভ মেম্বার হিসেবে | 

⏰ তারিখ ও সময়: {time}
⚙️ স্ট্যাটাস: {type}

✍️ মন্তব্য করে জানাও: তোমার কী ফিলিংস হইছে এই বিচ্ছেদে?`;

    // choose message (thread custom or default)
    let msgTemplate = (data && typeof data.customLeave !== "undefined") ? data.customLeave : defaultMsg;
    msgTemplate = msgTemplate.replace(/\{name\}/g, name)
                             .replace(/\{time\}/g, `${datePart} ${timePart}`)
                             .replace(/\{type\}/g, type)
                             .replace(/\{session\}/g, session);

    // prepare mention (some platforms still allow mention of left user)
    const mentions = [{ id: leftId, tag: name }];

    // prepare gif (if exist)
    const gifDir = join(__dirname, "shourov", "leaveGif");
    const gifPath = join(gifDir, "l.gif");
    try { if (!existsSync(gifDir)) mkdirSync(gifDir, { recursive: true }); } catch(e){}

    const payload = { body: msgTemplate, mentions };

    try {
      if (existsSync(gifPath)) payload.attachment = createReadStream(gifPath);
    } catch (e) { /* ignore file errors */ }

    // send message
    try {
      await api.sendMessage(payload, threadID);
      // optional debug log
      if (process && process.env && process.env.DEBUG) console.log(`[leave] sent leave msg for ${name} (${leftId}) in ${threadID}`);
    } catch (sendErr) {
      console.warn("leave: failed to send message:", sendErr && (sendErr.stack || sendErr));
    }

  } catch (err) {
    console.error("leave.js error:", err && (err.stack || err));
  }
};
