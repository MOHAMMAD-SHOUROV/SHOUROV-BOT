module.exports.config = {
    name: "slashcaption",
    version: "1.0.0",
    permission: 0,
    credits: "Shourov",
    prefix: false,
    description: "Send caption when user types /",
    category: "user",
    usages: "/",
    cooldowns: 2
};

module.exports.handleEvent = async function ({ api, event }) {
    const msg = event.body?.trim();

    if (msg !== "/") return; // শুধুমাত্র "/" দেখলে কাজ করবে

    const request = require("request");
    const fs = require("fs-extra");

    const captions = [
        "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
        "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
        "❝ ভাঙা মন আর ভাঙা বিশ্বাস কখনো জোড়া লাগে না ❞",
        "❝ সে বলেছিলো ছাড়বে না… তাহলে চলে গেলো কেন? ❞",
        "❝ মানুষের মস্তিষ্ক হলো কবর… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
        "❝ চাঁদটা আমার ভেবেছিলাম… ❞",
        "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… ❞"
    ];

    const images = [
        "https://i.imgur.com/vnVjD6L.jpeg",
        "https://i.imgur.com/TG3rIiJ.jpeg",
        "https://i.imgur.com/CPK9lur.jpeg",
        "https://i.imgur.com/GggjGf9.jpeg",
        "https://i.imgur.com/xUNknmi.jpeg",
        "https://i.imgur.com/wzXgnwq.jpeg"
    ];

    const caption = captions[Math.floor(Math.random() * captions.length)];
    const img = images[Math.floor(Math.random() * images.length)];

    const filePath = __dirname + "/cache/caption.jpg";

    request(img)
        .pipe(fs.createWriteStream(filePath))
        .on("close", () => {
            api.sendMessage({
                body:
`╔══ ✦•❁•✦ ══╗
✨ RANDOM CAPTION ✨

${caption}

⚜ BOT OWNER: SHOUROV ⚜
╚══ ✦•❁•✦ ══╝`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => fs.unlinkSync(filePath));
        });
};

module.exports.run = async () => {};