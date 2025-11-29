module.exports = {
    config: {
        name: 'ping',
        aliases: ['pong'],
        role: 0,
        description: 'Check bot latency and response time'
    },
    run: async ({ api, event }) => {
        const start = Date.now();
        
        api.sendMessage('🏓 Pinging...', event.threadID, (err, info) => {
            if (err) return;
            
            const latency = Date.now() - start;
            api.editMessage(
                `🏓 Pong!\n⏱️ Latency: ${latency}ms\n✅ Bot is responding normally`,
                info.messageID
            );
        });
    }
};
