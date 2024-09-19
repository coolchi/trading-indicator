const ccxt = require('ccxt');
const { chunk } = require('lodash'); // Correct way to import lodash chunk

module.exports = {
  ...require('./indicators/input.js'),
  ...require('./indicators/rsi.js'),
  ...require('./indicators/roc.js'),
};

const exchangeId = process.argv[2]
const timeframe = process.argv[4] || '1h'

// Main function to run the tasks in batches
const main = async () => {
    try {

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

async function runConcurrentTasks(symbols, timeframe) {
    try {
        console.log('Running concurrent tasks for symbols:', symbols); // Log symbols
        const promises = symbols.map(symbol => {
        return module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, timeframe, true);
    });


        // Wait for all promises to resolve
        const results = await Promise.all(promises);
        for(result of results){
            //get rsidata
            const rocData = await module.exports.roc(6, 'close', result.input);
            console.log(rocData.slice(-5))
        }

        // return results;

    } catch (error) {
        console.error('Error running concurrent tasks:', error);
    }
}

// await runConcurrentTasks('BTC/USDT,LTC/USDT,ETHUSDT,ADAUSDT,NOTUSDT,TIAUSDT', timeframe);
// return;


        console.log('Starting main function'); // Log start of main function

        // Step 1: Fetch all symbols with tickers
        const allSymbols = await fetchAllTickers(exchangeId);

        if (allSymbols.length === 0) {
            console.log('No tickers found.');
            return;
        }

        // Step 2: Filter symbols that end with 'USDT'
        const usdtSymbols = allSymbols.filter(symbol => symbol.endsWith('USDT'));

        // Step 3: Limit the tickers to the first 20
        const limitedSymbols = usdtSymbols.slice(0, 20);

        // Step 4: Remove :USDT suffix from each symbol
        const cleanedSymbols = limitedSymbols.map(symbol => symbol.replace(':USDT', ''));

        // Step 5: Batch the tickers into chunks of 10 symbols
        const symbolChunks = chunk(cleanedSymbols, 10);

        // Log the symbolChunks data
        console.log('Symbol Chunks:', symbolChunks);

        // Step 6: For each chunk, run the concurrent tasks
        for (const chunk of symbolChunks) {
            const results = await runConcurrentTasks(chunk, timeframe);

            // Ensure results is always an array
            if (!Array.isArray(results)) {
                // console.error('Results is not an array:', results);
                continue;
            }

            // Filter out any null results (in case of errors)
            const validResults = results.filter(result => result !== null);

            // Log the last 5 RSI values for each symbol
            validResults.forEach(result => {
                console.log(`Symbol: ${result.symbol}`);
                console.log(`RSI 6: ${result.rsi.rsi6}`);
                console.log(`RSI 14: ${result.rsi.rsi14}`);
                console.log(`RSI 24: ${result.rsi.rsi24}`);
            });
        }

        // Return the symbolChunks data
        return symbolChunks;
    } catch (error) {
        console.error('Error running main task:', error);
    }
};

main().then(symbolChunks => {
    // console.log('Returned Symbol Chunks:', symbolChunks);
});
