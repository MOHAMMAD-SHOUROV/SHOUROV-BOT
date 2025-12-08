module.exports.config = {
  name: "grammar",
  version: "2.0.1",
  permission: 0,
  credits: "ryuko (optimized by shourov)",
  description: "Grammar correction tool — suggests proper grammar automatically.",
  prefix: false,
  category: "without prefix",
  usages: "[sentence/paragraph]",
  cooldowns: 5,
};

function tryRequire(name) {
  try { if (global.nodemodule && global.nodemodule[name]) return global.nodemodule[name]; } catch (e) {}
  try { return require(name); } catch (e) { return null; }
}

module.exports.run = async function ({ api, event, args }) {
  const axios = tryRequire("axios") || require("axios");

  const { threadID, messageID } = event;
  const text = args.join(" ").trim();

  // No input
  if (!text) {
    return api.sendMessage(
      `⚠️ আপনি কোনো বাক্য দেননি!\n\nব্যবহার:\n${this.config.name} ${this.config.usages}\n\nউদাহরণ:\ngrammar I has a pen`,
      threadID,
      messageID
    );
  }

  try {
    // URL encode to avoid API break
    const url = `https://grammarcorrection.mahirochan1.repl.co/grammar?text=${encodeURIComponent(text)}`;

    const res = await axios.get(url, { timeout: 15000 });

    if (!res.data || !res.data.message) {
      return api.sendMessage("⚠️ API did not return a valid response.", threadID, messageID);
    }

    return api.sendMessage(
      `✔️ **Corrected Grammar:**\n${res.data.message}`,
      threadID,
      messageID
    );
  } catch (err) {
    console.error("Grammar API Error:", err.message);

    return api.sendMessage(
      "❌ একটি ত্রুটি ঘটেছে। API হয়তো ডাউন আছে অথবা আপনার টেক্সট খুব বড়। পরে আবার চেষ্টা করুন।",
      threadID,
      messageID
    );
  }
};