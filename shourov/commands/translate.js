module.exports.config = {
  name: "translate",
  version: "1.1.0",
  permission: 0,
  credits: "shourov ",
  description: "Translate text to any language.",
  prefix: false,
  category: "without prefix",
  usages: "translate <lang> <text>",
  cooldowns: 3,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  const axios = global.nodemodule["axios"];

  // Must have a target language
  if (!args[0])
    return api.sendMessage("❌ Please specify a target language.\nExample: translate en ami valo achi", event.threadID, event.messageID);

  const targetLang = args[0].trim().toLowerCase();
  let textToTranslate = "";

  // If message is replied → translate the replied text
  if (event.type === "message_reply") {
    textToTranslate = event.messageReply.body;
  } else {
    textToTranslate = args.slice(1).join(" ");
  }

  if (!textToTranslate)
    return api.sendMessage("❌ No text provided to translate.", event.threadID, event.messageID);

  try {
    // Request Google translate
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    const res = await axios.get(url);

    const data = res.data;

    // Extract translated text
    let translated = "";
    data[0].forEach(item => {
      if (item[0]) translated += item[0];
    });

    const detectedLang = data[2] || "auto";

    return api.sendMessage(
      `🌍 *TRANSLATION*\n` +
      `🔤 From: ${detectedLang}\n` +
      `➡️ To: ${targetLang}\n\n` +
      `📌 *${translated}*`,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Translation failed. Try again later.", event.threadID, event.messageID);
  }
};