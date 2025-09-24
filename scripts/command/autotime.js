module.exports.config = {
    name: "autotime",
    version: "1.0.0",
    permission: 0,
    credits: "Shourov",
    description: "Send scheduled messages automatically",
    prefix: true,
    category: "user",
    usages: "",
    cooldowns: 5,
};

const scheduleMessages = [
    { time: '12:00:00 AM', messages: ['~ এখন রাত ১১টা বাজে\nখাউয়া দাউয়া করে নেউ😙'] },
    { time: '1:00:00 AM', messages: ['~ এখন রাত ১২টা বেজে গেলো সবাই শুয়ে পড়ো🤟'] },
    { time: '2:00:00 AM', messages: ['~ এখন রাত ১টা বাজে প্রেম না কইরা ঘুমা বেক্কল😾'] },
    { time: '3:00:00 AM', messages: ['~ এখন রাত ২টা বাজে যারা ছ্যাকা খাইছে তারা জেগে আছে🫠'] },
    { time: '4:00:00 AM', messages: ['~ এখন রাত ৩টা বাজে সবাই মনে হয় ঘুম🥹'] },
    { time: '5:00:00 AM', messages: ['~ এখন রাত ৪টা বাজে একটু পর ফজরের আযান দিলে নামাজ পড়ো'] },
    { time: '6:00:00 AM', messages: ['~ এখন ভোর ৫টা বাজে সবাই নামাজ পড়ছো তো?❤️'] },
    { time: '7:00:00 AM', messages: ['~ এখন সকাল ৬টা বাজে ঘুম থেকে উঠো সবাই'] },
    { time: '8:00:00 AM', messages: ['~ এখন সকাল ৭টা বাজে সবাই ব্রেকফাস্ট করে নাও😊'] },
    { time: '9:00:00 AM', messages: ['~ এখন সকাল ৮টা বাজে সবাই কাজে ব্যস্ত'] },
    { time: '10:00:00 AM', messages: ['~ এখন সকাল ৯টা বাজে মন দিয়ে কাজ করো সবাই❤️'] },
    { time: '11:00:00 AM', messages: ['~ এখন সকাল ১০টা বাজে মিস করছি তোমাদের'] },
    { time: '12:00:00 PM', messages: ['~ এখন সকাল ১১টা বাজে'] },
    { time: '1:00:00 PM', messages: ['~ এখন দুপুর ১২টা বাজে ❤️'] },
    { time: '2:00:00 PM', messages: ['~ এখন দুপুর ১টা বাজে সবাই কাজ বন্ধ করে জোহরের নামাজ পড়ো😻'] },
    { time: '3:00:00 PM', messages: ['~ এখন দুপুর ২টা বাজে গোসল করে দুপুরের খাবার খাও ☺️'] },
    { time: '4:00:00 PM', messages: ['~ এখন দুপুর ৩টা বাজে❤️'] },
    { time: '5:00:00 PM', messages: ['~ এখন বিকাল ৪টা বাজে আসরের আযান দিলে সবাই নামাজ পড়ো🥀'] },
    { time: '6:00:00 PM', messages: ['~ এখন বিকাল ৫টা বাজে মাগরিবের আযান দিবে সবাই নামাজ পড়ো 😻'] },
    { time: '7:00:00 PM', messages: ['~ এখন সন্ধ্যা ৬টা বাজে পরিবারের সাথে সময় কাটাও😍'] },
    { time: '8:00:00 PM', messages: ['~ এখন সন্ধ্যা ৭টা বাজে এখন এশার আযান দিবে সবাই নামাজ পড়ো❤️'] },
    { time: '9:00:00 PM', messages: ['~ এখন রাত ৮টা বাজে'] },
    { time: '10:00:00 PM', messages: ['~ এখন রাত ৯টা বাজে সবাই শুয়ে পড়া🙂'] },
    { time: '11:00:00 PM', messages: ['~ এখন রাত ১০টা বাজে সবাই ঘুমায় পড়ো😭'] },
];

module.exports.onLoad = (bot) => {
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: true });
        const scheduled = scheduleMessages.find(item => item.time === timeString);
        if (scheduled) {
            const randomMessage = scheduled.messages[Math.floor(Math.random() * scheduled.messages.length)];
            global.data.allThreadID.forEach(threadID => {
                bot.api.sendMessage(randomMessage, threadID);
            });
        }
    }, 1000);
};

module.exports.run = () => {};
