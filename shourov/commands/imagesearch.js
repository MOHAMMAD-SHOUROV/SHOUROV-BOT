module.exports = {
    config: { name: 'imagesearch', aliases: ['img-search'], role: 0, description: 'Search images' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /imagesearch <query>', event.threadID);
        const query = args.join(' ');
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
        api.sendMessage(`🔍 Image Search\n\n🔗 ${url}`, event.threadID);
    }
};
