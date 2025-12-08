// say2.js — Compatible with Shourov loader
'use strict';

module.exports.config = {
    name: "say2",
    version: "1.0.1",
    permission: 0,
    credits: "shourov",
    description: "text to voice speech messages (Google TTS)",
    prefix: true,
    category: "with prefix",
    usages: "say2 [lang_code] <text>  OR reply to a message",
    cooldowns: 5,
    dependencies: {
        "path": "",
        "fs-extra": ""
    }
};

module.exports.run = async function({ api, event, args }) {
    try {
        // safe requires (works with your loader which exposes global.nodemodule)
        const fsExtra = (global.nodemodule && global.nodemodule['fs-extra']) ? global.nodemodule['fs-extra'] : require('fs-extra');
        const pathMod = (global.nodemodule && global.nodemodule['path']) ? global.nodemodule['path'] : require('path');

        const { createReadStream, unlinkSync } = fsExtra;
        const { resolve } = pathMod;

        // supported short language codes (you can extend this list)
        const SUPPORTED_LANGS = ['en','ru','ko','ja','tl','vi','fr','de','es','it','pt','zh','ar','hi'];

        // get content either from reply or args
        let content = (event.type === "message_reply" && event.messageReply && event.messageReply.body) ? event.messageReply.body : args.join(" ").trim();

        if (!content) {
            return api.sendMessage("❗ Please provide text to speak (or reply to a message).", event.threadID, event.messageID);
        }

        // detect language code at start: e.g. "en Hello world"
        let languageToSay = (global.config && global.config.language) ? String(global.config.language) : 'en';
        let msg = content;

        // If first token is a supported lang code, use it
        const firstToken = content.split(/\s+/)[0].toLowerCase();
        if (SUPPORTED_LANGS.includes(firstToken)) {
            languageToSay = firstToken;
            msg = content.split(/\s+/).slice(1).join(' ').trim();
            if (!msg) return api.sendMessage("❗ No text provided after language code.", event.threadID, event.messageID);
        }

        // safety: limit length (Google TTS URL has limits). If very long, truncate and notify
        const MAX_CHARS = 200; // conservative — you can increase if you host other TTS
        if (msg.length > MAX_CHARS) {
            msg = msg.slice(0, MAX_CHARS) + '...';
        }

        // build path for temp file
        const outPath = resolve(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);

        // ensure utils.downloadFile is present (your loader usually provides it). If not, fallback to request.
        if (global.utils && typeof global.utils.downloadFile === 'function') {
            // Google TTS endpoint
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${encodeURIComponent(languageToSay)}&client=tw-ob`;
            await global.utils.downloadFile(ttsUrl, outPath);
        } else {
            // fallback download using https
            const https = require('https');
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${encodeURIComponent(languageToSay)}&client=tw-ob`;
            await new Promise((resolvePromise, rejectPromise) => {
                const file = fsExtra.createWriteStream(outPath);
                https.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Node.js)'
                    }
                }, (res) => {
                    if (res.statusCode !== 200) {
                        return rejectPromise(new Error(`TTS request failed with status ${res.statusCode}`));
                    }
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close(resolvePromise);
                    });
                }).on('error', (err) => {
                    try { fsExtra.removeSync(outPath); } catch(e) {}
                    rejectPromise(err);
                });
            });
        }

        // send audio and cleanup
        return api.sendMessage({ attachment: createReadStream(outPath) }, event.threadID, () => {
            try { unlinkSync(outPath); } catch (e) {}
        }, event.messageID);

    } catch (err) {
        console.error('say2 error:', err);
        return api.sendMessage("❌ Failed to generate TTS: " + (err.message || err), event.threadID, event.messageID);
    }
};