module.exports = {
    config: {
        name: 'banner2',
        aliases: ['banner-v2', 'text-banner2'],
        role: 0,
        description: 'Create fancy text banner v2'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide text!\nUsage: /banner2 <text>', event.threadID);
        }

        const text = args.join(' ').substring(0, 20);
        const banner = `
┏${'━'.repeat(text.length + 2)}┓
┃ ${text} ┃
┗${'━'.repeat(text.length + 2)}┛
        `.trim();

        api.sendMessage(banner, event.threadID);
    }
};
