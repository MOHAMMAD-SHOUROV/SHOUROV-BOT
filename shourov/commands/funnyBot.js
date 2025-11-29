module.exports = {
    config: { name: 'funnybot', aliases: ['funny', 'joke-bot'], role: 0, description: 'Funny bot mode' },
    run: async ({ api, event }) => {
        const jokes = [
            '😂 Why did the bot go to school? To improve its code!',
            '🤖 What do you call a robot who tells jokes? A fun-ction!',
            '💻 Why do programmers prefer dark mode? Because light attracts bugs!'
        ];
        api.sendMessage(jokes[Math.floor(Math.random() * jokes.length)], event.threadID);
    }
};
