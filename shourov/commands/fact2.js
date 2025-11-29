module.exports = {
    config: { name: 'fact2', aliases: ['fact-v2'], role: 0, description: 'Alternative fact command' },
    run: async ({ api, event }) => {
        const facts = [
            '🐙 Octopuses have three hearts',
            '🦁 Honey never spoils',
            '🧠 Your brain uses 20% of your body\'s energy',
            '🌍 Earth\'s core is as hot as the sun',
            '🦅 Eagles can see 8x better than humans'
        ];
        api.sendMessage(`📚 ${facts[Math.floor(Math.random() * facts.length)]}`, event.threadID);
    }
};
