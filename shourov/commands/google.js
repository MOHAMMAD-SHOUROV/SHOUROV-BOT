module.exports.config = {
  name: "google",
  version: "1.0.1",
  permission: 0,
  credits: "ryuko (optimized by shourov)",
  prefix: false,
  description: "Search on Google (text or image).",
  category: "without prefix",
  usages: "google [text]  OR  reply to an image with 'google'",
  cooldowns: 5,
  dependencies: {}
};

function tryRequire(name) {
  try { if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name]; } catch (e) {}
  try { return require(name); } catch (e) { return null; }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // build input: either replied attachment URL, replied text, or args
  let input = "";
  if (event.type === "message_reply" && event.messageReply) {
    // prefer attachment url if present
    if (Array.isArray(event.messageReply.attachments) && event.messageReply.attachments.length > 0) {
      // use first attachment's url if available
      const att = event.messageReply.attachments[0];
      if (att && att.url) input = att.url;
    }
    // else prefer replied text body
    if (!input && event.messageReply.body && event.messageReply.body.trim()) {
      input = event.messageReply.body.trim();
    }
  }

  // if still nothing from reply, take args
  if (!input) input = (args && args.length) ? args.join(" ").trim() : "";

  // usage help
  if (!input) {
    return api.sendMessage(
      `⚠️ কোন সার্চ টার্ম দেওয়া হয়নি!\n\nব্যবহার:\n• Text search: google your query\n• Image search: reply to an image with "google"\n\nExample:\ngoogle how to cook rice`,
      threadID,
      messageID
    );
  }

  // detect if input looks like an image URL
  const imageExtRe = /\.(jpe?g|png|gif|webp|bmp)(?:$|\?)/i;
  const isImageUrl = imageExtRe.test(input);

  try {
    if (isImageUrl) {
      // google reverse image search URL (public)
      const searchUrl = `https://www.google.com/searchbyimage?&image_url=${encodeURIComponent(input)}`;
      return api.sendMessage(`🔍 Image Search Link:\n${searchUrl}`, threadID, messageID);
    } else {
      // if input looks like a URL but not image, try search by URL too
      const urlLikeRe = /^https?:\/\//i;
      if (urlLikeRe.test(input)) {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        return api.sendMessage(`🔍 URL Search Link:\n${searchUrl}`, threadID, messageID);
      }

      // normal text search
      const textSearch = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      return api.sendMessage(`🔎 Search Results:\n${textSearch}`, threadID, messageID);
    }
  } catch (err) {
    console.error("google command error:", err);
    return api.sendMessage("❌ একটি ত্রুটি ঘটেছে — পরে আবার চেষ্টা করুন.", threadID, messageID);
  }
};