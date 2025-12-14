module.exports.config = {
  name: "hug",
  version: "2.0.0",
  permission: 0,
  credits: "shourov",
  description: "Send hug image",
  prefix: true,
  category: "love",
  usages: "tag",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.onLoad = async () => {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const { downloadFile } = global.utils;

  const dir = path.resolve(__dirname, "cache");
  await fs.ensureDir(dir);

  const img = path.join(dir, "hug.jpg");
  if (!fs.existsSync(img)) {
    await downloadFile(
      "https://i.ibb.co/3YN3T1r/q1y28eqblsr21.jpg",
      img
    );
  }
};

module.exports.run = async ({ event, api }) => {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
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

    const imgPath = path.join(__dirname, "cache", "hug.jpg");

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
