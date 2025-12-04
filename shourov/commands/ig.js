const request = require("request");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "prefixcall",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    credits: "SHOUROV",
    description: "Send random caption + image when only prefix is sent",
    category: "user",
    usages: "/",
    cooldowns: 3
};

// ALL CAPTIONS (আপনার দেওয়া সব + আরও স্টাইল করা)
const captions = [
    "❝ জীবন সুন্দর যদি কারো মায়ায় না পড়ো 🙂💔 ❞",
    "❝ হঠাৎ একদিন দেখা হবে কিন্তু কথা হবে না 🖤 ❞",
    "❝ তুমি গল্প হয়েও গল্প না, তুমি সত্যি হয়েও কল্পনা ❞",
    "❝ ভাঙা মন আর ভাঙা বিশ্বাস কোনোদিন জোড়া লাগে না… ❞",
    "❝ সে বলেছিলো কখনো ছেড়ে যাবে না… তাহলে চলে গেলো কেন? ❞",
    "❝ মানুষের মস্তিষ্কই হলো এক কবরস্থান… যেখানে স্বপ্নের মৃত্যু ঘটে 💔 ❞",
    "❝ জীবনটা তখনই সুন্দর ছিল… যখন ভাবতাম চাঁদটা আমার ❞",
    "❝ আমি তোমাকে ভালোবাসতাম… কিন্তু তুমি তো বুঝোনি ❞",
    "❝ প্রয়োজন ছাড়া কেউ খোঁজ নেয় না… চেনা মানুষগুলো অচেনা হয়ে যায় ❞",
    "❝ পরিস্থিতির কারণে চুপ হয়ে গেছি… নাহলে হাসি খুশি আমি কম ছিলাম না ❞",
    "❝ কোনো এক মায়াবতীর জন্য আজও ভিতরটা পুড়ে 🤍🪽 ❞",
    "❝ তুমি যত বেশি চাবে… সে তত বেশি ইগনোর করবে — এটাই বাস্তব 🙂 ❞",
    "❝ হঠাৎ করে দূরে সরে যাবো একদিন… তখন খুঁজে পাবে ❞",
    "❝ Life is beautiful if you don’t fall in love 🌸 ❞",
    "🌸 কোনো এক মায়াবতীর জন্য আজও ভিতরটা পুড়ে︵😌🤍🪽",
    "❝ মানুষের হাসির আড়ালে সবচেয়ে কষ্ট লুকানো থাকে ❞",
    "❝ সব গল্পের শেষ ভাল হয় না… কিছু গল্প অসম্পূর্ণই রয়ে যায় ❞"
];

// ALL IMAGES (আপনার দেওয়া সব + কাজ করা imgur links)
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

async function sendCaption(api, threadID, messageID) {
    const caption = captions[Math.floor(Math.random() * captions.length)];
    const img = images[Math.floor(Math.random() * images.length)];

    const file = path.join(__dirname, "cache", `${Date.now()}.jpg`);

    request(img).pipe(fs.createWriteStream(file)).on("close", () => {
        api.sendMessage(
            {
                body:
`╔═══『 RANDOM CAPTION 』═══╗

${caption}

⚜ BOT OWNER:  SHOUROV ⚜
╚════════════════════════╝`,
                attachment: fs.createReadStream(file)
            },
            threadID,
            () => fs.unlinkSync(file),
            messageID
        );
    });
}

module.exports.run = async function ({ api, event }) {
    return sendCaption(api, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
    const body = (event.body || "").trim();
    const prefix = global.config.PREFIX || "/";

    if (body === prefix) {
        return sendCaption(api, event.threadID, event.messageID);
    }
};