module.exports = {
    config: { name: 'infoip', aliases: ['ip-info'], role: 0, description: 'IP information' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /infoip <ip_address>', event.threadID);
        const ip = args[0];
        api.sendMessage(`🌐 IP Info: ${ip}\n\n💡 Use ipinfo.io for details`, event.threadID);
    }
};
