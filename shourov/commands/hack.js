const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "hack",
  version: "3.0.0",
  permission: 0,
  credits: "shourov (no-canvas)",
  description: "Fake hack with real name & profile picture",
  prefix: true,
  category: "Fun",
  usages: "hack @user",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const { threadID, messageID } = event;

  try {
    // target user
    const mentionIDs = Object.keys(event.mentions || {});
    const uid = mentionIDs[0] || event.senderID;

    // get real name
    let name = await Users.getNameUser(uid);
    if (!name || name.startsWith("User")) {
      const info = await api.getUserInfo(uid);
      name = info[uid]?.name || "Facebook User";
    }

    // avatar
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=720&height=720`;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const avatarPath = path.join(cacheDir, `${uid}_avt.jpg`);
    const avatar = await axios.get(avatarURL, { responseType: "arraybuffer" });
    await fs.writeFile(avatarPath, avatar.data);

    // send message
    await api.sendMessage(
      {
        body:
`💻 HACKING STARTED...

👤 Target : ${name}
📡 Accessing Facebook Servers...
🔓 Password Cracking: 89%

⚠️ This is a prank 😄`,
        attachment: fs.createReadStream(avatarPath)
      },
      threadID,
      messageID
    );

    fs.unlinkSync(avatarPath);

  } catch (e) {
    console.error("hack error:", e);
    api.sendMessage("❌ Hack failed, try again later.", threadID, messageID);
  }
};