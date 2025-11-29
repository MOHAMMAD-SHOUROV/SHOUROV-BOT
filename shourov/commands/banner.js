module.exports = {
    config: {
        name: 'banner',
        aliases: ['banner1', 'text-banner'],
        role: 0,
        description: 'Create text banner'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide text!\nUsage: /banner <text>', event.threadID);
        }

        const text = args.join(' ').substring(0, 20);
        const banner = `
╔${'═'.repeat(text.length + 2)}╗
║ ${text} ║
╚${'═'.repeat(text.length + 2)}╝
        `.trim();

        api.sendMessage(banner, event.threadID);
    }
};
