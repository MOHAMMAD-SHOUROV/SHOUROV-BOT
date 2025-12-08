'use strict';

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const MAIN_ADMIN_ID = "100071971474157"; 

module.exports.config = {
  name: "resend",
  version: "2.0.0",
  permission: 1,
  credits: "shourov",
  description: "Store messages in-group and allow admins to resend them to main admin by replying",
  category: "general",
  prefix: true,
  usages: "resend (toggle)",
  cooldowns: 0,
  hide: true,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

// In-memory store for captured messages (messageID -> { msgBody, attachments: [ {url, filename} ] , senderID })
global._resendStore = global._resendStore || new Map();

// Helper: download buffer & save file; returns file path
async function downloadAttachmentToCache(url, filenameHint = 'file') {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    // try to get extension from url first
    let ext = path.extname(new URL(url).pathname).split('.').pop();
    if (!ext || ext.length > 6) {
      // fallback to content-type
      const ctype = (res.headers && res.headers['content-type']) || '';
      if (ctype.includes('/')) ext = ctype.split('/').pop().split(';')[0];
      else ext = 'bin';
    }
    const fname = `${filenameHint.replace(/[^a-z0-9_\-]/gi,'') || 'resend'}_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
    const outPath = path.join(__dirname, 'cache', fname);
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, Buffer.from(res.data));
    return outPath;
  } catch (e) {
    // on error return null so caller can skip
    console.error('downloadAttachmentToCache error', e && e.message);
    return null;
  }
}

/**
 * run - toggle resend mode for this thread
 * Usage: /resend  -> toggles on/off in thread data
 */
module.exports.run = async function({ api, event, Threads }) {
  try {
    const { threadID, messageID, senderID } = event;
    const threadNumeric = parseInt(threadID);

    const threadDataObj = (await Threads.getData(threadNumeric))?.data || {};
    // toggle flag
    threadDataObj.resend = !(threadDataObj.resend === true);
    await Threads.setData(threadNumeric, { data: threadDataObj });

    // keep global.cache consistent
    if (global.data && Array.isArray(global.data.threadData)) {
      try { global.data.threadData.set(threadNumeric, threadDataObj); } catch(e){/* ignore */ }
    }

    const status = threadDataObj.resend ? 'ON' : 'OFF';
    return api.sendMessage(`Resend mode is now: ${status}`, threadID, messageID);
  } catch (err) {
    console.error('resend.run error', err);
    return api.sendMessage(`Error toggling resend: ${err.message}`, event.threadID, event.messageID);
  }
};

/**
 * handleEvent - capture messages when thread's resend mode is ON
 * - when a normal message arrives (text or attachments) and resend is enabled, we store it in global._resendStore keyed by its messageID
 * - when an ADMIN (owner or any configured admin) replies to a stored message, the bot will compile stored contents and forward to MAIN_ADMIN_ID
 *
 * NOTE: This choice (reply-to-original-message to trigger forward) is compatible with many moderation flows.
 */
module.exports.handleEvent = async function({ api, event, Threads, Users }) {
  try {
    const { threadID, messageID, senderID, body, attachments = [], messageReply, type } = event;
    const threadNumeric = parseInt(threadID);
    // fetch thread data to see if resend mode is enabled
    const threadData = (await Threads.getData(threadNumeric))?.data || {};

    // 1) If ordinary message and resend enabled -> store it
    if (type === 'message' || type === 'message_reply' || type === undefined) {
      if (threadData.resend === true) {
        // ignore messages from the bot itself
        const currentBotId = (api && typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : (global.config && global.config.ownerId) || null;
        if (String(senderID) === String(currentBotId)) return;

        // prepare attachments info
        const attachList = (Array.isArray(attachments) ? attachments : []).map(att => {
          return { url: att.url || att.href || att.previewUrl || att.image || null, type: att.type || att.mimeType || 'file' };
        }).filter(a => a.url);

        global._resendStore.set(messageID, {
          msgBody: body || '',
          attachments: attachList,
          senderID,
          threadID
        });

        // (optional) Notify admins in-thread that this message was stored and can be forwarded by replying
        // We keep it minimal to avoid spam.
        return; // done storing
      }
    }

    // 2) If this event is a reply to an earlier message, and the original message is in our store,
    //    and the replier is an admin/owner -> forward stored message to MAIN_ADMIN_ID
    if (messageReply && messageReply.messageID) {
      const originalId = messageReply.messageID;
      if (!global._resendStore.has(originalId)) return;

      // Check permission: only owner or bot admins can trigger the forward
      const adminsList = (global.config && (global.config.admins || global.config.ADMINBOT)) || [];
      const ownerId = (global.config && (global.config.ownerId || global.config.OWNER)) || null;
      const isAdmin = String(senderID) === String(ownerId) || (Array.isArray(adminsList) && adminsList.some(x => String(x) === String(senderID)));

      if (!isAdmin) return; // only admins/owner can forward stored messages

      const stored = global._resendStore.get(originalId);
      if (!stored) return;

      // Build message body
      const senderName = await (async () => {
        try {
          if (Users && typeof Users.getNameUser === 'function') return await Users.getNameUser(stored.senderID);
          // fallback: try api.getUserInfo
          if (api && typeof api.getUserInfo === 'function') {
            const info = await api.getUserInfo(stored.senderID);
            return (info && info[stored.senderID] && info[stored.senderID].name) || `User ${stored.senderID}`;
          }
        } catch (e) { /* ignore */ }
        return `User ${stored.senderID}`;
      })();

      const header = `==== Resend Notification ==== \nFrom: ${senderName} (ID: ${stored.senderID})\nGroup ID: ${stored.threadID}\n\n`;
      const content = stored.msgBody ? `Message:\n${stored.msgBody}\n\n` : '';
      let sendObj = { body: header + content + `Forwarded by: ${await (Users.getNameUser ? Users.getNameUser(senderID) : senderID)}` , attachment: [] };

      // download attachments into cache and attach
      const tmpFiles = [];
      try {
        for (let i=0;i< (stored.attachments||[]).length; i++) {
          const a = stored.attachments[i];
          if (!a.url) continue;
          const filePath = await downloadAttachmentToCache(a.url, 'resend_attach');
          if (filePath) {
            tmpFiles.push(filePath);
            sendObj.attachment.push(fs.createReadStream(filePath));
          }
        }
      } catch (e) {
        console.error('resend: download attachments failed', e && e.message);
      }

      // send to MAIN_ADMIN_ID
      try {
        await api.sendMessage(sendObj, MAIN_ADMIN_ID);
      } catch (e) {
        console.error('resend: api.sendMessage to MAIN_ADMIN_ID failed', e && e.message);
        // attempt to notify in-thread about failure
        await api.sendMessage(`⚠ Failed to forward stored message to main admin: ${e.message}`, threadID);
      }

      // cleanup temp files
      try {
        for (const f of tmpFiles) {
          if (await fs.pathExists(f)) await fs.unlink(f);
        }
      } catch (e) { /* ignore cleanup errors */ }

      // optional: remove the stored original message after forwarding (comment/uncomment as desired)
      // global._resendStore.delete(originalId);

      // notify in-thread that forward was successful
      return api.sendMessage(`✅ Stored message forwarded to admin.`, threadID);
    }

  } catch (err) {
    console.error('resend.handleEvent error', err && err.stack || err);
  }
};