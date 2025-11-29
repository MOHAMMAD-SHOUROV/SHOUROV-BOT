module.exports = {
    config: { name: 'family', aliases: ['relatives', 'fam'], role: 0, description: 'Family mode' },
    run: async ({ api, event }) => {
        api.sendMessage(`👨‍👩‍👧‍👦 Family First!\n\n❤️ Family is everything\n🏠 Home is where the heart is\n💕 Love your family always`, event.threadID);
    }
};
