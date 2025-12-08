// inbox (safe rewrite) — credits: assistant (Shourov-style)
module.exports.config = {
  name: "inbox",
  version: "1.0.0",
  permission: 2,            // শুধুমাত্র admin ব্যবহার করবে
  credits: "shourov + assistant",
  description: "Send a safe DM to a user or small broadcast (admin-only, max 10).",
  category: "admin",
  usages: "inbox <uid|@mention> <message>\nOR inbox broadcast <message>",
  prefix: true,
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Threads, Users }) {
  const fs = global.nodemodule && global.nodemodule["fs-extra"] ? global.nodemodule["fs-extra"] : require("fs");
  const { threadID, messageID, senderID } = event;

  // === CONFIG: change admin list to your bot admin IDs ===
  const BOT_ADMINS = ["100071971474157"]; // শুধু উদাহরণ — আপনার ID গুলো রাখুন

  // permission check
  if (!BOT_ADMINS.includes(senderID)) {
    return api.sendMessage("❌ শুধু বট অ্যাডমিন ব্যবহার করতে পারবেন।", threadID, messageID);
  }

  if (!args || args.length === 0) {
    return api.sendMessage("ব্যবহার: inbox <uid|@mention> <message>\nঅথবা: inbox broadcast <message> (max 10 threads)", threadID, messageID);
  }

  // helper: small delay
  const delay = ms => new Promise(res => setTimeout(res, ms));

  try {
    // broadcast mode: inbox broadcast your message
    if (args[0].toLowerCase() === "broadcast") {
      const text = args.slice(1).join(" ").trim();
      if (!text) return api.sendMessage("ব্রডকাস্ট করার জন্য একটি বার্তা দিন।", threadID, messageID);

      // load all threads (Threads API may return many — limit to first 10 to avoid spam)
      let all = [];
      try {
        all = await Threads.getAll(); // আপনার ফ্রেমওয়ার্ক অনুসারে থাকতে পারে
      } catch (e) {
        console.warn("Threads.getAll() failed:", e && e.message);
      }

      if (!all || all.length === 0) return api.sendMessage("কোনো থ্রেড পাওয়া যায়নি।", threadID, messageID);

      const MAX = 10;
      const targets = all.slice(0, MAX).map(t => t.threadID);

      // safety: ask user to confirm by replying "yes" within 20s (simple inline confirm)
      const confirmMsg = await new Promise(resolve => {
        api.sendMessage(`⚠ আপনি ব্রডকাস্ট পাঠাতে যাচ্ছেন ${targets.length} টি চ্যাটে। নিশ্চিত হলে 'YES' টাইপ করে রিপ্লাই দিন (২০ সেকেন্ডের মধ্যে)।`, threadID, (err, info) => {
          if (err) return resolve(null);
          // register a temporary handleReply
          global.client.handleReply.push({
            type: "confirm_broadcast",
            name: module.exports.config.name,
            author: senderID,
            messageID: info.messageID,
            data: { text, targets }
          });
        }, messageID);
      });

      return; // শেষ — সত্যিকারের ব্রডকাস্ট handleReply-এ হবে
    }

    // Normal: send to UID or mention
    // Check mentions first
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      const mentionIds = Object.keys(event.mentions);
      const text = args.slice(1).join(" ").trim();
      if (!text) return api.sendMessage("বার্তা লিখুন (reply/mention + message).", threadID, messageID);

      // send one-by-one (if multiple mentions, limit to 5)
      const MAX_MENTION = 5;
      const sliced = mentionIds.slice(0, MAX_MENTION);
      for (let i = 0; i < sliced.length; i++) {
        try {
          await api.sendMessage({ body: text }, sliced[i]);
          await delay(1000); // 1s delay
        } catch (e) {
          console.warn("send to mention failed:", e && e.message);
        }
      }
      return api.sendMessage(`✅ পাঠানো হয়েছে ${sliced.length} জনকে.`, threadID, messageID);
    }

    // if first arg looks numeric -> treat as UID
    const maybeId = args[0].trim();
    const messageText = args.slice(1).join(" ").trim();
    if (!messageText) return api.sendMessage("বার্তা লিখুন।", threadID, messageID);

    if (/^\d+$/.test(maybeId)) {
      // send DM to that UID (use m.me link or graph if needed)
      try {
        await api.sendMessage({ body: messageText }, maybeId);
        return api.sendMessage("✅ বার্তা পাঠানো হয়েছে।", threadID, messageID);
      } catch (e) {
        console.error("send to UID failed:", e && e.stack || e);
        return api.sendMessage("❌ UID-এ বার্তা পাঠানো হয়নি।", threadID, messageID);
      }
    }

    // nothing matched
    return api.sendMessage("Invalid usage. দেখুন: inbox <uid|@mention> <message>\nঅথবা inbox broadcast <message>", threadID, messageID);

  } catch (err) {
    console.error("inbox error:", err);
    return api.sendMessage("⛔ কমান্ড চালানোর সময় ত্রুটি: " + (err.message || err), threadID, messageID);
  }
};

// handleReply to process broadcast confirmation
module.exports.handleReply = async function({ api, event, handleReply }) {
  try {
    const { senderID, body } = event;
    if (!handleReply || handleReply.type !== "confirm_broadcast") return;
    if (senderID !== handleReply.author) return; // শুধুমাত্র যে রিকোয়েস্ট করেছিলো তিনি নিশ্চিত করবেন

    if ((body || "").toLowerCase().trim() !== "yes") {
      return api.sendMessage("❌ ব্রডকাস্ট বাতিল করা হল।", handleReply.threadID || event.threadID);
    }

    const { text, targets } = handleReply.data;
    const delay = ms => new Promise(res => setTimeout(res, ms));
    for (let i = 0; i < targets.length; i++) {
      try {
        await api.sendMessage({ body: text }, targets[i]);
      } catch (e) {
        console.warn("broadcast send failed to", targets[i], e && e.message);
      }
      await delay(1000); // safe delay between sends
    }

    return api.sendMessage(`✅ ব্রডকাস্ট শেষ। ${targets.length} টি চ্যাটে পাঠানো হয়েছে।`, handleReply.threadID || event.threadID);

  } catch (e) {
    console.error("handleReply broadcast error:", e);
  }
};