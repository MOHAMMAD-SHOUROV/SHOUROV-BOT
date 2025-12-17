module.exports.config = {
  name: "help",
  version: "3.0.0",
  permission: 0,
  prefix: true,
  credits: "Shourov (styled)",
  description: "Show all commands & owner info",
  category: "system",
  usages: "[page]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // ===== BASIC DATA =====
  const commands = global.client.commands;
  const prefix = (global.config && global.config.PREFIX) || "/";
  const botName = (global.config && global.config.BOTNAME) || "BOT";

  const OWNER_NAME = "ALIHSAN SHOUROV";
  const OWNER_ID = "100071971474157";
  const OWNER_PROFILE = "https://www.facebook.com/shourov.sm24";

  if (!commands || commands.size === 0) {
    return api.sendMessage("❌ No commands found.", threadID, messageID);
  }

  // ===== COMMAND LIST =====
  const allCommands = Array.from(commands.values());

  const page = parseInt(args[0]) || 1;
  const perPage = 10;
  const totalPages = Math.ceil(allCommands.length / perPage);

  if (page < 1 || page > totalPages) {
    return api.sendMessage(
      `❌ Invalid page.\nAvailable pages: 1 - ${totalPages}`,
      threadID,
      messageID
    );
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;

  // ===== BUILD MESSAGE =====
  let msg = "";
  msg += `╔══════════════════════╗\n`;
  msg += `   🤖 ${botName} HELP MENU\n`;
  msg += `╚══════════════════════╝\n\n`;

  msg += `👑 OWNER INFORMATION\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;
  msg += `• Name   : ${OWNER_NAME}\n`;
  msg += `• ID     : ${OWNER_ID}\n`;
  msg += `• Profile: ${OWNER_PROFILE}\n\n`;

  msg += `📂 COMMAND FILES\n`;
  msg += `━━━━━━━━━━━━━━━━━━\n`;

  allCommands.slice(start, end).forEach((cmd, index) => {
    msg += `🔹 ${start + index + 1}. ${prefix}${cmd.config.name}\n`;
    if (cmd.config.description) {
      msg += `   ↳ ${cmd.config.description}\n`;
    }
  });

  msg += `\n━━━━━━━━━━━━━━━━━━\n`;
  msg += `📄 Page : ${page}/${totalPages}\n`;
  msg += `📌 Total Commands : ${allCommands.length}\n`;
  msg += `💡 Use: ${prefix}help <page>\n`;
  msg += `━━━━━━━━━━━━━━━━━━`;

  api.sendMessage(msg, threadID, messageID);
};