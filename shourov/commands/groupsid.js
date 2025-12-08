module.exports = {
  config: {
    name: "tid",
    version: "1.0.1",
    permission: 0,
    prefix: false,
    credits: "Modified by Shourov",
    description: "Get current group/thread ID",
    category: "without prefix",
    usages: "tid",
    cooldowns: 3
  },

  start: async function({ shourov, events }) {
    const tid = events.threadID;

    return nayan.reply(
      `📌 *Group / Thread ID*\n\n👉 **${tid}**\n\n⚙️ Use this ID for admin tools or setup.`,
      events.threadID,
      events.messageID
    );
  }
};