const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "shourov_notify",
  version: "2.0.0",
  permission: 0,
  credits: "nayan (fixed)",
  description: "Reply when someone mentions Shourov (no-prefix handler)",
  prefix: false,
  category: "no prefix",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = async function({ api, event }) {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString().trim();
    if (!body) return;

    const lower = body.toLowerCase();

    // Triggers — তোমার দরকার অনুযায়ী বাড়াও / কমাও
    const triggers = [
      "সৌরভ",
      "shourov",
      "Shourav",
      "Alihsan Shourov",
      "ALIHSAN SHOUROV",
    ];

    // যদি মেসেজ ট্রিগার দিয়ে শুরু হয় বা পুরোটা ট্রিগারের সমান হয়
    const matches = triggers.some(t => lower.startsWith(t) || lower === t);
    if (!matches) return;

    // উত্তর — ইচ্ছে করলে পরিবর্তন করো
    const replyText = "কিরে এত ডাকিস কেন? আমার বস বিজি আছে, পরে ডাকো 😒";

    // send message and try to react
    await api.sendMessage({ body: replyText }, threadID, messageID);

    // best-effort: set reaction (ignore errors)
    try {
      await api.setMessageReaction("😘", messageID, () => {}, true);
    } catch (e) {
      // ignore reaction errors
    }
  } catch (err) {
    console.error("shourov_notify error:", err && (err.stack || err));
    try { api.sendMessage("🚫 বট-এ একটি ত্রুটি হয়েছে।", event.threadID); } catch (_) {}
  }
};

module.exports.run = function() {
  // no-op for compatibility
};