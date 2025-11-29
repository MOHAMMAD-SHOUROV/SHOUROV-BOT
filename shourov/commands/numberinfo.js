module.exports = {
    config: { name: 'numberinfo', aliases: ['phone-info', 'bd-number'], role: 0, description: 'Bangladesh number info' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /numberinfo <number>', event.threadID);
        const number = args[0];
        api.sendMessage(`📱 Number: ${number}\n\n🇧🇩 Bangladesh`, event.threadID);
    }
};
