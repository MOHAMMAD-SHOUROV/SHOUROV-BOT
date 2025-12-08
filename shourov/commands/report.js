'use strict';

module.exports.config = {
  name: "report",
  version: "1.0.1",
  permission: 0,
  credits: "shourov",
  description: "Send report/feedback to bot admins and allow admin replies",
  prefix: false,
  category: "example",
  usages: "report <text>  (or reply media + report)",
  cooldowns: 5,
  dependencies: {}
};

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

async function downloadAttachment(att, destDir) {
  try {
    const buffer = (await axios.get(encodeURI(att.url), { responseType: 'arraybuffer' })).data;
    // choose extension by type
    let ext = 'bin';
    if (att.type === 'photo') ext = 'jpg';
    else if (att.type === 'video') ext = 'mp4';
    else if (att.type === 'audio') ext = 'mp3';
    else if (att.type === 'animated_image') ext = 'gif';
    // unique filename
    const name = `report_${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
    await fs.ensureDir(destDir);
    const filePath = path.join(destDir, name);
    await fs.writeFile(filePath, Buffer.from(buffer));
    return filePath;
  } catch (e) {
    console.error('downloadAttachment error', e && e.message);
    return null;
  }
}

module.exports.handleReply = async function({ api, event, handleReply, Users, Threads }) {
  try {
    const senderID = event.senderID;
    const name = (await Users.getData(senderID)).name || `User ${senderID}`;
    const fsCache = path.join(__dirname, 'cache');
    const attachmentsPaths = [];
    const attachmentStreams = [];

    // download any attachments in this reply (if present)
    if (Array.isArray(event.attachments) && event.attachments.length > 0) {
      for (const p of event.attachments) {
        const fp = await downloadAttachment(p, fsCache);
        if (fp) {
          attachmentsPaths.push(fp);
          attachmentStreams.push(fs.createReadStream(fp));
        }
      }
    }

    switch (handleReply.type) {
      case "reply": {
        // user replied to the bot prompt earlier -> forward to admins
        const adminList = global.config.ADMINBOT || [];
        const content = event.body && event.body.length ? event.body : "There is no text content";

        if (attachmentStreams.length === 0) {
          for (const ad of adminList) {
            api.sendMessage({
              body: `[📲] Feedback from ${name} :\n\n[💬] Content: ${content}`,
              mentions: [{ id: senderID, tag: name }]
            }, ad, (e, info) => {
              global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                messID: event.messageID,
                author: event.senderID,
                id: event.threadID,
                type: "calladmin"
              });
            });
          }
        } else {
          for (const ad of adminList) {
            api.sendMessage({
              body: `[📲] Feedback from ${name} :\n\n[💬] Content: ${content}`,
              attachment: attachmentStreams,
              mentions: [{ id: senderID, tag: name }]
            }, ad, (e, info) => {
              global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                messID: event.messageID,
                author: event.senderID,
                id: event.threadID,
                type: "calladmin"
              });
            });
          }
        }

        // cleanup
        for (const f of attachmentsPaths) {
          try { await fs.unlink(f); } catch(e) { }
        }
        break;
      }

      case "calladmin": {
        // admin replied back to the forwarded message -> send back to original thread/user
        const originThreadID = handleReply.id; // thread id where original report came from
        const content = event.body && event.body.length ? event.body : "no reply 🌸";
        const mention = [{ tag: name, id: event.senderID }];

        if (attachmentStreams.length === 0) {
          api.sendMessage({
            body: `[📌] Feedback from admin ${name} to you:\n\n[💬] Content: ${content}`,
            mentions: mention
          }, originThreadID, (e, data) => {
            global.client.handleReply.push({
              name: this.config.name,
              author: event.senderID,
              messageID: data.messageID,
              type: "reply"
            });
          }, handleReply.messID);
        } else {
          api.sendMessage({
            body: `[📌] Feedback from admin ${name} to you:\n\n[💬] Content: ${content}\n[📌] Admin attached files:`,
            attachment: attachmentStreams,
            mentions: mention
          }, originThreadID, (e, data) => {
            global.client.handleReply.push({
              name: this.config.name,
              author: event.senderID,
              messageID: data.messageID,
              type: "reply"
            });
          }, handleReply.messID);
        }

        // cleanup
        for (const f of attachmentsPaths) {
          try { await fs.unlink(f); } catch(e) { }
        }
        break;
      }
    }
  } catch (ex) {
    console.log('handleReply exception:', ex && ex.stack || ex);
  }
};

module.exports.run = async function({ api, event, Threads, args, Users }) {
  try {
    const fsCache = path.join(__dirname, 'cache');
    const senderID = event.senderID;
    const name = (await Users.getData(senderID)).name || `User ${senderID}`;

    // collect attachments (either from messageReply or current message)
    let attachments = [];
    if (event.messageReply && Array.isArray(event.messageReply.attachments) && event.messageReply.attachments.length > 0) {
      attachments = event.messageReply.attachments;
    }

    const attachmentPaths = [];
    const attachmentStreams = [];

    if (attachments.length > 0) {
      for (const p of attachments) {
        const fp = await downloadAttachment(p, fsCache);
        if (fp) {
          attachmentPaths.push(fp);
          attachmentStreams.push(fs.createReadStream(fp));
        }
      }
    }

    // ensure there is at least text or attachment
    if ((!args || args.length === 0) && attachmentStreams.length === 0) {
      // no report content
      return api.sendMessage("You haven't entered what to report 📋", event.threadID, event.messageID);
    }

    const datathread = (await Threads.getData(event.threadID)).threadInfo || {};
    const namethread = datathread.threadName || "Unknown";
    const uid = senderID;
    const gio = moment.tz("Asia/Dhaka").format("HH:mm:ss D/MM/YYYY");
    const adminList = global.config.ADMINBOT || [];
    const adminCount = adminList.length;

    // notify user that report is sent
    await api.sendMessage(`[🤖] - Bot has just successfully sent your message to ${adminCount} Admin(s) 🍄\n[⏰] - Time: ${gio}`, event.threadID);

    // prepare message to admins
    const bodyToAdmins = (attachmentStreams.length === 0)
      ? `📱[ CALL ADMIN ]📱\n\n[👤] Report from: ${name}\n[❗] ID User: ${uid}\n[🗣️] BOX: ${namethread}\n[🔰] ID BOX: ${event.threadID}\n\n[💌] Inbox: ${args.join(" ")}\n[⏰] Time: ${gio}`
      : `📱[ CALL ADMIN ]📱\n\n[👤] Report from: ${name}\n[❗] ID User: ${uid}\n[🗣️] BOX: ${namethread}\n[🔰] ID BOX: ${event.threadID}\n\n[💌] Inbox: ${(args.join(" ")) || "only files (no text)"}\n[⏰] Time: ${gio}\n[📌] Attachments included`;

    // send to each admin and register handleReply so admin can reply back to the original group
    for (const ad of adminList) {
      await new Promise(resolve => {
        api.sendMessage({
          body: bodyToAdmins,
          attachment: attachmentStreams.length > 0 ? attachmentStreams : undefined,
          mentions: [{ id: senderID, tag: name }]
        }, ad, (error, info) => {
          // push handleReply so admin's reply goes back to original thread
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            messID: event.messageID,
            id: event.threadID,
            type: "calladmin"
          });
          resolve();
        });
      });
    }

    // cleanup files we downloaded
    for (const f of attachmentPaths) {
      try { await fs.unlink(f); } catch (e) { }
    }

  } catch (ex) {
    console.log('report.run exception:', ex && ex.stack || ex);
  }
};