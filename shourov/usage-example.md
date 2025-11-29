# System Files Usage Guide

## Using botActions.js in Commands

```javascript
const botActions = require('../botActions');

module.exports = {
    config: { name: 'renamedme', role: 1, description: 'Rename bot' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /renamedme <newname>', event.threadID);
        const result = await botActions.changeBotNickname(api, event.threadID, args.join(' '));
        api.sendMessage(result.message, event.threadID);
    }
};
```

## Using autoReport.js in Commands

```javascript
const autoReport = require('../autoReport');

module.exports = {
    config: { name: 'report', role: 0, description: 'Report user' },
    run: async ({ api, event, args }) => {
        if (args.length < 2) return api.sendMessage('❌ Usage: /report <uid> <reason>', event.threadID);
        const result = await autoReport.reportProfile(args[0], args[1]);
        api.sendMessage(result.success ? `✅ Reported` : `❌ ${result.error}`, event.threadID);
    }
};
```

## Checking botControl.json

```javascript
const botControl = require('../../botControl.json');

if (botControl.botLocked) {
    return api.sendMessage('🔒 Bot is locked', event.threadID);
}
```

