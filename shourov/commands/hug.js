module.exports.config = {
  name: "hug",
  version: "1.0.1",
  permission: 0,
  credits: "ALIHSAN SHOUROV",
  description: "Send hug image",
  prefix: true,
  category: "love",
  usages: "@mention",
  cooldowns: 5
};

module.exports.run = async ({ event, api }) => {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const { downloadFile } = global.utils;
  const { threadID, messageID } = event;

  try {
    // ---------- mention check ----------
    const mentionIDs = Object.keys(event.mentions || {});
    if (mentionIDs.length === 0) {
      return api.sendMessage(
        "অনুগ্রহ করে একজনকে ট্যাগ করুন 🤍",
        threadID,
        messageID
      );
    }

    const targetID = mentionIDs[0];
    const targetName = event.mentions[targetID];

    // ---------- cache ----------
    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "shourovh.jpg");

    if (!fs.existsSync(imgPath)) {
      await fs.ensureDir(cacheDir);
      await downloadFile(
        "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
        imgPath
      );
    }

    // ---------- SEND (IMPORTANT: return) ----------
    return api.sendMessage(
      {
        body: `🤗 ${targetName} কে একটি হাগ পাঠানো হলো!`,
        mentions: [{ id: targetID, tag: targetName }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      messageID
    );

  } catch (err) {
    console.error("HUG COMMAND ERROR:", err && (err.stack || err.message));
    return api.sendMessage(
      "দুঃখিত, হাগ পাঠানো যায়নি 🥲",
      threadID,
      messageID
    );
  }
};