module.exports = {
    config: {
        name: 'bot',
        aliases: ['botcmd', 'bot-status'],
        role: 0,
        description: 'Get bot information'
    },
    run: async ({ api, event, config }) => {
        const message = `
🤖 BOT INFORMATION

Name: ${config.botName}
Author: ${config.author}
Prefix: ${config.prefix}

📊 Stats:
• Commands: 80+
• Version: 1.0.0
• Status: Online ✅

🔗 Links:
• Help: /help
• About: /about
• Commands: /help

💡 Type /help for all commands!
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
