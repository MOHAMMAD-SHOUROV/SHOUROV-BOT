module.exports = {
    config: { name: 'quiz', aliases: ['test', 'question'], role: 0, description: 'Quiz game' },
    run: async ({ api, event }) => {
        const questions = ['What is 2+2?', 'What is the capital of France?', 'Who wrote Harry Potter?'];
        const q = questions[Math.floor(Math.random() * questions.length)];
        api.sendMessage(`❓ ${q}`, event.threadID);
    }
};
