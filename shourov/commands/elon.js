module.exports = {
    config: { name: 'elon', aliases: ['elon-musk', 'tesla'], role: 0, description: 'Elon Musk quotes' },
    run: async ({ api, event }) => {
        const quotes = [
            "First principles thinking: question every assumption",
            "If you\'re not failing, you\'re not innovating enough",
            "Work like hell. I mean you just have to put in 80 to 100 hour weeks",
            "The best part is no part, the best process is no process",
            "When something is important enough, you do it even if the odds are not in your favor"
        ];
        api.sendMessage(`🚀 Elon Musk\n\n"${quotes[Math.floor(Math.random() * quotes.length)]}"`, event.threadID);
    }
};
