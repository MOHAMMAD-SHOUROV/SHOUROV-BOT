const fs = require('fs');
const request = require('request');

module.exports.config = {
    name: "operatornoti",
    version: "1.0.0",
    permission: 3,
    credits: "shourov",
    description: "send announcement from operators to all threads and handle replies",
    prefix: true,
    category: "operator",
    usages: "[msg]",
    cooldowns: 5,
}

let atmDir = [];

const getAtm = (atm, body) => new Promise(async (resolve) => {
    let msg = {}, attachment = [];
    msg.body = body;
    for (let eachAtm of atm) {
        await new Promise(async (resInner) => {
            try {
                let response = await request.get(eachAtm.url);
                let pathName = response.uri.pathname;
                let ext = pathName.substring(pathName.lastIndexOf(".") + 1);
                let path = __dirname + `/cache/${eachAtm.filename}.${ext}`;
                response
                    .pipe(fs.createWriteStream(path))
                    .on("close", () => {
                        attachment.push(fs.createReadStream(path));
                        atmDir.push(path);
                        resInner();
                    })
                    .on("error", (e) => {
                        console.log("attachment pipe error:", e);
                        resInner();
                    });
            } catch (e) {
                console.log(e);
                resInner();
            }
        });
    }
    msg.attachment = attachment;
    resolve(msg);
});

module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads }) {
    try {
        const moment = require("moment-timezone");
        const gio = moment.tz("Asia/Dhaka").format("DD/MM/YYYY - HH:mm:ss");
        const { threadID, messageID, senderID, body } = event;
        const name = await Users.getNameUser(senderID);
        const cmdName = module.exports.config.name;

        switch ((handleReply && handleReply.type) || "") {
            case "sendnoti": {
                let text = `${name} replied to your announcement\n\nTime: ${gio}\nReply: ${body}\n\nFrom group: ${(await Threads.getInfo(threadID)).threadName || "unknown"}`;
                if (event.attachments && event.attachments.length > 0) {
                    const atm = await getAtm(event.attachments, `${body}\n\n${name} replied to your announcement\n\nTime: ${gio}\nFrom group: ${(await Threads.getInfo(threadID)).threadName || "unknown"}`);
                    // send message with attachments
                    api.sendMessage(atm, handleReply.threadID, (err, info) => {
                        // cleanup temporary files
                        try { atmDir.forEach(each => fs.existsSync(each) && fs.unlinkSync(each)); } catch(e){}
                        atmDir = [];
                        // push handleReply object so admin can respond back (reply to this message)
                        global.client.handleReply.push({
                            name: cmdName,
                            type: "reply",
                            messageID: info.messageID,
                            messID: messageID,
                            threadID
                        });
                    });
                } else {
                    api.sendMessage(text, handleReply.threadID, (err, info) => {
                        try { atmDir.forEach(each => fs.existsSync(each) && fs.unlinkSync(each)); } catch(e){}
                        atmDir = [];
                        global.client.handleReply.push({
                            name: cmdName,
                            type: "reply",
                            messageID: info.messageID,
                            messID: messageID,
                            threadID
                        });
                    });
                }
                break;
            }

            case "reply": {
                let text = `Operator ${name} replied to you\n\nReply: ${body}\n\nReply to this message if you want to respond again.`;
                if (event.attachments && event.attachments.length > 0) {
                    const atm = await getAtm(event.attachments, `${body}\n\nOperator ${name} replied to you\n\nReply to this message if you want to respond again.`);
                    api.sendMessage(atm, handleReply.threadID, (err, info) => {
                        try { atmDir.forEach(each => fs.existsSync(each) && fs.unlinkSync(each)); } catch(e){}
                        atmDir = [];
                        global.client.handleReply.push({
                            name: cmdName,
                            type: "sendnoti",
                            messageID: info.messageID,
                            threadID: handleReply.threadID,
                            messID: handleReply.messID
                        });
                    }, handleReply.messID);
                } else {
                    api.sendMessage(text, handleReply.threadID, (err, info) => {
                        try { atmDir.forEach(each => fs.existsSync(each) && fs.unlinkSync(each)); } catch(e){}
                        atmDir = [];
                        global.client.handleReply.push({
                            name: cmdName,
                            type: "sendnoti",
                            messageID: info.messageID,
                            threadID: handleReply.threadID,
                            messID: handleReply.messID
                        });
                    }, handleReply.messID);
                }
                break;
            }

            default:
                // unknown handleReply type — ignore
                break;
        }
    } catch (err) {
        console.error("operatornoti.handleReply error:", err);
    }
};

module.exports.run = async function ({ api, event, args, Users }) {
    try {
        const moment = require("moment-timezone");
        const gio = moment.tz("Asia/Dhaka").format("DD/MM/YYYY - HH:mm:ss");
        const { threadID, messageID, senderID, messageReply } = event;

        if (!args[0]) return api.sendMessage("Please input message", threadID);

        let allThread = global.data.allThreadID || [];
        if (!Array.isArray(allThread) || allThread.length === 0) {
            return api.sendMessage("No threads found to send announcements.", threadID, messageID);
        }

        let can = 0, canNot = 0;
        const operatorName = await Users.getNameUser(senderID);

        let text = `Message from bot operators\n\nTime: ${gio}\nOperator name: ${operatorName}\nMessage: ${args.join(" ")}\n\nReply to this message if you want to respond to this announcement.`;

        // if admin replied to some message with attachments and wants to forward those attachments
        let preparedMsg = null;
        if (event.type === "message_reply" && messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
            preparedMsg = await getAtm(messageReply.attachments, text);
        }

        // Send to every saved thread id (best-effort). We keep behaviour similar to original (push handleReply for each successful send).
        for (const tid of allThread) {
            try {
                await new Promise((resSend) => {
                    const payload = preparedMsg ? preparedMsg : { body: text };
                    api.sendMessage(payload, tid, (err, info) => {
                        if (err) canNot++;
                        else {
                            can++;
                            // cleanup temporary files generated by getAtm after each send
                            try { atmDir.forEach(each => fs.existsSync(each) && fs.unlinkSync(each)); } catch(e){}
                            atmDir = [];
                            global.client.handleReply.push({
                                name: module.exports.config.name,
                                type: "sendnoti",
                                messageID: info.messageID,
                                messID: messageID,
                                threadID: tid
                            });
                        }
                        // small delay not required, resolve regardless to continue loop
                        resSend();
                    });
                });
            } catch (e) {
                console.log("operatornoti send error for thread", tid, e && e.message);
            }
        }

        return api.sendMessage(`Sent to ${can} threads, failed to send to ${canNot} threads`, threadID, messageID);
    } catch (err) {
        console.error("operatornoti.run error:", err);
        return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
    }
};