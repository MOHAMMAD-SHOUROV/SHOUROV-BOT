module.exports.config = {  
    name: "uptime",  
    version: "1.0.0",  
    permission: 0,  
    prefix: true,  
    credits: "shourov",  
    description: "Show bot uptime with graphic card",  
    category: "admin",  
    usages: "",  
    cooldowns: 5,  
};  

function byte2mb(bytes) {  
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];  
    let i = 0;  
    while (bytes >= 1024) {  
        bytes /= 1024;  
        i++;  
    }  
    return `${bytes.toFixed(1)} ${units[i]}`;  
}  

module.exports.run = async ({ api, event }) => {

    const axios = require("axios");
    const fs = require("fs-extra");
    const request = require("request");
    const { loadImage, createCanvas, registerFont } = require("canvas");
    const moment = require("moment-timezone");
    const pidusage = await global.nodemodule["pidusage"](process.pid);

    // -------- FIX UPTIME ----------
    const time = process.uptime();
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const z = hours.toString().padStart(2, "0");
    const x = minutes.toString().padStart(2, "0");
    const y = seconds.toString().padStart(2, "0");

    const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY || HH:mm:ss");
    const timeStart = Date.now();

    // ---------- FIX FONT PATH ----------
    const fontPath = __dirname + `/shourov/UTM-Avo.ttf`;
    if (!fs.existsSync(fontPath)) {
        let fontData = (await axios.get(
            `https://github.com/hanakuUwU/font/raw/main/UTM%20Avo.ttf`,
            { responseType: "arraybuffer" }
        )).data;
        fs.writeFileSync(fontPath, Buffer.from(fontData, "utf-8"));
    }

    // -------- RANDOM IMAGE ----------
    const backgrounds = [
        "https://i.imgur.com/9jbBPIM.jpg",
        "https://i.imgur.com/cPvDTd9.jpg",
        "https://i.imgur.com/ZT8CgR1.jpg",
        "https://i.imgur.com/WhOaTx7.jpg"
    ];

    let bgURL = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    let bgPath = __dirname + `/shourov/bg.jpg`;
    let avaPath = __dirname + `/shourov/ava.png`;

    // Download background
    const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(bgPath, Buffer.from(bgData));

    // Anime avatar fallback (safe index)
    let animeList = (await axios.get(
        "https://raw.githubusercontent.com/mraikero-01/saikidesu_data/main/imgs_data2.json"
    )).data;

    let id = Math.floor(Math.random() * animeList.length);
    let avatarURL = animeList[id].imgAnime;

    // Download avatar
    const avaData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(avaPath, Buffer.from(avaData));

    // ---------- DRAW CANVAS ----------
    let imgBG = await loadImage(bgPath);
    let imgAVA = await loadImage(avaPath);

    let canvas = createCanvas(imgBG.width, imgBG.height);
    let ctx = canvas.getContext("2d");

    ctx.drawImage(imgBG, 0, 0, canvas.width, canvas.height);

    ctx.drawImage(imgAVA, 800, 50, 900, 900);

    registerFont(fontPath, { family: "UTM" });

    ctx.fillStyle = "#ffffff";
    ctx.font = "120px UTM";
    ctx.fillText("UPTIME ROBOT", 100, 300);

    ctx.font = "70px UTM";
    ctx.fillText(`${z}:${x}:${y}`, 150, 400);

    const finalPath = __dirname + `/shourov/uptime.png`;
    fs.writeFileSync(finalPath, canvas.toBuffer());

    // ------------- SEND MESSAGE ---------------
    api.sendMessage(
        {
            body: `⟬ UPTIME STATUS ⟭

→ Running: ${hours}h ${minutes}m ${seconds}s
→ BOT: ${global.config.BOTNAME}
→ Prefix: ${global.config.PREFIX}
→ Commands: ${global.client.commands.size}
→ Users: ${global.data.allUserID.length}
→ Threads: ${global.data.allThreadID.length}
→ CPU: ${pidusage.cpu.toFixed(1)}%
→ RAM: ${byte2mb(pidusage.memory)}
→ Ping: ${Date.now() - timeStart}ms

[ ${timeNow} ]`,
            attachment: fs.createReadStream(finalPath)
        },
        event.threadID,
        () => {
            fs.unlinkSync(finalPath);
            fs.unlinkSync(bgPath);
            fs.unlinkSync(avaPath);
        }
    );
};