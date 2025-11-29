module.exports = {
    config: { name: 'random', aliases: ['rand', 'rnd'], role: 0, description: 'Random number' },
    run: async ({ api, event, args }) => {
        const max = parseInt(args[0]) || 100;
        const num = Math.floor(Math.random() * max) + 1;
        api.sendMessage(`🎲 Random: ${num} (1-${max})`, event.threadID);
    }
};
