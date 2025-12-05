module.exports = {
  config: {
    name: "fuck_you",
    version: "1.0.1",
    author: "AceGun (fixed by Shourov)",
    countDown: 5,
    role: 0,
    shortDescription: "Responds to rude messages",
    longDescription: "Replies with a funny GIF when someone uses rude words",
    category: "no prefix"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const text = event.body?.toLowerCase();
    if (!text) return;

    // Detect variations:
    const badWords = ["fuck", "fuck you", "f*ck", "fucc", "fuk", "f u", "fuk you"];

    if (badWords.some(word => text.includes(word))) {
      return message.reply({
        body: "🖕 **Fuck you too, baby 😘**",
        attachment: await global.utils.getStreamFromURL("https://i.imgur.com/9bNeakd.gif")
      });
    }
  }
};