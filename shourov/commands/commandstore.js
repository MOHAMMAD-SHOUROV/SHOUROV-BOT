module.exports = {
    config: { name: 'commandstore', aliases: ['cmd-store', 'store'], role: 0, description: 'Command store/marketplace' },
    run: async ({ api, event }) => {
        const msg = `
🛍️ Command Store

Popular Commands:
📥 Downloads: /fbdl, /ytmp4, /ytmp3
🤖 AI: /ai, /gpt, /aiimg
🎮 Fun: /meme, /anime, /love
🎵 Music: /lyrics, /album
📚 Info: /wiki, /weather, /userinfo

💡 Type /help to see all commands!
        `.trim();
        
        api.sendMessage(msg, event.threadID);
    }
};
