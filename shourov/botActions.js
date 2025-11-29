const axios = require('axios');

/**
 * Bot Action Functions - Handle bot profile and group modifications
 */

module.exports = {
  /**
   * Change bot's nickname in a group
   * @param {Object} api - Facebook API instance
   * @param {String} threadID - Group thread ID
   * @param {String} newName - New nickname for bot
   */
  changeBotNickname: async (api, threadID, newName) => {
    try {
      await api.changeThreadNickname(newName, threadID);
      console.log(`✅ Bot nickname changed to: ${newName}`);
      return { success: true, message: `Nickname changed to ${newName}` };
    } catch (error) {
      console.error('❌ Failed to change nickname:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Change bot's avatar/profile picture
   * @param {Object} api - Facebook API instance
   * @param {String} imageURL - URL of the new avatar image
   */
  changeBotAvatar: async (api, imageURL) => {
    try {
      const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      await api.setProfilePicture(imageBuffer);
      console.log(`✅ Bot avatar updated`);
      return { success: true, message: 'Avatar updated' };
    } catch (error) {
      console.error('❌ Failed to change avatar:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Change bot's bio/about text
   * @param {Object} api - Facebook API instance
   * @param {String} text - New bio text
   */
  changeBotBio: async (api, text) => {
    try {
      await api.setBio(text);
      console.log(`✅ Bot bio updated: ${text}`);
      return { success: true, message: `Bio updated to: ${text}` };
    } catch (error) {
      console.error('❌ Failed to change bio:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Change a group member's nickname
   * @param {Object} api - Facebook API instance
   * @param {String} threadID - Group thread ID
   * @param {String} targetUID - Target user ID
   * @param {String} nickname - New nickname
   */
  changeGroupNickname: async (api, threadID, targetUID, nickname) => {
    try {
      await api.changeNickname(nickname, threadID, targetUID);
      console.log(`✅ Member ${targetUID} nicknamed: ${nickname}`);
      return { success: true, message: `Nickname set to: ${nickname}` };
    } catch (error) {
      console.error('❌ Failed to change member nickname:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Change group's emoji reaction
   * @param {Object} api - Facebook API instance
   * @param {String} threadID - Group thread ID
   * @param {String} emoji - New emoji character
   */
  changeGroupEmoji: async (api, threadID, emoji) => {
    try {
      await api.changeThreadEmoji(emoji, threadID);
      console.log(`✅ Group emoji changed to: ${emoji}`);
      return { success: true, message: `Emoji changed to: ${emoji}` };
    } catch (error) {
      console.error('❌ Failed to change emoji:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Change group name
   * @param {Object} api - Facebook API instance
   * @param {String} threadID - Group thread ID
   * @param {String} name - New group name
   */
  changeGroupName: async (api, threadID, name) => {
    try {
      await api.setTitle(name, threadID);
      console.log(`✅ Group name changed to: ${name}`);
      return { success: true, message: `Group renamed to: ${name}` };
    } catch (error) {
      console.error('❌ Failed to change group name:', error.message);
      return { success: false, error: error.message };
    }
  }
};
