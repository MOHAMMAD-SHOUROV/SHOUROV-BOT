const axios = require('axios');
const fs = require('fs');

module.exports.config = { 
  name: "teach",
  version: "0.0.3",
  permission: 0,
  prefix: 'awto',
  credits: "shourov",
  description: "Teach sim (add question-answer pair to remote DB)",
  category: "admin",
  usages: "teach hi = hello",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args, Users }) {
  try {
    const info = args.join(" ").trim();
    if (!info) {
      return api.sendMessage(
        `দয়া করে সঠিক ফরম্যাটে লিখুন:\n${global.config.PREFIX}${this.config.name} hi = hello`,
        event.threadID,
        event.messageID
      );
    }

    // must include '=' separator
    if (!info.includes("=")) {
      return api.sendMessage(
        `ভূল ফরম্যাট। উদাহরণ:\n${global.config.PREFIX}${this.config.name} hi = hello`,
        event.threadID,
        event.messageID
      );
    }

    const parts = info.split("=");
    if (parts.length < 2) {
      return api.sendMessage(
        `ভূল ফরম্যাট — একটি '=' দিয়ে বেঁধে দিন। উদাহরণ:\n${global.config.PREFIX}${this.config.name} hi = hello`,
        event.threadID,
        event.messageID
      );
    }

    const ask = parts[0].trim();
    const ans = parts.slice(1).join("=").trim(); // যদি ans-এ '=' থাকে তাও ধরে নেবে

    if (!ask || !ans) {
      return api.sendMessage(
        `Ask বা Answer খালি হতে পারে না। উদাহরণ:\n${global.config.PREFIX}${this.config.name} hi = hello`,
        event.threadID,
        event.messageID
      );
    }

    // Get API base for sim from remote api.json
    const apisRes = await axios.get('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
    const teachBase = apisRes?.data?.sim;
    if (!teachBase) {
      return api.sendMessage("Teach API পাওয়া গেল না — অনুগ্রহ করে later retry করুন.", event.threadID, event.messageID);
    }

    // Prepare safe URL (encode ask & ans)
    const url = `${teachBase}/sim?type=teach&ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`;

    // Call remote teach endpoint
    let resp;
    try {
      resp = await axios.get(url, { timeout: 15000 });
    } catch (err) {
      console.error("Teach API call failed:", err?.message || err);
      return api.sendMessage("Teach API কল ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }

    // Optionally inspect response to confirm success if the API returns a known field
    const ok = (resp && (resp.status === 200 || resp.status === 201));

    // Who requested
    const teacherId = event.senderID;
    const teacherName = await Users.getNameUser(teacherId);

    if (ok) {
      return api.sendMessage({
        body: `✅️ ডাটাবেসে সফলভাবে যোগ করা হয়েছে!\n\n✳️ ASK: ${ask}\n✳️ ANS: ${ans}\n\n➤ Added by: ${teacherName} (${teacherId})`,
      }, event.threadID, event.messageID);
    } else {
      console.warn("Teach endpoint returned non-OK response:", resp && resp.status);
      return api.sendMessage("Teach API থেকে অবাঞ্ছিত রেসপন্স পেলাম — কৌশলে আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }
  } catch (e) {
    console.error(e);
    return api.sendMessage("একটি ত্রুটি ঘটেছে — কনসোলে লগ দেখুন।", event.threadID, event.messageID);
  }
};