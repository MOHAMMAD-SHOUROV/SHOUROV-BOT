module.exports = {
    config: { name: 'config', aliases: ['setting', 'settings'], role: 2, description: 'View bot configuration' },
    run: async ({ api, event, config }) => {
        const msg = `
⚙️ Bot Configuration

Bot Name: ${config.botName}
Prefix: ${config.prefix}
Author: ${config.author}
Owner ID: ${config.ownerId}
Port: ${config.port}

🔒 Protected: YES
✅ Status: Active

💡 Edit config.json to change settings
        `.trim();
        
        api.sendMessage(msg, event.threadID);
    }
};
