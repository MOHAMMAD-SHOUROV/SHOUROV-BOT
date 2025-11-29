/*
  utils.js
  Ready-to-use utility module for SHOUROV-BOT

  Features:
  - AES-CTR encrypt/decrypt (aes-js)
  - AES-256-CBC helper
  - download file (axios stream)
  - remove.bg helper (FormData + axios) using env keys
  - many small helpers used by the bot (GUID, convertHMS, removeSpecialChar, etc.)
  - safe error handling and Promise based API

  Usage:
  1) Place this file inside your project, e.g. "src/utils.js" or "utils/index.js"
  2) Set environment variables in .env: REMOVE_BG_KEYS (comma separated), ENC_KEY (min 32 chars)
  3) Install dependencies: npm install aes-js axios form-data uuid dotenv
  4) In your bot startup file do: global.utils = require('./path/to/utils.js');

  NOTE: This module DOES NOT hardcode API keys. Put secrets in .env and add .env to .gitignore.
*/

require('dotenv').config();
const crypto = require('crypto');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const { resolve, basename, join } = require('path');
const { writeFileSync, createReadStream, unlinkSync, promises: fsPromises, existsSync, mkdirSync } = require('fs');
const aes = require('aes-js');
const { v4: uuidv4 } = require('uuid');

const CACHE_DIR = resolve(__dirname, '..', 'shourov', 'commands', 'cache');
// ensure cache dir exists
try { mkdirSync(CACHE_DIR, { recursive: true }); } catch (e) { /* ignore */ }

const REMOVE_BG_KEYS = (process.env.REMOVE_BG_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
const ENC_KEY = process.env.ENC_KEY || process.env.SECRET_KEY || 'change_this_to_a_secure_key_min_32_chars_!';

if (ENC_KEY.length < 32) {
  console.warn('Warning: ENC_KEY is shorter than 32 characters — please set a secure 32+ byte ENC_KEY in .env');
}

// --- helpers for AES-CTR encrypt/decrypt using aes-js ---
function _sha256Buffer(key) {
  return crypto.createHash('sha256').update(String(key)).digest();
}

async function encryptState(data, key) {
  const hashKey = _sha256Buffer(key || ENC_KEY);
  const bytes = aes.utils.utf8.toBytes(typeof data === 'string' ? data : JSON.stringify(data));
  const aesCtr = new aes.ModeOfOperation.ctr(hashKey);
  const encryptedBytes = aesCtr.encrypt(bytes);
  return aes.utils.hex.fromBytes(encryptedBytes);
}

function decryptState(data, key) {
  if (!data) return null;
  const hashKey = _sha256Buffer(key || ENC_KEY);
  const encryptedBytes = aes.utils.hex.toBytes(data);
  const aesCtr = new aes.ModeOfOperation.ctr(hashKey);
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
  try {
    const text = aes.utils.utf8.fromBytes(decryptedBytes);
    try { return JSON.parse(text); } catch (e) { return text; }
  } catch (e) {
    return null;
  }
}

// --- AES-256-CBC helpers ---
const AES = {
  encrypt(cryptKey, cryptIv, plainData) {
    const keyBuf = Buffer.from(String(cryptKey));
    const ivBuf = Buffer.from(String(cryptIv));
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf);
    let encrypted = cipher.update(String(plainData), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  },
  decrypt(cryptKey, cryptIv, encryptedHex) {
    const keyBuf = Buffer.from(String(cryptKey));
    const ivBuf = Buffer.from(String(cryptIv));
    const encrypted = Buffer.from(String(encryptedHex), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf);
    let out = decipher.update(encrypted);
    out = Buffer.concat([out, decipher.final()]);
    return out.toString('utf8');
  },
  makeIv() { return crypto.randomBytes(16).toString('hex').slice(0, 16); }
};

// --- small helpers ---
function getGUID() { return uuidv4(); }

function convertHMS(value) {
  const sec = parseInt(value, 10) || 0;
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec - (hours * 3600)) / 60);
  let seconds = sec - (hours * 3600) - (minutes * 60);
  if (hours < 10) hours = '0' + hours;
  if (minutes < 10) minutes = '0' + minutes;
  if (seconds < 10) seconds = '0' + seconds;
  return (hours !== '00' ? hours + ':' : '') + minutes + ':' + seconds;
}

