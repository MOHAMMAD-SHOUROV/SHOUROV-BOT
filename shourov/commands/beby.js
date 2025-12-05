// commands/baby.js
module.exports.config = {
  name: "baby",
  version: "0.0.3",
  permission: 0,
  prefix: false,
  credits: "Md Shourov Islam",
  description: "fun — random baby lines or API-generated reply",
  category: "admin",
  usages: "[text]",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args, Users }) {
  const axios = require("axios");

  try {
    const prompt = (args || []).join(" ").trim();
    const senderID = event.senderID;
    const name = await (Users && typeof Users.getNameUser === "function" ? Users.getNameUser(senderID) : senderID);

    // local random replies (used when no prompt)
    const localReplies = [
      "\n- হুম বাবু বলো কি বলবা সোনা-!!😘😊",
      "\n অহ আমার বাবু টা আমি এই তো সোনা ডেকো না আর-!!😍❤️",
      "\n\n- বাবু আমাকে দাকলে কিছু বলবা বাবু-!!✨🤍🤭",
      "\nএই তো বাবু আমি এখানে হারিয়ে জাইনি তো সোনা-!!🙈😽",
      "\n না বাবু সোনা আমার তুমার কথা এখন থেকে আর শুনবো না আর\n তুমার সাথে আরি-!!😌😾",
      "\n\nকার দেওয়া ফুল খোঁপার চুলে\n তুমার ওই মুখে আমার নাম নিবা না আর other মেয়েদের ডাকো গা যাও-!!😭😈",
      "\nতুমি আর আমার সাথে কথা বলবা না।\n তুমি কাল পাসের বাড়ির ভাবির সাথে কি করসো-!!🤬😤",
      "\n আমাকে আর বাবু ডাকবে না..!😾\nতুমার আব্বুর কাছে নালিশ দিবো আমি..!😤\n তুমি ভাবি দের সাথে খারাপ কাজ কর-!!😈😭",
      "\nকোন সাহ্যসে তুমি আমাকে ডাকো তুমি একটা লুচ্চা-!!😈",
      "\n অলে বাবু টা লে আমার__😘😍\n কি হয়েছে সোনা তুমার-!!😔\n ডাকলে যে...??",
      "\n - হুম বাবু পরে কথা হবে এখন রাখি-!!😘😍🥹",
      "\n i love",
      "\n - হুম বাবু রান্না  কবো এখন পরে কথা বলি-!!😊😔"
    ];

    // if no prompt -> send random local reply
    if (!prompt) {
      const rand = localReplies[Math.floor(Math.random() * localReplies.length)];
      return api.sendMessage(`${name}\n${rand}`, event.threadID, event.messageID);
    }

    // If prompt exists -> request external API (safe encoding & timeout)
    try {
      const apiUrl = `https://www.noobs-api.000.pe/dipto/baby?text=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl, { timeout: 10000 }); // 10s timeout

      // prefer res.data.reply, fallback to data.message or full data
      const respond = (res && res.data && (res.data.reply || res.data.message || res.data.result)) ?
        (res.data.reply || res.data.message || res.data.result) :
        null;

      if (!respond) {
        // fallback to a local generated line if API didn't return expected structure
        const fallback = localReplies[Math.floor(Math.random() * localReplies.length)];
        return api.sendMessage(`${name}\n${fallback}`, event.threadID, event.messageID);
      }

      return api.sendMessage(respond, event.threadID, event.messageID);
    } catch (err) {
      console.warn("baby command API error:", err && err.message ? err.message : err);
      // On API error, send a random local reply instead of failing
      const rand = localReplies[Math.floor(Math.random() * localReplies.length)];
      return api.sendMessage(`${name}\n${rand}`, event.threadID, event.messageID);
    }

  } catch (error) {
    console.error("baby command unexpected error:", error && (error.stack || error));
    try {
      return api.sendMessage("An unexpected error occurred while running the command.", event.threadID, event.messageID);
    } catch (e) { /* ignore send error */ }
  }
};