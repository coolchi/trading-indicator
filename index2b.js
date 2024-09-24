const ccxt = require('ccxt');
const { chunk } = require('lodash'); // Correct way to import lodash chunk

module.exports = {
    ...require('./indicators/input.js'),
    ...require('./indicators/rsi.js'),
    ...require('./indicators/roc.js'),
};

const exchangeId = process.argv[2];
const interval = process.argv[3] || '1h';
const symbolLimit = 300;

const signalsConfig = [
    {
        name: 'bot1',
        interval: '1h',
        backtrack: 240                                                                      ,
        direction: 'long',
        indicators: {
            rsi_6: 10,
            roc_10: -5,
        },
        sl: -20,
        tp: 5
    },
    {
        name: 'bot2',
        interval: '1h',
        backtrack: 240,
        direction: 'short',
        indicators: {
            rsi_6: 80,
            roc_10: 5,
        },
        sl: -20,
        tp: 5
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
        },
        sl: -2,
        tp: 5
    }
];

// Function to fetch all tickers
const fetchAllTickers = async (exchangeId) => {
    try {
        const exchange = new ccxt[exchangeId]({
            options: { defaultType: 'swap' } // For perpetual contracts
        });
        await exchange.loadMarkets(); // Load all markets (available symbols)
        const tickers = await exchange.fetchTickers(); // Fetch all tickers
        console.log(`Available tickers on ${exchangeId}:`, Object.keys(tickers)); // Print all available tickers
        return Object.keys(tickers); // Return only the symbol names
    } catch (error) {
        console.error(`Error fetching tickers from ${exchangeId}:`, error.message);
        return [];
    }
};


// Function to get OHLCV and calculate indicators
async function calculateIndicators(symbol, config) {
    const { interval, indicators, name, backtrack } = config;

    try {
        
        const ohlcvData = await module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, interval, true);
        // console.log(ohlcvData);

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
                results[indicator[0]] = rocValues.map(value => value !== undefined ? parseFloat(value.toFixed(2)) : null);
            }
        }

        const closes = input.close;
        const timestamps = input.timestamp;
        const signals = [];
        let counter = 1;

        for (closes.length; counter <= backtrack; counter++) {
            const lastClose = closes[closes.length - counter];
            const highest = input.high[input.high.length - counter];
            const lowest = input.low[input.low.length - counter];
            const timestamp = timestamps[timestamps.length - counter];

            if (results.rsi_6 && results.roc_10) {
                // console.log(`Checking signals for ${symbol} at timestamp ${timestamp}`);

                const lastRsi6 = results.rsi_6[results.rsi_6.length - counter];
                const lastRoc10 = results.roc_10[results.roc_10.length - counter];

                let indicator = { 
                    "rsi_6": lastRsi6 !== undefined ? lastRsi6.toFixed(1) : 0, 
                    "roc_10": lastRoc10 !== undefined ? lastRoc10.toFixed(1) : 0 
                };

                const criteriaMet = Object.keys(indicators).length === 0 || Object.entries(indicators).every(([key, value]) => {
                    const [type] = key.split('_');
                    const indicatorValue = results[key][results[key].length - counter];

                    // console.log(`Checking criteria for ${symbol} at timestamp ${timestamp}:`, key, value, indicatorValue);
                    if (value === 0) {
                        return true;
                    }

                    if (type === 'rsi') {
                        return config.direction === 'long' ? indicatorValue < value : indicatorValue > value;
                    } else if (type === 'roc') {
                        return config.direction === 'long' ? indicatorValue < value : indicatorValue > value;
                    }
                    return false;
                });

                if (criteriaMet) {
                    console.log(`Fetching next candles for ${symbol} at timestamp ${timestamp}`);
                    const nextCandles = await fetchNextCandles(symbol, timestamp, input, lastClose, config);
                    signals.push({
                        symbol,
                        interval: interval,
                        time: new Date(timestamp).toLocaleString('en-GB', { hour12: false }),
                        unix: timestamp,
                        price: parseFloat(lastClose),
                        highest: highest.toFixed(1) ?? null,
                        lowest: lowest.toFixed(1) ?? null,
                        indicator,
                        direction: config.direction,
                        candles: nextCandles
                    });
                } else {
                    // console.warn(`No signals found for ${symbol} at timestamp ${timestamp}`, indicator);
                }
            }
        }

        const limitedResults = {};
        for (const [key, values] of Object.entries(results)) {
            if (values.length >= backtrack) {
                limitedResults[key] = values.slice(-backtrack).map(value => value !== undefined ? value.toFixed(1) : null);
            }
        }

        return {
            symbol,
            indicators: limitedResults,
            signals,
            closes
        };

    } catch (error) {
        console.error(`Error calculating indicators for ${symbol}:`, error.message);
        return null;
    }
}

