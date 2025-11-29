module.exports = {
    config: { name: 'fish', aliases: ['fishing', 'catch'], role: 0, description: 'Fishing game' },
    run: async ({ api, event }) => {
        const catch_chance = Math.random();
        if (catch_chance > 0.5) {
            api.sendMessage('🎣 You caught a fish!\n\n🐟 Great catch!\n\n🍽️ Time to eat!', event.threadID);
        } else {
            api.sendMessage('🎣 Nothing biting today...\n\n😞 Better luck next time!', event.threadID);
        }
    }
};
