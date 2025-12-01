// commands/bangla.js
const axios = require("axios");

module.exports.config = {
  name: "bangla",
  version: "1.0.2",
  permission: 0,
  credits: "Nayan (fixed)",
  prefix: true,
  description: "Translate text (default target: bn). Usage: bangla <text> -> <lang>",
  category: "admin",
  usages: "bangla <text> -> <lang>  OR reply to a message with: bangla -> <lang>",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

function throwOrReply(api, event, name) {
  if (global.utils && typeof global.utils.throwError === "function") {
    return global.utils.throwError(name, event.threadID, event.messageID);
  } else {
    return api.sendMessage(`Usage error. Try: ${global.config.PREFIX || "/"}${name} <text> -> <lang>`, event.threadID, event.messageID);
  }
}

module.exports.run = async ({ api, event, args }) => {
  try {
    const commandName = this.config.name;
    const raw = args.join(" ").trim();

    // If replying to a message and no explicit text provided, use replied message body
    let translateText = "";
    let targetLang = "bn"; // default target language = Bengali

    if (event.type === "message_reply") {
      // If user passed extra args beyond the command, parse for '-> lang'
      if (raw.length > 0 && raw.includes("->")) {
        // e.g. -> "some text -> en" (but when replying, usually want to translate replied message)
        // We'll prefer replied message body and use user's provided lang
        translateText = event.messageReply && event.messageReply.body ? event.messageReply.body : raw;
        const idx = raw.indexOf("->");
        const maybe = raw.substring(idx + 2).trim();
        if (maybe) targetLang = maybe.split(/\s+/)[0];
      } else {
        translateText = event.messageReply && event.messageReply.body ? event.messageReply.body : raw;
        targetLang = "bn";
      }
    } else {
      // Not a reply
      if (!raw) return throwOrReply(api, event, commandName);

      if (raw.includes("->")) {
        // parse "text -> lang"
        const parts = raw.split("->");
        translateText = parts[0].trim();
        targetLang = (parts[1] || "").trim() || "bn";
      } else {
        // no explicit lang, use default 'bn'
        translateText = raw;
        targetLang = "bn";
      }
    }

    if (!translateText || translateText.length === 0) {
      return throwOrReply(api, event, commandName);
    }

    // call Google translate web endpoint (same as earlier)
    const q = encodeURIComponent(translateText);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${q}`;

    let res;
    try {
      res = await axios.get(url, { timeout: 15000 });
    } catch (err) {
      console.error("translate request error:", err && err.message ? err.message : err);
      return api.sendMessage("❗ Translation service failed. Try again later.", event.threadID, event.messageID);
    }

    if (!res.data) {
      return api.sendMessage("❗ Empty response from translation service.", event.threadID, event.messageID);
    }

    // assemble translated text
    let translated = "";
    try {
      const body = res.data;
      // body[0] contains an array of translated chunks
      if (Array.isArray(body[0])) {
        body[0].forEach(chunk => {
          if (chunk[0]) translated += chunk[0];
        });
      } else {
        translated = body[0] && body[0][0] ? body[0][0][0] : "";
      }
      // detected language
      let detected = "";
      if (body[2]) detected = body[2];
      else if (body[8] && body[8][0] && body[8][0][0]) detected = body[8][0][0];

      const replyMsg = `🈯 Translated →\n\n${translated}\n\n🌐 Detected: ${detected || 'auto'}  →  ${targetLang}`;

      return api.sendMessage(replyMsg, event.threadID, event.messageID);
    } catch (err) {
      console.error("translate parsing error:", err && err.stack ? err.stack : err);
      return api.sendMessage("❗ Failed to parse translation result.", event.threadID, event.messageID);
    }
  } catch (err) {
    console.error("bangla command error:", err && (err.stack || err));
    try { return api.sendMessage("❗ Unexpected error occurred.", event.threadID, event.messageID); } catch (e) {}
  }
};
