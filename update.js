const axios = require('axios');
const fs = require('fs');
const path = require('path');

class UpdateChecker {
    constructor() {
        this.versionFile = path.join(__dirname, 'version.json');
        this.currentVersion = this.getCurrentVersion();
    }

    getCurrentVersion() {
        try {
            const version = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
            return version.version;
        } catch (error) {
            return '1.0.0';
        }
    }

    async checkForUpdates() {
        try {
            console.log('Checking for updates...');
            const response = await axios.get('https://api.github.com/repos/shourov-bot/shourov-bot/releases/latest', {
                timeout: 5000
            });

            const latestVersion = response.data.tag_name.replace('v', '');
            
            if (this.compareVersions(latestVersion, this.currentVersion) > 0) {
                console.log(`\n🎉 New version available: ${latestVersion}`);
                console.log(`Current version: ${this.currentVersion}`);
                console.log(`Download: ${response.data.html_url}\n`);
                return {
                    updateAvailable: true,
                    latestVersion,
                    currentVersion: this.currentVersion,
                    downloadUrl: response.data.html_url
                };
            } else {
                console.log('✓ You are using the latest version');
                return {
                    updateAvailable: false,
                    currentVersion: this.currentVersion
                };
            }
        } catch (error) {
            return {
                updateAvailable: false,
                error: error.message
            };
        }
    }

    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
    }

    async autoUpdate() {
        const result = await this.checkForUpdates();
        if (result.updateAvailable) {
            console.log('To update, run: git pull && npm install');
        }
        return result;
    }
}

module.exports = UpdateChecker;
