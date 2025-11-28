# SHOUROV-BOT

## Overview

SHOUROV-BOT is a Facebook Messenger chatbot built with Node.js that provides automated responses, utility commands, and group management features. The bot uses the facebook-chat-api library to interact with Facebook Messenger and includes 29+ commands ranging from media downloads to AI interactions, weather information, and group moderation tools.

The bot features a role-based permission system (Owner, Admin, User), automatic event handling (join/leave messages, anti-modification protections), and maintains uptime through an Express server suitable for deployment on platforms like Render or Replit.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Command System Architecture

**Problem**: Need a scalable, modular way to handle multiple bot commands without cluttering the main entry point.

**Solution**: Plugin-based command loader that dynamically loads commands from the `shourov/commands/` directory. Each command is a self-contained module with configuration metadata (name, aliases, role permissions, description) and a run function.

**Pros**:
- Easy to add new commands without modifying core code
- Each command is isolated and maintainable
- Supports command aliases for user convenience
- Role-based access control built into each command

**Cons**:
- Requires consistent module structure across all commands
- No hot-reloading (requires restart to load new commands)

### Event-Driven Architecture

**Problem**: Need to respond to various Facebook Messenger events (joins, leaves, name changes, etc.) in addition to text commands.

**Solution**: Event handler system that loads event modules from `shourov/events/`. Events are processed through a central dispatcher (`message.js`) that routes to appropriate handlers.

**Key Events**:
- `message.js` - Command dispatcher and message routing
- `join.js` / `leave.js` - Welcome/goodbye messages
- `antibotname.js` / `antichangeinfogroup.js` / `antiout.js` - Group protection mechanisms
- `logs.js` - Event logging and monitoring

**Pros**:
- Separation of concerns between command and event handling
- Modular event handlers
- Can enable/disable features by removing event files

**Cons**:
- Some events may conflict if not carefully designed
- Event handler errors can break the event loop

### Authentication & Authorization

**Problem**: Protect bot functionality and prevent unauthorized configuration changes.

**Solution**: Multi-layered protection system:

1. **Hard-coded author protection** - Bot refuses to start if `config.author` or `config.ownerId` are modified
2. **Role-based permissions** - Three-tier system (0=User, 1=Admin, 2=Owner)
3. **Ban system** - Persistent ban list stored in `banlist.json` to block specific users

**Rationale**: Author protection prevents credit removal/rebranding. Role system allows delegation of administrative tasks while maintaining owner control.

**Alternatives Considered**: Database-backed user management (rejected due to complexity for this scale).

### Session Management

**Problem**: Maintain persistent Facebook Messenger connection without manual re-authentication.

**Solution**: Session state persistence using `fbstate.json` containing Facebook session cookies. The bot reads this file on startup to authenticate with Facebook.

**Pros**:
- No need to provide username/password in code
- Session persists across bot restarts
- Easy to update credentials (just replace file contents)

**Cons**:
- Session tokens can expire, requiring manual refresh
- Security risk if file is exposed (contains authentication tokens)

### Uptime Server

**Problem**: Many hosting platforms (Render, Replit) put inactive processes to sleep. Need to keep bot alive.

**Solution**: Express HTTP server running on configurable port (default 3000) that responds to health checks with bot status information.

**Pros**:
- Prevents hosting platform from sleeping the process
- Provides web-based status page showing uptime, memory usage, bot info
- Can be pinged by external monitoring services

**Cons**:
- Consumes additional resources (minimal)
- Exposes bot presence on the network

### Data Persistence

**Problem**: Store bot configuration, ban lists, rankings, and other stateful data.

**Solution**: JSON file-based storage for simplicity:
- `config.json` - Bot settings and owner information
- `fbstate.json` - Facebook session cookies
- `banlist.json` - List of banned user IDs
- `rankings.json` - Per-group message ranking data
- `version.json` - Version tracking for update checker

**Rationale**: For a single-instance bot with moderate data needs, JSON files provide adequate persistence without database overhead.

**Alternatives Considered**: SQLite or MongoDB (rejected as over-engineering for current scale).

**Pros**:
- Zero external dependencies
- Human-readable and editable
- Simple backup/restore (copy files)

**Cons**:
- Not suitable for high-concurrency writes
- No ACID guarantees
- Manual file locking needed for race conditions
- Scalability limitations

