module.exports = {
    config: { name: 'cbto', aliases: ['cb', 'comeback'], role: 0, description: 'Comeback burns' },
    run: async ({ api, event }) => {
        const comebacks = [
            'Your vibes are immaculate!',
            'You\'re cooler than cold pizza!',
            'You\'re the definition of awesome!',
            'You\'re a gem in a pile of rocks!',
            'Keep being amazing!',
            'You light up the room!',
            'You\'re absolutely crushing it!'
        ];
        const cb = comebacks[Math.floor(Math.random() * comebacks.length)];
        api.sendMessage(`🔥 ${cb}`, event.threadID);
    }
};
