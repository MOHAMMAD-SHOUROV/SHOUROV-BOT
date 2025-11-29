module.exports = {
    config: { name: 'console', aliases: ['log', 'debug'], role: 2, description: 'Console/debug info' },
    run: async ({ api, event }) => {
        const mem = process.memoryUsage();
        const msg = `
🖥️ Console Information

Memory:
  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB
  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB
  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB

Uptime: ${Math.floor(process.uptime())} seconds
Platform: ${process.platform}
Node: ${process.version}
        `.trim();
        
        api.sendMessage(msg, event.threadID);
    }
};