const fetchNextCandles = async (symbol, referenceTimestamp, ohlcvData, lastClose, config) => {
    try {
        // Extract OHLCV arrays from the input
        const { open, high, low, close, volume, timestamp } = ohlcvData;

        // Find candles after the referenceTimestamp
        const nextCandles = [];
        const nextCloses = [];
        let highest = -Infinity;
        let lowest = Infinity;
        let no = 0;

        for (let i = 0; i < timestamp.length; i++) {
            if (timestamp[i] > referenceTimestamp) {
            const percentageHigh = (((high[i] - lastClose) / lastClose) * 100).toFixed(2);
            const percentageLow = (((low[i] - lastClose) / lastClose) * 100).toFixed(2);
            const percentageClose = (((close[i] - lastClose) / lastClose) * 100).toFixed(2);

            if (high[i] > highest) {
                highest = high[i];
            }

            if (low[i] < lowest) {
                lowest = low[i];
            }

            no++; // Increase no by one
            const highestPercentage = (((highest - lastClose) / lastClose) * 100).toFixed(2);
            const lowestPercentage = (((lowest - lastClose) / lastClose) * 100).toFixed(2);
            
             // Calculate RSI and ROC for the next candles
            const rsi_6 = await module.exports.rsi(6, 'close', ohlcvData);
            const roc_10 = await module.exports.roc(10, 'close', ohlcvData);
 
             // calculate the stop loss and take profit in percentage
            const roe = (lowestPercentage <= config.sl) ? config.sl : (highestPercentage >= config.tp) ? config.tp : 0;
            let openRoe = 0;
            if (roe === 0) {   openRoe = percentageClose; }

            nextCandles.push({
                "symbol": symbol,
                "no": no, // Update no value
                "time": new Date(timestamp[i]).toLocaleString('en-GB', { hour12: false }),
                // "open": open[i],
                "high": high[i],
                "low": low[i],
                "close": close[i],
                // "volume": volume[i],
                "price": lastClose,
                "highp": percentageHigh,
                "lowp": percentageLow,
                // "highest" :highest,
                // "lowest": lowest,
                "highestp" : highestPercentage,
                "lowestp" : lowestPercentage,
                "rsi_6": rsi_6 ? rsi_6[i]?.toFixed(2) : null,
                "roc_10": roc_10 ? roc_10[i]?.toFixed(2) : null,
                "roe": roe,
                "openRoe": Math.round(openRoe),
                // "referenceTimestamp": referenceTimestamp
            });

            nextCloses.push(close[i]);

           
            if (roe !== 0) {
                // console.log(`Signal ROE for ${symbol} of ${roe} at timestamp ${new Date(referenceTimestamp).toLocaleString('en-GB', { hour12: false })}`);
                // skip to next signal if the roe is not 0
                break;

            }

            //remove last candle from the olchvData to get the next candles olchvData
            ohlcvData = { open: open.slice(0, -1), high: high.slice(0, -1), low: low.slice(0, -1), close: close.slice(0, -1), volume: volume.slice(0, -1), timestamp: timestamp.slice(0, -1) };
            // console.log(`Candle: ${symbol}, ${new Date(timestamp[i]).toLocaleString('en-GB', { hour12: false })}, O:${open[i]}, H:${high[i]}, L:${low[i]}, C:${close[i]}, V:${volume[i]}, LC:${lastClose}, PH:${percentageHigh}%, PL:${percentageLow}%, H:${highest}, L:${lowest}, PH:${highestPercentage}%, PL:${lowestPercentage}%`);

            }
        }
 
        // console.log (nextCandles) as an table in console
        if (nextCandles.length > 0){
            console.table(nextCandles);
        }

        return nextCandles; // Return the filtered and structured candles as an array of objects
    } catch (error) {
        console.error("Error fetching next candles:", error.message);
        return [];
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
        const closes = [];

        results.forEach(result => {
            if (result && result.signals.length > 0) {
                signals.push(...result.signals);
                closes.push(...result.closes);
            }
        });

        return { signals, results, closes };
    } catch (error) {
        console.error('Error running concurrent tasks:', error);
        return { signals: [], results: [], closes: [] };
    }
}

