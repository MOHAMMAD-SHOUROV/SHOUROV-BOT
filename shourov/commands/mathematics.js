module.exports = {
    config: { name: 'mathematics', aliases: ['math-v2'], role: 0, description: 'Mathematics info' },
    run: async ({ api, event }) => {
        api.sendMessage('🧮 Mathematics\n\n📐 Geometry\n📊 Algebra\n📈 Calculus\n\n💡 Learn math!', event.threadID);
    }
};
