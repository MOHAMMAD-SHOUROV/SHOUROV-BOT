const fs = require('fs');
const request = require('request');

module.exports.config = {
    name: "adminnoti",
    version: "1.0.1",
    permission: 2,
    credits: "shourov",
    description: "",
    prefix: true,
    category: "admin",
    usages: "[msg]",
    cooldowns: 5,
}

let atmDir = [];

/**
 * Download attachments (array of attachment objects) and return message object
 * with body and attachment streams array.
 */
const getAtm = (attachments, body) => new Promise(async (resolve) => {
    try {
        const msg = {};
        const attachmentStreams = [];

        for (const eachAtm of attachments) {
            // eachAtm should have a 'url' and ideally a filename (or fallback)
            const url = eachAtm.url || eachAtm.previewUrl || eachAtm.uri || null;
            if (!url) continue;

            await new Promise((res, rej) => {
                try {
                    const req = request.get(encodeURI(url));
                    // try to determine extension
                    req.on('response', (response) => {
                        try {
                            const pathName = response.request && response.request.uri && response.request.uri.pathname ? response.request.uri.pathname : (`file_${Date.now()}`);
                            const ext = (pathName.indexOf('.') !== -1) ? pathName.substring(pathName.lastIndexOf(".") + 1) : "jpg";
                            const filename = `adminnoti_${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
                            const path = __dirname + `/cache/${filename}`;
                            const writeStream = fs.createWriteStream(path);
                            req.pipe(writeStream);
                            writeStream.on('close', () => {
                                attachmentStreams.push(fs.createReadStream(path));
                                atmDir.push(path);
                                res();
                            });
                            writeStream.on('error', (e) => {
                                // cleanup partial file if exists
                                try { if (fs.existsSync(path)) fs.unlinkSync(path); } catch(err) {}
                                res(); // don't fail entire flow for one attachment
                            });
                        } catch (e) {
                            // ignore and continue
                            return res();
                        }
                    });
                    req.on('error', () => res());
                } catch (e) {
                    return res();
                }
            });
        }

        msg.body = body;
        if (attachmentStreams.length > 0) msg.attachment = attachmentStreams;
        resolve(msg);
    } catch (e) {
        // on error return plain msg
        resolve({ body });
    }
});

module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads, getText }) {
    const moment = require("moment-timezone");
    var gio = moment.tz("Asia/Manila").format("DD/MM/YYYY - HH:mm:s");
    const { threadID, messageID, senderID, body } = event;
    let name = await Users.getNameUser(senderID);
    try {
        switch (handleReply.type) {
            case "sendnoti": {
                let text = `${name} replied to your announce\n\ntime : ${gio}\nreply : ${body}\n\nfrom group : ${(await Threads.getInfo(threadID)).threadName || "unknown"}`;
                let msgToSend = { body: text };
                if ((event.attachments || []).length > 0) {
                    msgToSend = await getAtm(event.attachments, `${body}\n\n${name} replied to your announce\n\ntime : ${gio}\n\nfrom group : ${(await Threads.getInfo(threadID)).threadName || "unknown"}`);
                }
                api.sendMessage(msgToSend, handleReply.threadID, (err, info) => {
                    // cleanup downloaded temp files
                    atmDir.forEach(each => {
                        try { fs.unlinkSync(each); } catch (e) { }
                    });
                    atmDir = [];
                    global.client.handleReply.push({
                        name: this.config.name,
                        type: "reply",
                        messageID: info ? info.messageID : "",
                        messID: messageID,
                        threadID
                    })
                });
                break;
            }
            case "reply": {
                let text = `admin ${name} replied to you\n\nreply : ${body}\n\nreply to this message if you want to respond again.`;
                let msgToSend = { body: text };
                if ((event.attachments || []).length > 0) {
                    msgToSend = await getAtm(event.attachments, `${body}\n\n${name} replied to you\n\nreply to this message if you want to respond again.`);
                }
                api.sendMessage(msgToSend, handleReply.threadID, (err, info) => {
                    atmDir.forEach(each => {
                        try { fs.unlinkSync(each); } catch (e) { }
                    });
                    atmDir = [];
                    global.client.handleReply.push({
                        name: this.config.name,
                        type: "sendnoti",
                        messageID: info ? info.messageID : "",
                        threadID
                    })
                }, handleReply.messID);
                break;
            }
            default: break;
        }
    } catch (e) {
        console.log(e);
    }
}

module.exports.run = async function ({ api, event, args, Users }) {
    const moment = require("moment-timezone");
    var gio = moment.tz("Asia/Manila").format("DD/MM/YYYY - HH:mm:s");
    const { threadID, messageID, senderID, messageReply } = event;
    if (!args[0]) return api.sendMessage("please input message", threadID);
    let allThread = global.data.allThreadID || [];

    let can = 0, canNot = 0;

    let bodyText = `message from admins\n\ntime : ${gio}\nadmin name : ${await Users.getNameUser(senderID)}\nmessage : ${args.join(" ")}\n\nreply to this message if you want to respond from this announce.`;

    // If the admin replied to a message and that reply has attachments, prepare attachment message
    let hasReplyAttachments = (event.type == "message_reply" && messageReply && (messageReply.attachments || []).length > 0);
    let baseMsg = null;
    if (hasReplyAttachments) {
        baseMsg = await getAtm(messageReply.attachments, bodyText);
    } else {
        baseMsg = { body: bodyText };
    }

    // send to each thread sequentially to properly count success/failure
    for (const eachThread of allThread) {
        try {
            await new Promise((resolve) => {
                api.sendMessage(baseMsg, eachThread, (err, info) => {
                    if (err) {
                        canNot++;
                    } else {
                        can++;
                        // push handleReply only when send succeeded
                        global.client.handleReply.push({
                            name: this.config.name,
                            type: "sendnoti",
                            messageID: info.messageID,
                            messID: messageID,
                            threadID: eachThread
                        })
                    }
                    // cleanup files for this send (if any)
                    atmDir.forEach(each => {
                        try { fs.unlinkSync(each); } catch (e) { }
                    });
                    atmDir = [];
                    resolve();
                })
            });
        } catch (e) {
            console.log('send error to thread', eachThread, e);
            canNot++;
            // continue to next
        }
    }

    return api.sendMessage(`send to ${can} thread, not send to ${canNot} thread`, threadID);
}
