const { exec } = require("child_process");

module.exports.config = {
  name: "shell",
  aliases: ["sh", "terminal", "exec"],
  version: "1.0.1",
  permission: 2, // only admin use
  credits: "shourov",
  description: "Execute shell commands (Owner only)",
  prefix: true,
  category: "owner",
  usages: "/shell <command>",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {

  const command = args.join(" ");
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!command) {
    return api.sendMessage("❗ Please provide a shell command to execute.", threadID, messageID);
  }

  exec(command, (error, stdout, stderr) => {

    if (error) {
      return api.sendMessage(`❌ Error:\n${error.message}`, threadID, messageID);
    }

    if (stderr) {
      return api.sendMessage(`⚠️ Stderr:\n${stderr}`, threadID, messageID);
    }

    const output = stdout || "No output available";

    const result = output.length > 2000 
      ? output.slice(0, 2000) + "\n\n⚠️ Output too long… truncated."
      : output;

    api.sendMessage("✅ Result:\n" + result, threadID, messageID);
  });
};