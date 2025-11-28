const fs = require('fs');
const path = require('path');

class Modifier {
    static updateConfig(key, value) {
        try {
            const configPath = path.join(__dirname, 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config[key] = value;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return { success: true, message: `Updated ${key} successfully` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static getConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            return null;
        }
    }

    static formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const h = hours % 24;
        const m = minutes % 60;
        const s = seconds % 60;

        let result = [];
        if (days > 0) result.push(`${days}d`);
        if (h > 0) result.push(`${h}h`);
        if (m > 0) result.push(`${m}m`);
        if (s > 0) result.push(`${s}s`);

        return result.join(' ') || '0s';
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    static getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static cleanText(text) {
        return text.trim().replace(/\s+/g, ' ');
    }
}

module.exports = Modifier;
