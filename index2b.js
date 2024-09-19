const ccxt = require('ccxt');
const { chunk } = require('lodash'); // Correct way to import lodash chunk

module.exports = {
    ...require('./indicators/input.js'),
    ...require('./indicators/rsi.js'),
    ...require('./indicators/roc.js'),
};

const signalsConfig = [
    {
        name: 'bot1',
        interval: '1h',
        backtrack: 10,
        direction: 'short',
        indicators: {
            rsi_6: 70,
            roc_10: 2,
        }
    },
    {
        name: 'bot2',
        interval: '1h',
        backtrack: 1,
        direction: 'long',
        indicators: {
            rsi_6: 30,
            roc_10: 1,
            rsi_14: 12
        }
    },
    {
        name: 'bot3',
        interval: '1h',
        backtrack: 1,
        direction: 'long',
        indicators: {
            rsi_6: 10,
            roc_10: 15,
            rsi_14: 12
        }
    }
];

const exchangeId = process.argv[2];
const interval = process.argv[3] || '1h';

// Function to fetch all tickers
const fetchAllTickers = async (exchangeId) => {
    try {
        const exchange = new ccxt[exchangeId]({
            options: { defaultType: 'swap' } // For perpetual contracts
        });
        await exchange.loadMarkets(); // Load all markets (available symbols)
        const tickers = await exchange.fetchTickers(); // Fetch all tickers
        return Object.keys(tickers); // Return only the symbol names
    } catch (error) {
        console.error(`Error fetching tickers from ${exchangeId}:`, error.message);
        return [];
    }
};

// Function to get OHLCV and calculate indicators
const calculateIndicators = async (symbol, config) => {
    const { interval, indicators, name, backtrack } = config;

    try {
        const ohlcvData = await module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, interval, true);

        if (!ohlcvData || !ohlcvData.input) {
            throw new Error(`No OHLCV data available for ${symbol}`);
        }

        const { input } = ohlcvData;

        if (!input.every(candle => candle.close !== undefined && candle.high !== undefined && candle.low !== undefined)) {
            throw new Error(`Invalid OHLCV data format for ${symbol}`);
        }

        const results = {};

        for (const indicator of Object.entries(indicators)) {
            const [type, length] = indicator[0].split('_');
            if (type === 'rsi') {
            results[indicator[0]] = await module.exports.rsi(parseInt(length), 'close', input);
            } else if (type === 'roc') {
            const rocValues = await module.exports.roc(parseInt(length), 'close', input);
            results[indicator[0]] = rocValues.map(value => parseFloat(value.toFixed(2)));
            }
        }

        const closes = input.close;

        const signals = [];
        let counter = 1;

        for (closes.length; counter <= backtrack; counter++) {
            const lastClose = closes[closes.length - counter];
            const highest = input.high[input.high.length - counter];
            const lowest = input.low[input.low.length - counter];

            if (results.rsi_6 && results.roc_10) {
            const lastRsi6 = results.rsi_6[results.rsi_6.length - counter];
            const lastRoc10 = results.roc_10[results.roc_10.length - counter];

            let indicator = { "rsi_6": lastRsi6, "roc_10": lastRoc10 };

            const criteriaMet = Object.entries(indicators).every(([key, value]) => {
                const [type] = key.split('_');
                const indicatorValue = results[key][results[key].length - counter];

                //Checking rsi_6 with value 30 and indicatorValue 65.93 for symbol LQTY/USDT
                console.log(`Checking ${key} with value ${value} and indicatorValue ${indicatorValue} for symbol ${symbol}`);

                if (type === 'rsi') {
                return config.direction === 'long' ? indicatorValue < value : indicatorValue > value;
                } else if (type === 'roc') {
                return config.direction === 'long' ? indicatorValue < value : indicatorValue > value;
                }
                return false;
            });

            if (criteriaMet) {
                signals.push({
                symbol,
                interval: interval,
                time: new Date().toLocaleString('en-GB', { hour12: false }),
                price: lastClose,
                highest,
                lowest,
                indicator,
                direction: config.direction
                });
            }
            }
        }

        // Limit results by backtrack
        const limitedResults = {};
        for (const [key, values] of Object.entries(results)) {
            limitedResults[key] = values.slice(-backtrack);
        }

        // console.log(`Results for ${symbol}:`, limitedResults);

        return {
            symbol,
            indicators: limitedResults,
            signals
        };

    } catch (error) {
        console.error(`Error calculating indicators for ${symbol}:`, error.message);
        return null;
    }
};

