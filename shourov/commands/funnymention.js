module.exports.config = {
  name: "funny",
  version: "2.1.0",
  permission: 0,
  credits: "shourov (fixed)",
  description: "Auto reply when certain names are mentioned",
  prefix: false,
  category: "user",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = function ({ api, event }) {
  try {
    const { threadID, messageID } = event;
    const body = (event.body || "").toString();
    if (!body) return;

    // normalize message text
    const text = body
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ") // remove emoji/symbols
      .replace(/\s+/g, " ")
      .trim();

    // triggers (NO @ here)
    const triggers = [
      "হা বি ব",
      "ahmed tamim",
      "ahmed shihib"
    ];

    let matched = triggers.some(t => text.includes(t));

    // check mentions names also
    if (!matched && event.mentions && Object.keys(event.mentions).length > 0) {
      for (const id of Object.keys(event.mentions)) {
        const name = (event.mentions[id] || "")
          .toString()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .trim();

        if (triggers.some(t => name.includes(t))) {
          matched = true;
          break;
        }
      }
    }

    if (!matched) return;

    const replyText =
      "Please—দয়া করে কোনো ছেলে মেনশন দেবেন না। সে এখন মেয়ে পটাতে ব্যস্ত আছে 😌😂";

    return api.sendMessage(
      { body: replyText },
      threadID,
      messageID
    );

  } catch (err) {
    console.error("funny handleEvent error:", err && (err.stack || err));
  }
};

module.exports.run = function () {};