const fs = require('fs-extra');
const path = require('path');

const dir = path.join(__dirname, 'autoseen');
const pathFile = path.join(dir, 'autoseen.txt');

module.exports.config = {
  name: "autoseen",
  version: "1.0.1",
  permission: 2,
  credits: "shourov",
  description: "Turn on/off automatically mark seen when new messages arrive",
  prefix: true,
  category: "system",
  usages: "on/off",
  cooldowns: 5,
};

async function ensureFile() {
  try {
    await fs.ensureDir(dir);
    if (!await fs.pathExists(pathFile)) await fs.writeFile(pathFile, 'false', 'utf8');
  } catch (e) {
    console.error('ensureFile error:', e);
  }
}

// called on every incoming event
module.exports.handleEvent = async ({ api, event, args }) => {
  try {
    await ensureFile();
    const isEnable = (await fs.readFile(pathFile, 'utf8')).trim();
    if (isEnable === 'true') {
      // mark all as read — depends on your bot API supporting this method
      if (typeof api.markAsReadAll === 'function') {
        api.markAsReadAll(() => {});
      } else if (typeof api.markAsRead === 'function' && event.threadID) {
        // fallback: try to mark this thread as read if global not available
        try { api.markAsRead(event.threadID); } catch (e) {}
      }
    }
  } catch (err) {
    console.error('autoseen handleEvent error:', err);
  }
};

// command runner: toggle on/off
module.exports.run = async ({ api, event, args }) => {
  try {
    await ensureFile();

    const arg = (args && args[0]) ? args[0].toString().toLowerCase() : '';
    if (arg === 'on') {
      await fs.writeFile(pathFile, 'true', 'utf8');
      return api.sendMessage('✅ Autoseen enabled — new messages will be marked as seen.', event.threadID, event.messageID);
    } else if (arg === 'off') {
      await fs.writeFile(pathFile, 'false', 'utf8');
      return api.sendMessage('❌ Autoseen disabled — new messages will not be auto-seen.', event.threadID, event.messageID);
    } else {
      return api.sendMessage('Usage: /autoseen on  অথবা  /autoseen off', event.threadID, event.messageID);
    }
  } catch (e) {
    console.error('autoseen run error:', e);
    try { api.sendMessage('An error occurred while toggling autoseen.', event.threadID, event.messageID); } catch (err) {}
  }
};