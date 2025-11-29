module.exports = {
    config: { name: 'decode', aliases: ['decrypt', 'decode-text'], role: 0, description: 'Decode base64 text' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /decode <base64-text>', event.threadID);
        
        try {
            const decoded = Buffer.from(args.join(' '), 'base64').toString('utf8');
            api.sendMessage(`🔓 Decoded\n\n${decoded}`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Invalid base64 text!', event.threadID);
        }
    }
};
