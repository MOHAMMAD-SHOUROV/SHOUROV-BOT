module.exports = {
    config: { name: 'fbpostv2', aliases: ['fb-post-v2'], role: 0, description: 'Facebook post helper v2' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /fbpostv2 <message>', event.threadID);
        const msg = args.join(' ');
        api.sendMessage(`📢 Formatted Post:\n\n✨ ${msg} ✨\n\n💁 Ready to share!`, event.threadID);
    }
};
