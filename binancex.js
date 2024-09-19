module.exports = {
  ...require('./indicators/input.js'),

  ...require('./indicators/bollinger_band.js'),
  ...require('./indicators/ema.js'),
  ...require('./indicators/ichimoku.js'),
  ...require('./indicators/macd.js'),
  ...require('./indicators/mfi.js'),
  ...require('./indicators/obv.js'),
  ...require('./indicators/rsi.js'),
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

// console.log(module);
// examples for testing
// Retrieve the symbol passed from the Laravel command

const exchange = process.argv[2] || 'binance'
const symbol = process.argv[3] || 'BTC/USDT'
const timeframe = process.argv[4] || '1h'
const isFuture = process.argv[5] === 'true'

const ccxt = require('ccxt')

async function fetchOHLCV(symbol, timeframe, start, end, limit = null) {
  const exchange = new ccxt.binance()

  // Convert start time to milliseconds
  const startTimeInMillis = exchange.parse8601(start)

  // Define the number of minutes per timeframe
  const timeframeInMinutes = {
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '12h': 720,
    '1d': 1440, // 24 hours * 60 minutes
    '1w': 10080, // 7 days * 24 hours * 60 minutes
  }

  // Convert 140 days to minutes for the selected timeframe
  const totalMinutesToSubtract = 140 * timeframeInMinutes[timeframe]

  // Adjust the since time based on the timeframe
  let since = startTimeInMillis - totalMinutesToSubtract * 60 * 1000
  console.log(since)

  // Convert end time to milliseconds
  const endTime = exchange.parse8601(end)
  console.log(endTime)

  const timeDifferenceInMillis = endTime - since
  const timeDifferenceInMinutes = timeDifferenceInMillis / (60 * 1000)
  const limitx = timeDifferenceInMinutes / timeframeInMinutes[timeframe]
  console.log(limitx)

  let allOHLCV = []
  let totalFetched = 0

  while (totalFetched < limitx) {
    // Determine the number of candles to fetch in this iteration
    const remaining = limitx ? limitx - totalFetched : 1000
    const fetchLimit = Math.min(remaining, 1000) // Binance max limit is 1000

    // Fetch OHLCV data
    const ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, since, fetchLimit)
    if (ohlcv.length === 0) break

    allOHLCV = allOHLCV.concat(ohlcv)
    totalFetched += ohlcv.length

    // Update the since timestamp for the next fetch
    since = ohlcv[ohlcv.length - 1][0] + 1
  }

  console.log(totalFetched)

  // If a limit is provided, slice the result array to the specified limit
  return limit ? allOHLCV.slice(0, limit) : allOHLCV
}

const main = async () => {
  try {
    /// /start///
    const start = '2023-01-01T00:00:00Z' // start date
    const end = '2024-07-02T00:00:00Z' // end date

    const ohlcvData = await fetchOHLCV(symbol, timeframe, start, end)

    // Extract all data as separate arrays
    const timestamps = ohlcvData.map((candle) => {
      const date = new Date(candle[0])
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0') // getMonth() returns 0-11, so add 1
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${year}/${month}/${day} ${hours}:${minutes}`
    })

    const openPrices = ohlcvData.map((candle) => candle[1])
    const highPrices = ohlcvData.map((candle) => candle[2])
    const lowPrices = ohlcvData.map((candle) => candle[3])
    const closePrices = ohlcvData.map((candle) => candle[4])
    const volumes = ohlcvData.map((candle) => candle[5])

    // Structure data into an object
    const inputx = {
      datetime: timestamps,
      open: openPrices,
      high: highPrices,
      low: lowPrices,
      close: closePrices,
      volumes,
    }

    // console.log(inputx);
    /// end///

    // const { input } = await module.exports.getDetachSourceFromOHLCV('binance', symbol, timeframe, false)
    // console.log(input.slice(-5))
    // console.log(inputx.slice(-5))
    // return

    console.log(`RSI 14 on ${exchange} ${symbol} ${timeframe} (Future: ${isFuture})`)

    const rsiValues = await module.exports.rsi(14, 'close', inputx)

    // Combine RSI values with their corresponding timestamps
    const rsiWithTimestamps = rsiValues.map((rsi, index) => ({
      datetime: inputx.datetime[index + 14], // Adjust index to match RSI calculation start
      rsi,
    }))

    // Display only the last 5 RSI values with timestamps
    // const last5RSI = rsiWithTimestamps.slice(-5);
    // console.log(rsiWithTimestamps.slice(-24));
    console.log(rsiWithTimestamps)

    console.log('Test RSIcheck')
    console.log(await module.exports.rsiCheck(14, 75, 25, inputx))
    const rsiCheckResult = await module.exports.rsiCheck(14, 75, 25, inputx)

    // Log only the rsiVal
    console.log(`RSI Value: ${rsiCheckResult.rsiVal}`)
  } catch (err) {
    console.log(err)
  }
}

main()
