const axios = require('axios');

module.exports = {
    config: {
        name: 'currency',
        aliases: ['convert', 'exchange'],
        role: 0,
        description: 'Convert currency'
    },
    run: async ({ api, event, args }) => {
        if (args.length < 3) {
            return api.sendMessage('❌ Usage: /currency <amount> <from> <to>\nExample: /currency 100 USD EUR\nCommon: USD, EUR, GBP, JPY, CNY, INR', event.threadID);
        }

        const amount = parseFloat(args[0]);
        const from = args[1].toUpperCase();
        const to = args[2].toUpperCase();
        
        if (isNaN(amount)) {
            return api.sendMessage('❌ Please provide a valid amount!', event.threadID);
        }

        api.sendMessage('💱 Converting currency...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`, {
                    timeout: 10000
                });

                if (response.data && response.data.rates && response.data.rates[to]) {
                    const rate = response.data.rates[to];
                    const result = (amount * rate).toFixed(2);
                    
                    api.editMessage(`💱 Currency Conversion\n\n💵 ${amount} ${from}\n=\n💶 ${result} ${to}\n\n📊 Rate: 1 ${from} = ${rate.toFixed(4)} ${to}`, info.messageID);
                } else {
                    api.editMessage('❌ Invalid currency code!', info.messageID);
                }
            } catch (error) {
                console.error('Currency error:', error.message);
                api.editMessage('❌ Failed to convert currency. Please check the currency codes.', info.messageID);
            }
        });
    }
};