const backtestSignals = (signals, sl, tp) => {
    // Group signals by symbol
    const signalsBySymbol = {};
    signals.forEach(signal => {
        if (!signalsBySymbol[signal.symbol]) {
            signalsBySymbol[signal.symbol] = [];
        }
        signalsBySymbol[signal.symbol].push(signal);
    });

    let backtestResults = [];

    // Process each symbol's signals
    for (const [symbol, symbolSignals] of Object.entries(signalsBySymbol)) {
        // Add Unix timestamp to each signal
        symbolSignals.forEach(signal => {
            const [datePart, timePart] = signal.time.split(', ');
            const [day, month, year] = datePart.split('/');
            const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}Z`;
            signal.unix = Math.floor(new Date(dateString).getTime() / 1000);
        });

        // Sort signals by Unix timestamp in ascending order (older to newer)
        const sortedSignals = symbolSignals.sort((a, b) => a.unix - b.unix);

        for (const signal of sortedSignals) {
            const lastCandle = signal.candles[signal.candles.length - 1];
            //add lastCandle candle to backtestResults array
            if (lastCandle) {
                backtestResults.push(lastCandle);
            }
        }
    }

    // console.table(backtestResults); 

    return backtestResults;
};

// Main function to run the tasks in batches
const main = async () => {
    console.time('Bot Run Time');

    try {
        console.log('Starting main function');

        // if custom symbols are provided, use them instead of fetching all tickers
        let customSymbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'LTCUSDT', 'ADAUSDT', 'BNBUSDT', 'DOTUSDT', 'LINKUSDT', 'XLMUSDT', 'BCHUSDT', 'UNIUSDT', 'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'ICPUSDT', 'ETCUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT', 'EOSUSDT', 'AAVEUSDT', 'XTZUSDT', 'THETAUSDT', 'ATOMUSDT', 'NEOUSDT', 'MKRUSDT', 'XMRUSDT', 'CROUSDT', 'ALGOUSDT', 'KSMUSDT', 'SHIBUSDT', 'COMPUSDT', 'SNXUSDT', 'YFIUSDT', 'FTTUSDT', 'HTUSDT', 'CELUSDT', 'ENJUSDT', 'BATUSDT', 'MANAUSDT', 'SUSHIUSDT', 'ZRXUSDT', 'GRTUSDT', 'CHZUSDT', 'STORJUSDT', 'ANKRUSDT', '1INCHUSDT', 'BNTUSDT', 'SKLUSDT', 'BATUSDT', 'CVCUSDT', 'SANDUSDT', 'LRCUSDT', 'RLCUSDT', 'DGBUSDT', 'DENTUSDT', 'HOTUSDT', 'RVNUSDT', 'WINUSDT', 'SCUSDT', 'STMXUSDT', 'DODOUSDT', 'TWTUSDT', 'REEFUSDT', 'MTLUSDT', 'DIAUSDT', 'OCEANUSDT', 'TLMUSDT', 'LINAUSDT', 'PERLUSDT', 'COTIUSDT', 'CTSIUSDT', 'STMXUSDT', 'DGBUSDT', 'DENTUSDT', 'HOTUSDT', 'RVNUSDT', 'WINUSDT', 'SCUSDT', 'STMXUSDT', 'DODOUSDT', 'TWTUSDT', 'REEFUSDT', 'MTLUSDT', 'DIAUSDT', 'OCEANUSDT', 'TLMUSDT', 'LINAUSDT', 'PERLUSDT'];
        
        //empty array to store the custom symbols
        customSymbols = [];

        const removeSymbols = ['USDC/USDT', 'USDCUSDT'];


        let limitedSymbols = customSymbols.length > 0 ? customSymbols : await fetchAllTickers(exchangeId);

        if (limitedSymbols.length === 0) {
            console.log('No tickers found.');
            return;
        }

        const usdtSymbols = limitedSymbols.filter(symbol => symbol.endsWith('USDT'));
        limitedSymbols = usdtSymbols.slice(0, symbolLimit);

        // remove some symbols from the array
        removeSymbols.forEach(symbol => {
            const index = limitedSymbols.indexOf(symbol);
            if (index > -1) {
            limitedSymbols.splice(index, 1);
            }
        });

        // const cleanedSymbols = limitedSymbols.map(symbol => symbol.replace(':USDT', ''));
        const symbolChunks = chunk(limitedSymbols, 20);

        const configKey = process.argv[4];

        const configsToProcess = configKey === 'all'
            ? signalsConfig
            : signalsConfig.filter(config => config.name === configKey);

        if (configsToProcess.length === 0) {
            console.log(`No configuration found for key: ${configKey}`);
            return;
        }

        const allRsiValues = [];
        const allSignalSymbols = new Set();
        let backtestedSignals = [];

        for (const config of configsToProcess) {
            console.log(`Processing configuration: ${config.name}`);
            for (const chunk of symbolChunks) {
                const { signals, results } = await runConcurrentTasks(chunk, config);

                const chunkBacktestedSignals = backtestSignals(signals, config.sl, config.tp);
                backtestedSignals = backtestedSignals.concat(chunkBacktestedSignals);

                console.log('---------------------------------');

                const rsiKeys = Object.keys(config.indicators).filter(key => key.startsWith('rsi'));
                rsiKeys.forEach(key => {
                    results.forEach(result => {
                        if (result && result.indicators[key]) {
                            allRsiValues.push(...result.indicators[key]);
                        }
                    });
                });

                // Add symbols to the allSignalSymbols set
                signals.forEach(signal => {
                    allSignalSymbols.add(signal.symbol);
                });
            }
        }

        const activeBotConfig = configsToProcess.map(config => `${config.name}, ${config.backtrack}, ${config.interval}, ${config.direction}, ${JSON.stringify(config.indicators)}`).join(' | ');
        console.log(`FINAL BACKTESTING RESULT - Bot Config: ${activeBotConfig}`);
        console.log('---------------------------------');

        console.table(backtestedSignals);

        if (allRsiValues.length > 0) {
            const averageRsi = allRsiValues.reduce((sum, value) => sum + parseFloat(value), 0) / allRsiValues.length;
            console.log(`Average RSI for all symbols ${allRsiValues.length}: ${averageRsi.toFixed(1)}`, allRsiValues.length);
        } else {
            console.log('No RSI values found.');
        }

        const tp = signalsConfig.find(config => config.name === configKey).tp;
        const sl = signalsConfig.find(config => config.name === configKey).sl;

        // Get Total signals hitting TP 
        const totalSignals = backtestedSignals.length;
        const totalHitTP = backtestedSignals.filter(signal => signal.highestp > tp);
        const totalHitSL = backtestedSignals.filter(signal => signal.lowestp < sl);

        
        const totalWinsRoe =  backtestedSignals.filter(signal => signal.roe >= tp);
        const totalLossRoe =  backtestedSignals.filter(signal => signal.roe <= sl);
        //sum of open roe
        const totalOpenRoe = backtestedSignals.reduce((sum, signal) => sum + signal.openRoe, 0)?? 0;

        console.log(`Total signals found: ${totalSignals}`);
        console.log(`Symbols in signals: ${allSignalSymbols.size} of ${limitedSymbols.length}`);
        console.log(`Total signals hitting TP: ${totalHitTP.length} LS: ${totalHitTP.length}`);

        console.log(`Win: ${totalWinsRoe.length} Loss: ${totalLossRoe.length} | Win Value: ${totalWinsRoe.reduce((sum, signal) => sum + signal.roe, 0)} Loss Value: ${totalLossRoe.reduce((sum, signal) => sum + signal.roe, 0)}`);
        
        const winRate = totalWinsRoe.length / (totalWinsRoe.length + totalLossRoe.length) * 100;
        console.log(`Win Rate: ${winRate.toFixed(2)}%  |  Total OpenRoe: ${totalOpenRoe}`);
        console.log(`SUM OF ROE: ${backtestedSignals.reduce((sum, signal) => sum + signal.roe, 0)}`);



    } catch (error) {
        console.error('Error running main task:', error);
    }
    console.timeEnd('Bot Run Time');
};

main().then((allSignals) => {
    console.log('Main function completed.');
});
