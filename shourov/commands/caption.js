module.exports = {
    config: { name: 'caption', aliases: ['cap', 'write-caption'], role: 0, description: 'Create caption text' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /caption <text>', event.threadID);
        
        const text = args.join(' ');
        const caption = `
📝 CAPTION
━━━━━━━━━━━━━━━
${text}
━━━━━━━━━━━━━━━
        `.trim();
        
        api.sendMessage(caption, event.threadID);
    }
};