### Bot Control & System Files

**Problem**: Need centralized control over bot behavior and provide reusable action functions.

**Solution**: Three-tier system file architecture:

1. **botControl.json** - Master control configuration
   - Owner and admin/operator lists
   - Bot lock status
   - Nickname/profile change protection flags
   - Centralized authorization source

2. **botActions.js** - Bot modification functions
   - `changeBotNickname(api, threadID, newName)` - Rename bot in groups
   - `changeBotAvatar(api, imageURL)` - Update bot profile picture
   - `changeBotBio(api, text)` - Change bot's bio/about text
   - `changeGroupNickname(api, threadID, targetUID, nickname)` - Rename group members
   - `changeGroupEmoji(api, threadID, emoji)` - Set group reaction emoji
   - `changeGroupName(api, threadID, name)` - Rename groups
   - All wrapped with try-catch error handling and logging

3. **autoReport.js** - Automated reporting system
   - `reportProfile(profileID, reasonCode)` - Report user profiles
   - `reportPost(postID, reasonCode)` - Report posts
   - `reportComment(commentID, reasonCode)` - Report comments
   - Preset report reason mappings (SPAM, HARASSMENT, etc.)
   - Standardized response format with report IDs and status tracking

**Pros**:
- Centralized control and management
- Reusable across all commands
- Type-safe with error handling
- Logging for audit trails
- Easy to extend with new functions

### Utility Architecture

**Problem**: Need reusable helper functions across commands and core bot.

**Solution**: `modifier.js` module providing common utilities:
- Configuration updates
- Uptime formatting
- Byte formatting for memory display

**Pros**:
- DRY (Don't Repeat Yourself) principle
- Consistent formatting across bot
- Centralized config management

## Command System Update

**Latest Expansion (November 2025):**
- Total commands: **332+ fully implemented commands**
- Coverage: Complete A-Z command set
- Categories: Admin tools, social features, games, utilities, media, info tools, settings, and entertainment
- All commands follow standardized module pattern with role-based permissions
- Integration ready with botActions.js and autoReport.js system files

**Key Command Categories:**
- Moderation: ban, unban, kick, warning, spamban
- Group Management: groupadmin, groupname, groupemoji, setname, setprefix
- Admin Tools: load, reload, restart, shell, system, config
- Social & Fun: marry, hug, kiss, slap, punch, wasted, rip
- Utilities: search, translate, password, random, math, calculate
- Media: video, music, youtube, pinterest, removebg, screenshot
- Info: wiki, weather, info, status, about, owner
- Games: tictactoe, quiz, slot, fish, petmonsters

## External Dependencies

### Facebook Integration

- **facebook-chat-api** (v1.7.0): Unofficial Facebook Messenger API client. Provides authentication, message sending/receiving, and event listening via MQTT protocol. This is the core dependency enabling all Facebook interactions.

### HTTP Server & Client

- **express** (v4.18.2): Web framework for the uptime server. Minimal usage - serves a single status page endpoint.

- **axios** (v1.6.2): HTTP client for making API requests to external services. Used across multiple commands for fetching data.

### Third-Party APIs

The bot integrates with numerous external APIs without authentication:

- **affiliateplus.xyz** - AI chatbot (GPT), Facebook video downloader, YouTube downloader endpoints
- **pollinations.ai** - AI image generation
- **waifu.pics** - Anime image provider
- **exchangerate-api.com** - Currency conversion rates
- **meme-api.com** - Reddit meme aggregation
- **wttr.in** - Weather information (JSON format)
- **translate.google.com** - Text-to-speech generation
- **mymemory.translated.net** - Language translation
- **wikipedia.org** (REST API) - Wikipedia article summaries
- **tinyurl.com** - URL shortening service
- **screenshotmachine.com** - Website screenshot capture
- **lyrics.ovh** - Song lyrics database

**Risk Assessment**: Heavy reliance on free third-party APIs without authentication. If any service goes down or changes endpoints, related commands will break. No fallback APIs configured.

**Recommendation for Future**: Implement API response caching and fallback providers for critical features.

### Runtime Environment

- **Node.js**: JavaScript runtime (version specified in replit.nix if present)
- **NPM**: Package manager for dependency installation

No database, cloud storage, or message queue systems are currently used.