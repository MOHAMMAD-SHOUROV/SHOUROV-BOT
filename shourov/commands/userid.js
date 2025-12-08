module.exports.config = {
  name: "uid2",
  version: "1.1.1",
  permission: 0,
  credits: "shourov (optimized by assistant)",
  prefix: 3,
  description: "Get UID only",
  category: "without prefix",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const content = event.body || "";

    // --- 1) Detect Facebook link ---
    const fbLinkRegex =
      /(https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/[^\s?&]+)/i;

    const match = content.match(fbLinkRegex);
    if (match) {
      const link = match[0];

      try {
        const uid = await new Promise((resolve, reject) => {
          api.getUID(link, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

        return api.sendMessage(`${uid}`, event.threadID, event.messageID);

      } catch (err) {
        return api.sendMessage(
          "❌ UID পাওয়া যায়নি বা লিংকটি ভ্যালিড নয়!",
          event.threadID,
          event.messageID
        );
      }
    }

    // --- 2) If user mentions someone ---
    if (Object.keys(event.mentions).length > 0) {
      const uids = Object.keys(event.mentions).join("\n");
      return api.sendMessage(uids, event.threadID, event.messageID);
    }

    // --- 3) Default: sender UID ---
    return api.sendMessage(
      `${event.senderID}`,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("uid2 error:", err);
    return api.sendMessage(
      "❌ Error occurred while processing UID.",
      event.threadID,
      event.messageID
    );
  }
};