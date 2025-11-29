module.exports = {
    config: { name: 'date', aliases: ['today', 'current-date'], role: 0, description: 'Show current date' },
    run: async ({ api, event }) => {
        const now = new Date();
        const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        api.sendMessage(`📅 Today's Date\n\n${date}`, event.threadID);
    }
};
