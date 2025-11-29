module.exports = {
    config: { name: 'mp3', aliases: ['audio', 'music-file'], role: 0, description: 'MP3 audio file' },
    run: async ({ api, event }) => {
        api.sendMessage('🎵 MP3 Audio\n\n🎧 High Quality Sound\n\n🎶 Music is life!', event.threadID);
    }
};
