module.exports = {
    config: {
        name: 'banner3',
        aliases: ['banner-v3', 'text-banner3'],
        role: 0,
        description: 'Create decorative text banner v3'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide text!\nUsage: /banner3 <text>', event.threadID);
        }

        const text = args.join(' ').substring(0, 20);
        const banner = `
▌┌${'─'.repeat(text.length + 2)}┐
▌│ ${text} │
▌└${'─'.repeat(text.length + 2)}┘
        `.trim();

        api.sendMessage(banner, event.threadID);
    }
};
