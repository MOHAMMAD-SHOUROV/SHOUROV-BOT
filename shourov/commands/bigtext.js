module.exports = {
    config: {
        name: 'bigtext',
        aliases: ['big', 'enlarge'],
        role: 0,
        description: 'Make text bigger/spaced out'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide text!\nUsage: /bigtext <text>', event.threadID);
        }

        const text = args.join(' ').substring(0, 15);
        const bigText = text.split('').map(char => char + ' ').join('\n');

        api.sendMessage(`📏 BIG TEXT\n\n${bigText}`, event.threadID);
    }
};
