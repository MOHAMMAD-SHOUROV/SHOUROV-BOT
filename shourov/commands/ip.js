module.exports = {
    config: { name: 'ip', aliases: ['myip', 'public-ip'], role: 0, description: 'Show IP address' },
    run: async ({ api, event }) => {
        api.sendMessage('🌐 IP Address\n\n💡 Use ipinfo.io to check your IP', event.threadID);
    }
};
