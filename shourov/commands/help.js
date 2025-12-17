module.exports.config = {
  name: "help",
  version: "2.0.0",
  permission: 0,
  prefix: true,
  credits: "Shourov (fixed)",
  description: "Show all bot commands",
  category: "system",
  usages: "[page]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const commands = global.client.commands;

  if (!commands || commands.size === 0) {
    return api.sendMessage("❌ No commands loaded.", threadID, messageID);
  }

  const prefix = (global.config && global.config.PREFIX) || "/";

  // pagination
  const page = parseInt(args[0]) || 1;
  const perPage = 10;
  const allCmds = Array.from(commands.values());

  const totalPages = Math.ceil(allCmds.length / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  if (page > totalPages || page < 1) {
    return api.sendMessage(
      `❌ Invalid page.\nAvailable pages: 1 - ${totalPages}`,
      threadID,
      messageID
    );
  }

  let msg = `╔════『 🤖 ${global.config.BOTNAME || "BOT"} HELP 』════╗\n\n`;

  allCmds.slice(start, end).forEach((cmd, i) => {
    msg += `🔹 ${start + i + 1}. ${prefix}${cmd.config.name}\n`;
    if (cmd.config.description)
      msg += `   └ ${cmd.config.description}\n`;
  });

  msg += `\n📄 Page ${page}/${totalPages}`;
  msg += `\n📌 Total Commands: ${allCmds.length}`;
  msg += `\n╚══════════════════════╝`;

  api.sendMessage(msg, threadID, messageID);
};