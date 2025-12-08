module.exports.config = {
    name: "qrscan",
    version: "1.0.1",
    permission: 0,
    credits: "shourov",
    description: "Generate QR code from text",
    prefix: false,
    category: "user",
    usages: "qrscan <text>",
    cooldowns: 5,
    dependencies: {
        "qrcode": "",
        "fs-extra": ""
    }
};

module.exports.languages = {
    "vi": {
        "missingInput": "Hãy nhập đầu vào để có thể tạo qr code"
    },
    "en": {
        "missingInput": "Enter input to create QR code"
    }
};

module.exports.run = async function ({ api, event, args, getText }) {
    const fs = require("fs-extra");
    const QR = require("qrcode");

    try {
        const text = args.join(" ");

        if (!text)
            return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);

        const cachePath = __dirname + `/cache/qr_${event.threadID}_${event.messageID}.png`;

        const options = {
            errorCorrectionLevel: "H",
            type: "image/png",
            quality: 0.9,
            scale: 30,
            margin: 1,
            color: { dark: "#000000", light: "#FFFFFF" }
        };

        // Create QR PNG file
        await QR.toFile(cachePath, text, options);

        return api.sendMessage(
            {
                body: "✔️ Here is your QR Code:",
                attachment: fs.createReadStream(cachePath)
            },
            event.threadID,
            () => fs.unlinkSync(cachePath), // Auto delete file
            event.messageID
        );

    } catch (err) {
        console.log("QR Error:", err);
        return api.sendMessage("❌ Error generating QR code.", event.threadID, event.messageID);
    }
};