// Function to run concurrent tasks
async function runConcurrentTasks(chunk, config) {
    try {
        const promises = chunk.map(symbol => {
            return calculateIndicators(symbol, config);
        });

        const results = await Promise.all(promises);

        const signals = [];
        results.forEach(result => {
            if (result && result.signals.length > 0) {
                signals.push(...result.signals);
            }
        });

        return { signals, results };
    } catch (error) {
        console.error('Error running concurrent tasks:', error);
        return { signals: [], results: [] };
    }
}

// Main function to run the tasks in batches
const main = async () => {
    console.time('Bot Run Time'); // Start the timer

    try {
        console.log('Starting main function'); // Log start of main function

        const allSymbols = await fetchAllTickers(exchangeId);

        if (allSymbols.length === 0) {
            console.log('No tickers found.');
            return;
        }

        const usdtSymbols = allSymbols.filter(symbol => symbol.endsWith('USDT'));
        const limitedSymbols = usdtSymbols.slice(0, 100);
        const cleanedSymbols = limitedSymbols.map(symbol => symbol.replace(':USDT', ''));
        const symbolChunks = chunk(cleanedSymbols, 20);

        const configKey = process.argv[4]; // Get the config key from command line arguments

        const configsToProcess = configKey === 'all'
            ? signalsConfig
            : signalsConfig.filter(config => config.name === configKey);

        if (configsToProcess.length === 0) {
            console.log(`No configuration found for key: ${configKey}`);
            return;
        }

        const allRsiValues = [];
        let totalSignals = 0; // Initialize signal counter
        const allSignalSymbols = new Set(); // Initialize a Set to collect unique symbols

        for (const config of configsToProcess) {
            console.log(`Processing configuration: ${config.name}`);
            for (const chunk of symbolChunks) {
                const { signals, results } = await runConcurrentTasks(chunk, config);

                totalSignals += signals.length; // Increment signal counter

                signals.forEach(signal => {
                    allSignalSymbols.add(signal.symbol); // Add symbol to the Set
                    console.log(`Signal: ${config.name}, ${signal.symbol}, ${signal.interval}, ${signal.time}, C:${signal.price}, H:${signal.highest}, L:${signal.lowest}, ${Object.entries(signal.indicator).map(([key, value]) => `${key} = ${value}`).join(', ')}`);
                });

                console.log('Waiting for 1 seconds to avoid rate limiting...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as needed to avoid rate limiting
                console.log('---------------------------------');

                const rsiKeys = Object.keys(config.indicators).filter(key => key.startsWith('rsi'));
                rsiKeys.forEach(key => {
                    results.forEach(result => {
                        if (result && result.indicators[key]) {
                            allRsiValues.push(...result.indicators[key]);
                        }
                    });
                });
            }
        }

        // signalsConfig  - botname, backtrack, interval, direction, indicators
        const activeBotConfig = configsToProcess.map(config => `${config.name}, ${config.backtrack}, ${config.interval}, ${config.direction}, ${JSON.stringify(config.indicators)}`).join(' | ');
        console.log(`Bot Config: ${activeBotConfig}`);


        if (allRsiValues.length > 0) {
            const averageRsi = allRsiValues.reduce((sum, value) => sum + value, 0) / allRsiValues.length;
            console.log(`Average RSI for all symbols ${allRsiValues.length}: ${averageRsi.toFixed(2)}`);
            // console.log('All RSI values:', allRsiValues);
        } else {
            console.log('No RSI values found.');
        }

        console.log(`Total signals found: ${totalSignals}`); // Log total signals found
        console.log(`Symbols in signals: ${allSignalSymbols.size} of ${limitedSymbols.length}`); // Log number of unique symbols

    } catch (error) {
        console.error('Error running main task:', error);
    }
    console.timeEnd('Bot Run Time'); // End the timer and log the elapsed time
};


main().then(() => {
    console.log('Main function completed.');
});
