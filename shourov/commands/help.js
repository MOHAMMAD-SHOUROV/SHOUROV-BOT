module.exports.run = async function ({ api, event, args }) {
  const fs = require("fs-extra");
  const axios = require("axios");
  const path = require("path");
  const { threadID, messageID } = event;

  const commands = global.client.commands;
  const prefix = (global.config && global.config.PREFIX) || "/";

  // OWNER INFO
  const OWNER_ID = "100071971474157";
  const OWNER_NAME = "ALIHSAN SHOUROV";
  const OWNER_PROFILE = "https://www.facebook.com/shourov.sm24";

  // ===== single command info =====
  if (args[0] && commands.has(args[0].toLowerCase())) {
    const cmd = commands.get(args[0].toLowerCase());
    const msg =
`📌 Command: ${cmd.config.name}
📝 Description: ${cmd.config.description || "No description"}
🧾 Usage: ${prefix}${cmd.config.name} ${cmd.config.usages || ""}
📂 Category: ${cmd.config.category || "N/A"}
⏱ Cooldown: ${cmd.config.cooldowns || 0}s
👤 Permission: ${cmd.config.permission || 0}
© Credits: ${cmd.config.credits || "Unknown"}`;
    return api.sendMessage(msg, threadID, messageID);
  }

  // ===== command list =====
  const list = [];
  for (const [name, cmd] of commands) {
    list.push(`${prefix}${name}`);
  }
  list.sort();

  const page = Math.max(1, parseInt(args[0]) || 1);
  const perPage = 10;
  const totalPages = Math.ceil(list.length / perPage);
  const show = list.slice((page - 1) * perPage, page * perPage);

  let text =
`╔════════════════════╗
║ 🤖 ${global.config.BOTNAME || "BOT"} HELP ║
╚════════════════════╝

👑 Owner: ${OWNER_NAME}
🔗 Profile: ${OWNER_PROFILE}

`;

  show.forEach((cmd, i) => {
    text += `${(page - 1) * perPage + i + 1}. ${cmd}\n`;
  });

  text += `\n📄 Page ${page}/${totalPages}\n📦 Total Commands: ${list.length}`;

  // ===== avatar attach (optional) =====
  try {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const avatarPath = path.join(cacheDir, "owner.jpg");

    const res = await axios.get(
      `https://graph.facebook.com/${OWNER_ID}/picture?width=720&height=720`,
      { responseType: "arraybuffer", timeout: 10000 }
    );
    fs.writeFileSync(avatarPath, res.data);

    await api.sendMessage(
      { body: text, attachment: fs.createReadStream(avatarPath) },
      threadID,
      () => fs.unlinkSync(avatarPath),
      messageID
    );
  } catch {
    // fallback text only
    api.sendMessage(text, threadID, messageID);
  }
};