# SHOUROV-BOT Documentation

## Overview
**SHOUROV-BOT** is a full-featured Facebook Messenger chatbot built with Node.js.

- **Bot Name**: SHOUROV-BOT
- **Prefix**: `/`
- **Author**: ALIHSAN SHOUROV
- **Owner UID**: 100071971474157

## Project Structure
```
.
├── index.js                 # Main entry point
├── config.json              # Bot configuration
├── fbstate.json            # Facebook session state
├── package.json            # NPM dependencies
├── version.json            # Version information
├── shourov.md              # This documentation
├── modifier.js             # Utility functions
├── update.js               # Update checker
├── replit.nix              # Replit environment config
├── server/
│   └── uptime.js           # Express keep-alive server
└── shourov/
    ├── loader.js           # Command & event loader
    ├── events/             # Event handlers
    │   ├── message.js      # Message dispatcher
    │   ├── antibotname.js  # Prevent bot name changes
    │   ├── antichangeinfogroup.js  # Prevent group info changes
    │   ├── antiout.js      # Auto re-add leaving users
    │   ├── join.js         # Welcome new members
    │   ├── leave.js        # Goodbye messages
    │   └── logs.js         # Event logging
    └── commands/           # Bot commands (29 total)
        ├── ping.js
        ├── help.js
        ├── about.js
        ├── ai.js
        └── ... (25 more)
```

## Features

### Role System
- **0** = Normal User
- **1** = Admin
- **2** = Owner

### Commands (29 total)
1. `/ping` - Check bot latency
2. `/help` - List all commands
3. `/about` - Bot information
4. `/ai` - AI chat
5. `/fbdl` - Facebook video downloader
6. `/ytmp4` - YouTube MP4 downloader
7. `/ytmp3` - YouTube MP3 downloader
8. `/userinfo` - User profile info
9. `/groupinfo` - Group analytics
10. `/ban` - Ban system (add/remove/list)
11. `/aiimg` - AI image generator
12. `/gpt` - GPT AI chat
13. `/lyrics` - Song lyrics search
14. `/stalk` - Facebook user stalker
15. `/ss` - Website screenshot
16. `/anime` - Random anime image
17. `/meme` - Random meme
18. `/weather` - City weather
19. `/calc` - Calculator
20. `/reminder` - Reminder system
21. `/short` - URL shortener
22. `/translate` - Language translator
23. `/currency` - Currency converter
24. `/hack` - Fun fake hacking
25. `/love` - Love percentage
26. `/rank` - Group message ranking
27. `/tts` - Text to speech
28. `/wiki` - Wikipedia search
29. `/uptime` - Bot uptime

### Event Handlers
- **message.js**: Main command dispatcher
- **antibotname.js**: Prevent unauthorized bot name changes
- **antichangeinfogroup.js**: Prevent group info modifications
- **antiout.js**: Auto re-add users who leave
- **join.js**: Welcome messages for new members
- **leave.js**: Goodbye messages
- **logs.js**: Event logging

## Security
- Author protection: Bot exits if `config.author !== "ALIHSAN SHOUROV"`
- Owner protection: Bot exits if `config.ownerId !== "100071971474157"`
- Only owner UID can use admin/owner commands

## Deployment
- **Render**: Use `npm start` command
- **GitHub Actions**: Automated CI/CD workflow
- **Express Server**: Keep-alive endpoint on port 3000

## Installation
```bash
npm install
npm start
```

## Configuration
Edit `config.json` to customize bot settings (DO NOT change author or ownerId).

## Recent Changes
- 2025-11-22: Initial project creation
