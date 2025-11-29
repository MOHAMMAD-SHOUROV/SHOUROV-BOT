module.exports = {
    config: { name: 'date2', aliases: ['date-v2', 'datetime'], role: 0, description: 'Show date with time' },
    run: async ({ api, event }) => {
        const now = new Date();
        const full = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        api.sendMessage(`📅⏰ Date & Time\n\n${full}`, event.threadID);
    }
};
