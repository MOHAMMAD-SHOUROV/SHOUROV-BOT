// commands/emojimix.js
module.exports.config = {
  name: "emojimix",
  version: "1.0.3",
  permission: 0,
  credits: "Nayan (fixed & optimized by Shourov)",
  prefix: true,
  description: "Mix two emojis into one image",
  category: "image",
  usages: "😄 | 🔥",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.run = async ({ api, event, args }) => {
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const axios = global.nodemodule["axios"] || require("axios");
  const path = require("path");

  const { threadID, messageID } = event;

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const raw = args.join(" ");
  if (!raw || !raw.includes("|")) {
    return api.sendMessage(
      `❌ Wrong format!\nUse: ${global.config.PREFIX}emojimix 😄 | 🔥`,
      threadID,
      messageID
    );
  }

  const [emoji1, emoji2] = raw.split("|").map(e => e.trim());
  if (!emoji1 || !emoji2) {
    return api.sendMessage(
      "❌ Please provide two emojis.",
      threadID,
      messageID
    );
  }

  // Load API base
  let apiBase = null;
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json",
      { timeout: 10000 }
    );
    apiBase = res?.data?.api;
  } catch {}

  // fallback API (important)
  if (!apiBase) {
    apiBase = "https://nayan-api.onrender.com";
  }

  const outPath = path.join(cacheDir, `emojimix_${Date.now()}.png`);
  const url = `${apiBase}/nayan/emojimix?emoji1=${encodeURIComponent(
    emoji1
  )}&emoji2=${encodeURIComponent(emoji2)}`;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000
    });

    await fs.writeFile(outPath, response.data);

    await api.sendMessage(
      {
        body: `✨ Emojimix Result\n${emoji1} + ${emoji2}`,
        attachment: fs.createReadStream(outPath)
      },
      threadID,
      () => fs.unlink(outPath).catch(() => {}),
      messageID
    );

  } catch (err) {
    console.error("emojimix error:", err?.message || err);
    return api.sendMessage(
      "❌ Emoji mix করতে সমস্যা হয়েছে। অন্য emoji দিয়ে চেষ্টা করুন।",
      threadID,
      messageID
    );
  }
};