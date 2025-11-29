module.exports = {
    config: {
        name: 'adbot',
        aliases: ['addbot', 'invitebot'],
        role: 2,
        description: 'Get bot invitation link or info'
    },
    run: async ({ api, event, config }) => {
        const botID = api.getCurrentUserID();
        
        const message = `
🤖 BOT INVITATION

📝 Bot Name: ${config.botName}
🆔 Bot ID: ${botID}
👤 Author: ${config.author}

📌 To add this bot to your group:
1. Add bot as friend: https://facebook.com/${botID}
2. Create a group chat
3. Add the bot to the group
4. Make the bot admin for full features

💡 Prefix: ${config.prefix}
❓ Type ${config.prefix}help for commands
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
