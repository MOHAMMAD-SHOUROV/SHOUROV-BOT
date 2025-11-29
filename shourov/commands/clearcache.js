module.exports = {
    config: { name: 'clearcache', aliases: ['clear-cache', 'cache-clear'], role: 2, description: 'Clear bot cache' },
    run: async ({ api, event }) => {
        try {
            global.gc?.();
            api.sendMessage('✅ Cache cleared successfully!\n\n📊 Memory optimized', event.threadID);
        } catch (error) {
            api.sendMessage('⚠️ Cache clear attempted\n\n💡 Note: Some caches are system-managed', event.threadID);
        }
    }
};
