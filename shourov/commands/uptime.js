const Modifier = require('../../modifier');

module.exports = {
    config: {
        name: 'uptime',
        aliases: ['runtime', 'status'],
        role: 0,
        description: 'Show bot uptime and status'
    },
    run: async ({ api, event, config }) => {
        const uptime = process.uptime() * 1000;
        const formattedUptime = Modifier.formatUptime(uptime);

        const memUsage = process.memoryUsage();
        const formattedMem = Modifier.formatBytes(memUsage.heapUsed);

        const uptimeMessage = `
⏱️ BOT UPTIME

🤖 ${config.botName}
📊 Status: Online ✅

⏰ Running Time: ${formattedUptime}
💾 Memory Usage: ${formattedMem}
🔄 Process ID: ${process.pid}
⚡ Node Version: ${process.version}

📌 Prefix: ${config.prefix}
👤 Author: ${config.author}
        `.trim();

        api.sendMessage(uptimeMessage, event.threadID);
    }
};
