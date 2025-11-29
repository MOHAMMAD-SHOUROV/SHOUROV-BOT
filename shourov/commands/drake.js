module.exports = {
    config: { name: 'drake', aliases: ['drake-meme'], role: 0, description: 'Drake meme template' },
    run: async ({ api, event, args }) => {
        if (args.length < 2) return api.sendMessage('❌ Usage: /drake <no> <yes>\n\nExample: /drake "Bad" "Good"', event.threadID);
        
        const no = args[0];
        const yes = args[1];
        
        api.sendMessage(`👎 ${no}\n\n👍 ${yes}\n\n🎬 Classic Drake!`, event.threadID);
    }
};
