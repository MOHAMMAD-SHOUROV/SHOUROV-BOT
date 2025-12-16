module.exports.run = async ({ event, api }) => {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const { downloadFile } = global.utils;
  const { threadID, messageID } = event;

  try {
    const mentionIDs = Object.keys(event.mentions || {});
    if (!mentionIDs.length) {
      return api.sendMessage(
        "অনুগ্রহ করে একজনকে ট্যাগ করুন 🤍",
        threadID,
        messageID
      );
    }

    const targetID = mentionIDs[0];
    const targetName = event.mentions[targetID];

    // ✅ ENSURE FILE EXISTS
    const dir = path.join(__dirname, "cache");
    const imgPath = path.join(dir, "hug.jpg");

    if (!fs.existsSync(imgPath)) {
      await fs.ensureDir(dir);
      await downloadFile(
        "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
        imgPath
      );
    }

    api.sendMessage(
      {
        body: `🤗 ${targetName} কে একটি হাগ পাঠানো হলো!`,
        mentions: [{ id: targetID, tag: targetName }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      messageID
    );
  } catch (e) {
    console.error("HUG ERROR:", e);
    api.sendMessage(
      "দুঃখিত, হাগ পাঠানো যায়নি 🥲",
      threadID,
      messageID
    );
  }
};