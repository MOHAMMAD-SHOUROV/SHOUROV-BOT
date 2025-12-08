const axios = require("axios");

module.exports.config = {
  name: "translate",
  version: "1.0.3",
  permission: 0,
  credits: "shourov",
  description: "text translation",
  prefix: false,
  category: "without prefix",
  usages: `translate fr hello, how are you?\ntranslate to fr hello\ntranslate reply (detects target from first arg)`,
  cooldowns: 5
};

function parseArgsForLang(args) {
  // Accept formats:
  // 1) fr hello world
  // 2) to fr hello world
  // 3) fr: hello world
  // 4) translate en: hello
  if (!args || args.length === 0) return { lang: null, content: "" };

  // join so we can parse "fr: hello" easily
  const joined = args.join(" ").trim();

  // pattern like "to fr ...", "to: fr ..." or "fr: ..." or "fr ..."
  const mToPrefix = joined.match(/^(?:to\s*:?\s*)?([a-zA-Z\-]{2,7})\s*[:\-]?\s+(.*)$/i);
  if (mToPrefix) {
    return { lang: mToPrefix[1].toLowerCase(), content: mToPrefix[2].trim() };
  }

  // fallback: maybe first token is language code and rest is content
  const first = args[0].toLowerCase();
  if (/^[a-zA-Z\-]{2,7}$/.test(first) && args.length > 1) {
    return { lang: first, content: args.slice(1).join(" ").trim() };
  }

  // no explicit lang found
  return { lang: null, content: joined };
}

module.exports.run = async ({ api, event, args }) => {
  try {
    // If replying to a message, we prefer that text as content
    let replyText = null;
    if (event.type === "message_reply" && event.messageReply) {
      // prefer body, but if attachment text exists you could expand
      replyText = event.messageReply.body || "";
    }

    // Parse args for language + content
    const parsed = parseArgsForLang(args);
    let targetLang = parsed.lang;
    let content = parsed.content;

    // If the user replied to a message and didn't pass content, use the replied text
    if (replyText && (!content || content.length === 0)) {
      content = replyText;
    }

    // If no content yet, nothing to translate
    if (!content || content.trim().length === 0) {
      return api.sendMessage("Please provide text to translate (or reply to a text message). Example: translate fr Hello!", event.threadID, event.messageID);
    }

    // If no target language specified, fallback to bot language config or "en"
    if (!targetLang) {
      targetLang = (global.config && global.config.language) ? global.config.language : "en";
    }

    // sanitize and encode
    const encoded = encodeURIComponent(content);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encoded}`;

    // call via axios
    const resp = await axios.get(url, { timeout: 15000 });
    if (!resp || !resp.data) {
      return api.sendMessage("No response from translation service.", event.threadID, event.messageID);
    }

    const data = resp.data;

    // Validate structure and build translated text
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      // sometimes Google returns a string error or other format
      return api.sendMessage("Unexpected translation response format.", event.threadID, event.messageID);
    }

    let translated = "";
    for (const chunk of data[0]) {
      if (Array.isArray(chunk) && chunk[0]) translated += chunk[0];
      else if (typeof chunk === "string") translated += chunk;
    }
    translated = translated.trim();

    // Determine source language (best-effort)
    let fromLang = "auto";
    if (typeof data[2] === "string" && data[2].length > 0) fromLang = data[2];
    else if (Array.isArray(data[8]) && Array.isArray(data[8][0]) && data[8][0][0]) fromLang = data[8][0][0];

    // Build result message
    const reply = `Translated (${fromLang} → ${targetLang}):\n${translated}`;

    return api.sendMessage(reply, event.threadID, event.messageID);
  } catch (err) {
    console.error("Translate error:", err && (err.stack || err));
    // friendly error message
    return api.sendMessage("An error occurred while translating. Please try again.", event.threadID, event.messageID);
  }
};