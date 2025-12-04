module.exports.config = {
  name: "uid2",
  version: "1.1.1",
  permission: 0,
  credits: "shourov",
  prefix: 3,            // keep if your framework uses numeric prefix for "no prefix" commands
  description: "Get UID only",
  category: "without prefix",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  try {
    const content = (event.body || "").trim();

    // 1) If message contains a facebook link, try to resolve its UID
    // match typical profile/post URLs (will capture full url including query params)
    const fbLinkMatch = content.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s\/?#]+(?:[^\s]*)/i);
    if (fbLinkMatch) {
      const link = fbLinkMatch[0];

      // api.getUID is callback-based in your framework: wrap with Promise
      try {
        const uid = await new Promise((resolve, reject) => {
          // defensive: ensure api.getUID exists
          if (typeof api.getUID !== "function") {
            return reject(new Error("api.getUID not available"));
          }
          api.getUID(link, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });

        // If the API returned nothing meaningful, inform the user
        if (!uid) {
          return api.sendMessage("Could not find a UID for that link.", event.threadID, event.messageID);
        }
        return api.sendMessage(String(uid), event.threadID, event.messageID);
      } catch (err) {
        console.error("uid2: getUID error:", err);
        return api.sendMessage("Failed to resolve UID from the provided Facebook link.", event.threadID, event.messageID);
      }
    }

    // 2) If the message mentions users (e.g. @name), return their UIDs
    // event.mentions may be undefined or an object mapping userID => name
    const mentions = event.mentions || {};
    const mentionIds = Object.keys(mentions);
    if (mentionIds.length > 0) {
      // join by newline for readability
      return api.sendMessage(mentionIds.join("\n"), event.threadID, event.messageID);
    }

    // 3) Fallback: return the sender's UID
    return api.sendMessage(String(event.senderID), event.threadID, event.messageID);
  } catch (err) {
    console.error("uid2 unexpected error:", err);
    try {
      return api.sendMessage("An unexpected error occurred while processing the command.", event.threadID, event.messageID);
    } catch (e) { /* ignore */ }
  }
};