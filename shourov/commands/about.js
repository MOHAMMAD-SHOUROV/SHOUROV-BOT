const os = require('os');

module.exports = {
    config: {
        name: 'about',
        aliases: ['info', 'botinfo'],
        role: 0,
        description: 'Display bot information and statistics'
    },
    run: async ({ api, event, config }) => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const memoryUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        const aboutMessage = `
╔══════════════════════════╗
║      BOT INFORMATION      ║
╚══════════════════════════╝

🤖 Bot Name: ${config.botName}
📝 Prefix: ${config.prefix}
👤 Author: ${config.author}
👑 Owner ID: ${config.ownerId}

⏱️ UPTIME:
${days > 0 ? `  ${days}d ` : ''}${hours}h ${minutes}m ${seconds}s

💾 MEMORY USAGE:
  Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
  Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
  System: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB

⚙️ SYSTEM:
  Platform: ${os.platform()}
  Node: ${process.version}
  CPU: ${os.cpus()[0].model}

🌐 Status: Online ✅
        `.trim();

        api.sendMessage(aboutMessage, event.threadID);
    }
};
