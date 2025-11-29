module.exports = {
    config: {
        name: 'obama',
        aliases: ['barack', 'potus44'],
        role: 0,
        description: 'Get inspirational Obama quotes'
    },
    run: async ({ api, event }) => {
        const quotes = [
            "Change will not come if we wait for some other person or some other time. We are the ones we've been waiting for.",
            "The best way to not feel hopeless is to get up and do something.",
            "We are the change that we seek.",
            "If you're walking down the right path and you're willing to keep walking, eventually you'll make progress.",
            "The future rewards those who press on.",
            "Yes We Can!",
            "Hope is not blind optimism. It's not ignoring the enormity of the task ahead.",
            "We need to internalize this idea of excellence. Not many folks spend a lot of time trying to be excellent.",
            "The strongest democracies flourish from frequent and lively debate.",
            "Change is never easy, but always possible.",
            "We don't ask you to believe in our ability to bring change, rather, we ask you to believe in yours.",
            "Making your mark on the world is hard. If it were easy, everybody would do it.",
            "A change is brought about because ordinary people do extraordinary things.",
            "If you run you stand a chance of losing, but if you don't run you've already lost.",
            "Our destiny is not written for us. It's written by us."
        ];

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        api.sendMessage(`🇺🇸 Barack Obama\n\n"${randomQuote}"\n\n- 44th President of the United States`, event.threadID);
    }
};
