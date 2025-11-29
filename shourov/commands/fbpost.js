module.exports = {
    config: { name: 'fbpost', aliases: ['post', 'fb-post'], role: 0, description: 'Facebook post helper' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /fbpost <message>\n\n💡 Copy to post on Facebook', event.threadID);
        const msg = args.join(' ');
        api.sendMessage(`📝 Post Ready:\n\n${msg}\n\n💡 Copy & paste to Facebook!`, event.threadID);
    }
};
