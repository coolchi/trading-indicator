const ccxt = require('ccxt')
const chunk = require('lodash/chunk') // Correct way to import lodash chunk

module.exports = {
  ...require('./indicators/input.js'),

  ...require('./indicators/bollinger_band.js'),
  ...require('./indicators/ema.js'),
  ...require('./indicators/ichimoku.js'),
  ...require('./indicators/macd.js'),
  ...require('./indicators/mfi.js'),
  ...require('./indicators/obv.js'),
  ...require('./indicators/rsi.js'),
  ...require('./indicators/roc.js'),
  ...require('./indicators/sma.js'),
  ...require('./indicators/stochasticrsi.js'),
  ...require('./indicators/ticker.js'),
  ...require('./indicators/wma.js'),
  ...require('./alerts/index.js'),
  ...require('./indicators/atr.js'),
  ...require('./indicators/adx.js'),
  ...require('./indicators/cci.js'),
  ...require('./indicators/vwap.js'),
  ...require('./indicators/kst.js'),

  ...require('./candlestick-pattern/doji.js'),
  ...require('./candlestick-pattern/abandoned-baby.js'),
  ...require('./candlestick-pattern/engulfing.js'),
  ...require('./candlestick-pattern/dark-cloud-cover.js'),
  ...require('./candlestick-pattern/downside-tasuki-gap.js'),
  ...require('./candlestick-pattern/harami.js'),
  ...require('./candlestick-pattern/marubozu.js'),
  ...require('./candlestick-pattern/evening-star.js'),
  ...require('./candlestick-pattern/piercing-line.js'),
  ...require('./candlestick-pattern/spinning-top.js'),
  ...require('./candlestick-pattern/morning-star.js'),
  ...require('./candlestick-pattern/three-black-crows.js'),
  ...require('./candlestick-pattern/three-white-soldiers.js'),
  ...require('./candlestick-pattern/hammer.js'),
  ...require('./candlestick-pattern/hanging-man.js'),
  ...require('./candlestick-pattern/shooting-star.js'),
  ...require('./candlestick-pattern/tweezer.js'),
}

const exchangeId = process.argv[2]
const timeframe = process.argv[3] || '1h'

// Function to fetch all tickers
const fetchAllTickers = async (exchangeId) => {
  try {
    const exchange = new ccxt[exchangeId]({
      options: { defaultType: 'swap' }, // For perpetual contracts
    })
    await exchange.loadMarkets() // Load all markets (available symbols)
    const tickers = await exchange.fetchTickers() // Fetch all tickers
    return Object.keys(tickers) // Return only the symbol names
  } catch (error) {
    console.error(`Error fetching tickers from ${exchangeId}:`, error.message)
    return []
  }
}

// Function to get OHLCV and calculate indicators
const calculateIndicators = async (symbol, timeframe) => {
  try {
    // Fetch OHLCV data
    const { input } = await module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, timeframe, true)

    // Calculate RSI for periods 6, 14, and 24
    const rsi6 = await module.exports.rsi(6, 'close', input)
    const rsi14 = await module.exports.rsi(14, 'close', input)
    const rsi24 = await module.exports.rsi(24, 'close', input)

    // Calculate ROC for periods 2, 10, and 100
    const roc2 = await module.exports.roc(2, 'close', input)
    const roc10 = await module.exports.roc(10, 'close', input)
    const roc100 = await module.exports.roc(100, 'close', input)

    // Return the last 5 values of each
    return {
      symbol,
      rsi: {
        rsi6: rsi6.slice(-5),
        rsi14: rsi14.slice(-5),
        rsi24: rsi24.slice(-5),
      },
      roc: {
        roc2: roc2.slice(-5),
        roc10: roc10.slice(-5),
        roc100: roc100.slice(-5),
      },
    }
  } catch (error) {
    console.error(`Error calculating indicators for ${symbol}:`, error.message)
    return null
  }
}

// Function to run concurrent tasks
async function runConcurrentTasks(symbols, timeframe) {
  try {
    console.log('Running concurrent tasks for symbols:', symbols) // Log symbols
    const promises = symbols.map((symbol) => {
      console.log('Processing symbol:', symbol) // Log each symbol
      return module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, timeframe, true)
    })

    // Wait for all promises to resolve
    const results = await Promise.all(promises)

    // Log results to inspect structure
    console.log('Results:', results)

    // Adjust this based on actual structure
    const input1 = results[0]?.input
    console.log('First input:', input1)

    return results // Return the results
  } catch (error) {
    console.error('Error running concurrent tasks:', error)
    return [] // Return an empty array in case of error
  }
}

// Main function to run the tasks in batches
const main = async () => {
  try {
    console.log('Starting main function') // Log start of main function

    // Step 1: Fetch all symbols with tickers
    const allSymbols = await fetchAllTickers(exchangeId)

    if (allSymbols.length === 0) {
      console.log('No tickers found.')
      return
    }

    // Step 2: Filter symbols that end with 'USDT'
    const usdtSymbols = allSymbols.filter((symbol) => symbol.endsWith('USDT'))

    // Step 3: Limit the tickers to the first 20
    const limitedSymbols = usdtSymbols.slice(0, 20)

    // Step 4: Remove :USDT suffix from each symbol
    const cleanedSymbols = limitedSymbols.map((symbol) => symbol.replace(':USDT', ''))

    // Step 5: Batch the tickers into chunks of 10 symbols
    const symbolChunks = chunk(cleanedSymbols, 10)

    // Step 6: For each chunk, run the concurrent tasks
    for (const chunk of symbolChunks) {
      console.log('Processing chunk:', chunk) // Log each chunk
      const results = await runConcurrentTasks(chunk, timeframe)

      // Filter out any null results (in case of errors)
      const validResults = results.filter((result) => result !== null)

      // Log the results
      console.log('Batch results:', validResults)
    }

    console.log('Main function completed') // Log completion of main function
  } catch (error) {
    console.error('Error running main task:', error)
  }
}

main()
