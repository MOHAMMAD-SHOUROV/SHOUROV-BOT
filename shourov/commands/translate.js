module.exports.config = {
  name: "translate",
  version: "1.0.2",
  permission: 0,
  credits: "shourov",
  description: "text translation",
  prefix: false,
  category: "without prefix",
  usages: `translate fr hello, how are you?`,
  cooldowns: 5,
  dependencies: {
    "request": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  const request = global.nodemodule["request"];

  // target language (مثلاً: "fr"), বাকি টেক্সট হল content
  const targetLanguage = (args[0] || "").toString().trim();
  const content = args.slice(1).join(" ").trim();

  // যদি reply থেকে ট্রান্সলেট নিতে চান
  let translateThis;
  if (event.type === "message_reply") {
    if (event.messageReply && event.messageReply.body && event.messageReply.body.length > 0) {
      translateThis = event.messageReply.body;
    } else {
      return api.sendMessage("Please reply to a text message to translate it.", event.threadID, event.messageID);
    }
  } else {
    // যদি রি-প্লাই না, তাহলে args থেকে নেন
    if (!content || content.length === 0) {
      return global.utils.throwError(this.config.name, event.threadID, event.messageID);
    }
    translateThis = content;
  }

  // লক্ষ্যবস্তু ভাষা যদি না দেওয়া হয়, ডিফল্টে global.config.language বা "en" নেব
  const lang = targetLanguage || (global.config && global.config.language) || "en";

  // urlencode the query text safely
  const encoded = encodeURIComponent(translateThis);

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encoded}`;

  return request({ url, method: "GET", timeout: 15000 }, (err, response, body) => {
    if (err) {
      console.error("Translate request error:", err);
      return api.sendMessage("An error occurred while contacting translation service.", event.threadID, event.messageID);
    }

    let retrieve;
    try {
      retrieve = JSON.parse(body);
    } catch (e) {
      console.error("Translate parse error:", e, body && body.toString ? body.toString().slice(0,300) : body);
      return api.sendMessage("Couldn't parse translation response.", event.threadID, event.messageID);
    }

    // validate structure
    if (!Array.isArray(retrieve) || !Array.isArray(retrieve[0])) {
      return api.sendMessage("Unexpected translation response format.", event.threadID, event.messageID);
    }

    // build translated text
    let text = "";
    retrieve[0].forEach(item => {
      if (item && item[0]) text += item[0];
    });

    // determine source language safely
    let fromLang = "auto";
    if (typeof retrieve[2] === "string" && retrieve[2].length > 0) {
      fromLang = retrieve[2];
    } else if (retrieve[8] && Array.isArray(retrieve[8]) && retrieve[8][0] && retrieve[8][0][0]) {
      fromLang = retrieve[8][0][0];
    }

    return api.sendMessage(`translation : ${text}\ntranslated from ${fromLang} to ${lang}`, event.threadID, event.messageID);
  });
};
