module.exports.config = {
  name: "shourov_notify",
  version: "2.1.0",
  permission: 0,
  credits: "nayan (fixed by shourov)",
  description: "Reply when someone mentions Shourov (no prefix)",
  prefix: false,
  category: "no prefix",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body) return;
    if (event.senderID === api.getCurrentUserID()) return;

    const text = event.body.toLowerCase();

    const triggers = [
      "সৌরভ",
      "shourov",
      "shourav",
      "alihsan shourov",
      "alihsan"
    ];

    const matched = triggers.some(t => text.includes(t));
    if (!matched) return;

    const replyText = "কিরে এত ডাকিস কেন? আমার বস বিজি আছে, পরে ডাকো 😒";

    api.sendMessage(
      { body: replyText },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("[shourov_notify]", err);
  }
};

module.exports.run = function () {};