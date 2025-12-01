// commands/adminnoti.js
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "adminnoti",
  version: "1.0.1",
  permission: 2,
  credits: "shourov (fixed)",
  description: "Send admin announcement to all threads and handle replies",
  prefix: true,
  category: "admin",
  usages: "[msg]",
  cooldowns: 5
};

// make loader happy if it checks cmd.name
module.exports.name = module.exports.config.name;

let atmDir = [];

/**
 * Download attachments (array) to local temp files and return message object
 * atm: array of attachment objects (should contain url & filename) OR event.attachments format
 * body: text body for message
 */
const getAtm = async (atm = [], body = "") => {
  const msg = { body };
  const attachment = [];

  for (const eachAtm of atm) {
    try {
      // try to find URL and filename robustly
      const url = eachAtm.url || eachAtm.uri || eachAtm.previewUrl || eachAtm.src || null;
      const filename = eachAtm.filename || eachAtm.name || (`file_${Date.now()}`);
      if (!url) continue;

      // download buffer
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      // determine extension from filename or url
      let ext = path.extname(filename) || path.extname(new URL(url).pathname) || '';
      if (ext && ext.startsWith('.')) ext = ext.slice(1);
      if (!ext) ext = 'dat';
      const safeName = filename.replace(/[^a-zA-Z0-9-_\.]/g, '_').slice(0, 40);
      const localPath = path.join(__dirname, 'cache', `${safeName}_${Date.now()}.${ext}`);
      await fs.ensureDir(path.dirname(localPath));
      await fs.writeFile(localPath, res.data);
      attachment.push(fs.createReadStream(localPath));
      atmDir.push(localPath);
    } catch (e) {
      console.warn('getAtm: failed to download an attachment', e && e.message ? e.message : e);
      continue;
    }
  }

  if (attachment.length) msg.attachment = attachment;
  return msg;
};

module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads, getText }) {
  try {
    const moment = require("moment-timezone");
    const gio = moment.tz("Asia/Manila").format("DD/MM/YYYY - HH:mm:ss");
    const { threadID, messageID, senderID, body } = event;
    const name = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(senderID) : senderID;

    // safe Threads.getInfo
    const getThreadInfo = async (tid) => {
      try {
        if (Threads && typeof Threads.getInfo === 'function') return await Threads.getInfo(tid);
        if (typeof api.getThreadInfo === 'function') return await api.getThreadInfo(tid);
      } catch (e) {}
      return { threadName: "unknown" };
    };

    switch (handleReply.type) {
      case "sendnoti": {
        let text = `${name} replied to your announce\n\ntime : ${gio}\nreply : ${body}\n\nfrom group : ${(await getThreadInfo(threadID)).threadName || "unknown"}`;
        let sendObj = { body: text };

        if (event.attachments && event.attachments.length > 0) {
          sendObj = await getAtm(event.attachments, `${body}\n\n${name} replied to your announce\n\ntime : ${gio}\n\nfrom group : ${(await getThreadInfo(threadID)).threadName || "unknown"}`);
        }

        api.sendMessage(sendObj, handleReply.threadID, (err, info) => {
          // cleanup downloaded attachments
          try { atmDir.forEach(each => fs.unlinkSync(each)); atmDir = []; } catch(e){}
          // register next-level reply handler (safe-guard global.client.handleReply)
          try {
            if (!global.client) global.client = {};
            if (!Array.isArray(global.client.handleReply)) global.client.handleReply = [];
            global.client.handleReply.push({
              name: this.config.name,
              type: "reply",
              messageID: info && info.messageID ? info.messageID : null,
              messID: messageID,
              threadID
            });
          } catch (e) {}
        });
        break;
      }

      case "reply": {
        let text = `Admin ${name} replied to you\n\nreply : ${body}\n\nReply to this message if you want to respond again.`;
        let sendObj = { body: text };

        if (event.attachments && event.attachments.length > 0) {
          sendObj = await getAtm(event.attachments, `${body}\n\nAdmin ${name} replied to you\n\nReply to this message if you want to respond again.`);
        }

        api.sendMessage(sendObj, handleReply.threadID, (err, info) => {
          try { atmDir.forEach(each => fs.unlinkSync(each)); atmDir = []; } catch(e){}
          try {
            if (!global.client) global.client = {};
            if (!Array.isArray(global.client.handleReply)) global.client.handleReply = [];
            global.client.handleReply.push({
              name: this.config.name,
              type: "sendnoti",
              messageID: info && info.messageID ? info.messageID : null,
              threadID
            });
          } catch (e) {}
        }, handleReply.messID);
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error('handleReply error:', e && e.stack ? e.stack : e);
  }
};

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const moment = require("moment-timezone");
    const gio = moment.tz("Asia/Manila").format("DD/MM/YYYY - HH:mm:ss");
    const { threadID, messageID, senderID, messageReply } = event;

    if (!args || args.length === 0) return api.sendMessage("❗ Please input the announcement message.", threadID);

    // allThread list from global.data
    const allThread = Array.isArray(global.data && global.data.allThreadID) ? global.data.allThreadID : [];
    if (allThread.length === 0) return api.sendMessage("⚠️ No threads available to send the announcement.", threadID);

    let can = 0, canNot = 0;

    // build base text
    const adminName = (Users && typeof Users.getNameUser === 'function') ? await Users.getNameUser(senderID) : senderID;
    const baseText = `Message from admin\n\ntime : ${gio}\nadmin name : ${adminName}\nmessage : ${args.join(" ")}\n\nReply to this message if you want to respond to this announcement.`;

    // helper to send to one thread (handles attachments)
    const sendToThread = async (tid) => {
      try {
        let sendObj = { body: baseText };

        // if this is a reply message that contains attachments, send those too
        if (event.t