async function removeSpecialChar(str) {
  if (str === null || typeof str === 'undefined') return '';
  str = String(str);
  return str.replace(/[^   return str.replace(/[^\x20-\x7E]/g, '');
}

function cleanAnilistHTML(text) {
  if (!text) return text;
  return String(text)
    .replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
    .replace(/<\/?(i|em)>/g, '*')
    .replace(/<\/?b>/g, '**')
    .replace(/~!|!~/g, '||')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#039;/g, "'");
}

// --- download file (stream) ---
async function downloadFile(url, path) {
  const writer = require('fs').createWriteStream(path);
  const resp = await axios({ method: 'GET', url, responseType: 'stream', timeout: 30000 });
  resp.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(path));
    writer.on('error', reject);
  });
}

async function getContent(url) {
  try {
    const resp = await axios({ method: 'GET', url, timeout: 15000 });
    return resp.data;
  } catch (e) { return null; }
}

function randomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length || 5;
  for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
}

// --- home dir helper ---
function homeDir() {
  const home = process.env.HOME;
  const user = process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME;
  let returnHome = home || null;
  let typeSystem = process.platform || 'unknow';
  if (process.platform === 'win32') {
    returnHome = process.env.USERPROFILE || (process.env.HOMEDRIVE + process.env.HOMEPATH) || home || null;
    typeSystem = 'win32';
  } else if (process.platform === 'darwin') {
    returnHome = home || (user ? '/Users/' + user : null);
    typeSystem = 'darwin';
  } else if (process.platform === 'linux') {
    returnHome = home || (process.getuid && process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
    typeSystem = 'linux';
  }
  return [returnHome, typeSystem];
}

// --- remove background via remove.bg ---
async function removeBackground(imageUrl) {
  if (!imageUrl) throw new Error('RemoveBG: imageUrl required');
  if (!REMOVE_BG_KEYS.length) throw new Error('RemoveBG: no API keys configured (REMOVE_BG_KEYS)');

  const inPath = resolve(CACHE_DIR, `${Date.now()}-in.jpg`);
  const outPath = resolve(CACHE_DIR, `${Date.now()}-out.jpg`);
  // download
  await downloadFile(imageUrl, inPath);

  const form = new FormData();
  form.append('size', 'auto');
  form.append('image_file', createReadStream(inPath), basename(inPath));

  const key = REMOVE_BG_KEYS[Math.floor(Math.random() * REMOVE_BG_KEYS.length)];
  try {
    const resp = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: form,
      responseType: 'arraybuffer',
      headers: { ...form.getHeaders(), 'X-Api-Key': key },
      timeout: 30000
    });

    if (resp.status !== 200) {
      throw new Error('RemoveBG: non-200 response ' + resp.status);
    }

    writeFileSync(outPath, resp.data);
    try { unlinkSync(inPath); } catch (e) { /* ignore */ }
    return outPath;
  } catch (err) {
    try { unlinkSync(inPath); } catch (e) { /* ignore */ }
    throw err;
  }
}

module.exports = {
  throwError: function (command, threadID, messageID) {
    const threadSetting = (global.data && global.data.threadData) ? global.data.threadData.get(parseInt(threadID)) || {} : {};
    return global.client && global.client.api ? global.client.api.sendMessage((global.getText ? global.getText("utils", "throwError", ((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : (global.config ? global.config.PREFIX : '!')) , command) : `Error with ${command}`), threadID, messageID) : null;
  },
  getGUID,
  encryptState,
  decryptState,
  convertHMS,
  removeSpecialChar,
  cleanAnilistHTML,
  downloadFile,
  getContent,
  randomString,
  AES,
  homeDir,
  removeBackground,
  CACHE_DIR
};
