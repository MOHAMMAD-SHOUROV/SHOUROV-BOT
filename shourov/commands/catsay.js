module.exports = {
    config: { name: 'catsay', aliases: ['cat-say', 'meow'], role: 0, description: 'Cat says something' },
    run: async ({ api, event, args }) => {
        const text = args.length > 0 ? args.join(' ') : 'Meow!';
        const msg = `
🐱 Cat says:
"${text}"
        `.trim();
        api.sendMessage(msg, event.threadID);
    }
};
