module.exports.config = {
    name: "prefix",
    version: "1.0.0",
    permission: 0,
    credits: "Shourov",
    prefix: false, // prefix ছাড়াই কাজ করবে
    description: "Send random caption when user types '/'",
    category: "user",
    usages: "/",
    cooldowns: 2
};

module.exports.run = async function ({ api, event }) {
    const request = require("request");
    const fs = require("fs-extra");

    const captions = [
        "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
        "❝ হঠাৎ একদিন দেখা হবে কিন্তু কথা হবে না 🖤 ❞",
        "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
        "❝ ভাঙা মন আর ভাঙা বিশ্বাস কোনোদিন জোড়া লাগে না… ❞",
        "❝ সে বলেছিলো কখনো ছেড়ে যাবে না… তাহলে চলে গেলো কেন? ❞",
        "❝ মানুষের মস্তিষ্ক কবরস্থান… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
        "❝ জীবনটা সুন্দর ছিল… যখন ভাবতাম চাঁদটা আমার ❞",
        "❝ আমি তোমাকে ভালোবাসতাম… কিন্তু তুমি তো বুঝোনি ❞",
        "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… ❞",
        "❝ পরিস্থিতির কারণে চুপ হয়ে গেছি… ❞",
        "❝ কোনো মায়াবতীর জন্য আজও ভিতরটা পুড়ে 🤍🪽 ❞",
        "❝ তুমি যত বেশি চাবে… সে তত বেশি ইগনোর করবে ❞",
        "❝ হঠাৎ করে দূরে সরে যাবো একদিন… ❞",
        "❝ Life is beautiful if you don’t fall in love ❞",
        "🌸 কোনো এক মায়াবতীর জন্য আজও ভিতরটা পুড়ে︵😌🤍🪽",
        "❝ সব গল্পের শেষ ভালো হয় না… ❞"
    ];

    const images = [
        "https://i.imgur.com/vnVjD6L.jpeg",
        "https://i.imgur.com/XOeAkn1.jpeg",
        "https://i.imgur.com/Te7k6sV.jpeg",
        "https://i.imgur.com/1w4Zec2.jpeg",
        "https://i.imgur.com/GggjGf9.jpeg",
        "https://i.imgur.com/CPK9lur.jpeg",
        "https://i.imgur.com/wzXgnwq.jpeg",
        "https://i.imgur.com/JuA7M0t.jpeg",
        "https://i.imgur.com/aWntUvL.jpeg",
        "https://i.imgur.com/3MrSsoV.jpeg",
        "https://i.imgur.com/5BtyeEH.jpeg",
        "https://i.imgur.com/e1X4FL9.jpeg",
        "https://i.imgur.com/xUNknmi.jpeg",
        "https://i.imgur.com/TG3rIiJ.jpeg",
        "https://i.imgur.com/Te7k6sV.jpeg"
    ];

    // Only respond when user sends "/"
    if (event.body.trim() !== "/") return;

    const caption = captions[Math.floor(Math.random() * captions.length)];
    const image = images[Math.floor(Math.random() * images.length)];
    const path = __dirname + `/cache/cap.jpg`;

    request(image)
        .pipe(fs.createWriteStream(path))
        .on("close", () => {
            api.sendMessage({
                body:
`╔══ ✦ • ❁ • ✦ ══╗
✨ 𝗥𝗔𝗡𝗗𝗢𝗠 𝗖𝗔𝗣𝗧𝗜𝗢𝗡 ✨

${caption}

⚜ 𝗕𝗢𝗧 𝗢𝗪𝗡𝗘𝗥: 𝗦𝗛𝗢𝗨𝗥𝗢𝗩 ⚜
╚══ ✦ • ❁ • ✦ ══╝`,
                attachment: fs.createReadStream(path)
            }, event.threadID, () => fs.unlinkSync(path), event.messageID);
        });
};