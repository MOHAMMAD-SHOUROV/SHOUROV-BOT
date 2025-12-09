const axios = require("axios");

module.exports.config = {
  name: "bangla",
  version: "1.0.2",
  permission: 0,
  credits: "Nayan (modified by shourov)",
  prefix: true,
  description: "Translate text (supports reply). Usage: bangla <text> -> <lang>",
  category: "admin",
  usages: "text -> lang (example: bangla hello -> bn) or reply to a message and use bangla or bangla -> bn",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const threadID = event.threadID;
    const messageID = event.messageID;

    // Build input text and target language
    let content = args.join(" ").trim();
    let targetLang = "bn"; // default target language

    // If user replied to a message, use that text as source unless explicit text provided
    let sourceText = "";
    if (event.type === "message_reply" && (!content || content.length === 0)) {
      sourceText = event.messageReply && event.messageReply.body ? event.messageReply.body : "";
      // If user provided e.g. "-> en" after replying: parse it
      if (content && content.includes("->")) {
        const idx = content.indexOf("->");
        const maybeLang = content.substring(idx + 2).trim();
        if (maybeLang) targetLang = maybeLang;
      }
    } else {
      // If not a reply: try parse "text -> lang"
      if (content.includes("->")) {
        const parts = content.split("->");
        sourceText = parts[0].trim();
        const maybeLang = parts.slice(1).join("->").trim(); // in case '->' appears in text
        if (maybeLang) targetLang = maybeLang;
      } else {
        // no arrow; everything is source text, default target is bn
        sourceText = content;
        targetLang = "bn";
      }
    }

    if (!sourceText || sourceText.length === 0) {
      return global.utils.throwError(this.config.name, threadID, messageID);
    }

    // sanitize targetLang (only take language code segment, e.g. "en", "bn", "fil")
    targetLang = targetLang.split(" ")[0].trim().toLowerCase();

    // call Google Translate public endpoint
    const encoded = encodeURIComponent(sourceText);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encoded}`;

    const resp = await axios.get(url, { timeout: 15000 });
    const body = resp.data;

    // parse response safely
    if (!Array.isArray(body) || !Array.isArray(body[0])) {
      return api.sendMessage("অনুবাদের সময় অজানা ভুল হয়েছে। আবার চেষ্টা করুন।", threadID, messageID);
    }

    let translated = "";
    body[0].forEach(item => {
      if (item && item[0]) translated += item[0];
    });

    // detect-from-language fallback (Google returns detected source in body[2] usually)
    let detected = "";
    try {
      if (body[2]) detected = String(body[2]);
      else if (body[8] && body[8][0] && body[8][0][0]) detected = String(body[8][0][0]);
    } catch (e) {
      detected = "";
    }

    const replyMsg = `🔤 Source: ${sourceText}\n\n🌐 Translated (${detected || "auto"} → ${targetLang}):\n${translated}`;
    return api.sendMessage(replyMsg, threadID, messageID);
  } catch (err) {
    console.error("bangla command error:", err && (err.stack || err));
    return api.sendMessage("⚠️ অনুবাদ করতে পারেনি — কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};