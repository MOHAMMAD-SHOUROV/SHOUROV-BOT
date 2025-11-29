module.exports = {
    config: {
        name: 'botinfo',
        aliases: ['bot-info', 'info'],
        role: 0,
        description: 'Detailed bot information'
    },
    run: async ({ api, event, config }) => {
        const uptime = process.uptime();
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);

        const message = `
🤖 DETAILED BOT INFO

📋 General:
• Name: ${config.botName}
• Author: ${config.author}
• Prefix: ${config.prefix}
• Owner ID: ${config.ownerId}

⏱️ Uptime: ${uptimeHours}h ${uptimeMinutes}m
📊 Commands: 80+
🌐 Status: Online ✅

💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB

📚 Resources:
• facebook-chat-api: v1.7.0
• express: v4.18.2
• axios: v1.6.2

🔗 Help: /help
❓ About: /about
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
