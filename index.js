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

const ccxt = require('ccxt')

const exchangeId = process.argv[2]
const symbol = process.argv[3]
console.log(exchangeId, symbol)
const timeframe = process.argv[4] || '1h'

// console.log(module);
// examples for testing
const main = async () => {
  try {
    // async function fetchAllTickers(exchangeId) {
    //     try {
    //       // Initialize the exchange with a specific market type
    //       const exchange = new ccxt[exchangeId]({
    //         options: {
    //           defaultType: 'swap',  // For perpetual contracts
    //         }
    //       });

    //       // Load all markets (available symbols)
    //       await exchange.loadMarkets();

    //       // Fetch all tickers
    //       const tickers = await exchange.fetchTickers();

    //       // Log the tickers data
    //       console.log(`All tickers from ${exchangeId} (swap market):`, tickers);
    //       return tickers;
    //     } catch (error) {
    //       console.error(`Error fetching tickers from ${exchangeId}:`, error.message);
    //     }
    //   }

    // Example usage: Fetch all tickers from Bybit (swap market)
    //   await fetchAllTickers(exchangeId);
    //   return;

    async function runConcurrentTasks(symbols, timeframe) {
      try {
        // const promises = [ module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, timeframe, true)];

        symbols = symbols.split(',')
        console.log('Running concurrent tasks for symbols:', symbols) // Log symbols
        const promises = symbols.map((symbol) => {
          console.log('Processing symbol:', symbol) // Log each symbol
          return module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, timeframe, true)
        })

        // Wait for all promises to resolve
        const results = await Promise.all(promises)
        for (result of results) {
          // get rsidata
          const rocData = await module.exports.roc(6, 'close', result.input)
          console.log(rocData.slice(-5))
        }
        // Log results to inspect structure
        // console.log('Results:', results);

        // Adjust this based on actual structure
        // const input1 = results[0]?.input;
        // console.log(input1);
      } catch (error) {
        console.error('Error running concurrent tasks:', error)
      }
    }

    await runConcurrentTasks('BTC/USDT,LTC/USDT,ETHUSDT,ADAUSDT,NOTUSDT,TIAUSDT', timeframe)
    return

    const startTime = Date.now() // Capture the start time

    // Await the concurrent tasks
    // await runConcurrentTasks(symbol, timeframe);

    const endTime = Date.now() // Capture the end time

    // Calculate the time taken in seconds
    const timeTaken = (endTime - startTime) / 1000
    console.log(`Time taken: ${timeTaken} seconds`)

    // return; //
    console.log(`RSI 14 on Binance ${symbol} ${timeframe}`)

    const { input } = await module.exports.getDetachSourceFromOHLCV(exchangeId, symbol, timeframe, true)
    console.log(`RSI 14 on Binance ${symbol} ${timeframe}`)
    // const rsidata = await ti.roc(6, 'close', input)
    const rocData = await module.exports.roc(6, 'close', input)
    console.log(rocData.slice(-5))

    // console.log('SMA 8 on Binance BTC/USDT 1h')
    // let smaData = await module.exports.sma(8, 'close', input)
    // console.log(smaData[smaData.length - 1])

    // console.log('Bollinger bands 50, 2 on Binance BTC/USDT 1h')
    // let bbData = await module.exports.bb(50, 2, 'close', input)
    // console.log(bbData[bbData.length - 2])

    // console.log('MACD 12 26 9 on Binance BTC/USDT 1h')
    // let macdData = await module.exports.macd(12, 26, 9, 'close', input)
    // console.log(macdData[macdData.length - 2])

    // console.log('Stochastic RSI example')
    // console.log(await module.exports.stochasticrsi(3, 3, 14, 14, 'close', input))

    // console.log('IchimokuCloud  example')
    // console.log(await module.exports.ichimokuCloud(9, 26, 52, 26, input))

    // console.log('Test golden cross')
    // console.log(await module.exports.goldenCross(50, 200, input))

    // console.log('Test MA cross')
    // console.log(await module.exports.maCross(50, 200, input))

    // console.log('Test RSIcheck')
    // console.log(await module.exports.rsiCheck(6, 75, 25, input))

    // console.log('Test SMA cross')
    // console.log(await module.exports.priceCrossSMA(14, input))

    // console.log('Test EMA cross')
    // console.log(await module.exports.priceCrossEMA(14, input))

    // console.log('Test break out BB')
    // console.log(await module.exports.bbCheck(50, 2, input))

    // console.log('Test isDoji')
    // console.log(await module.exports.isDojiPattern(input))

    // console.log('Test abandonedBaby')
    // console.log(await module.exports.isAbandonedBabyPattern(input))

    // console.log('Test isBearishEngulfingPattern')
    // console.log(await module.exports.isBearishEngulfingPattern(input))

    // console.log('Test isBullishEngulfingPattern')
    // console.log(await module.exports.isBullishEngulfingPattern(input))

    // console.log('Test isDarkCloudCoverPattern')
    // console.log(await module.exports.isDarkCloudCoverPattern(input))

    // console.log('Test isDownsideTasukiGapPattern')
    // console.log(await module.exports.isDownsideTasukiGapPattern(input))

    // console.log('Test isDragonFlyDojiPattern')
    // console.log(await module.exports.isDragonFlyDojiPattern(input))

    // console.log('Test isGraveStoneDojiPattern')
    // console.log(await module.exports.isGraveStoneDojiPattern(input))

    // console.log('Test isBullishHaramiPattern')
    // console.log(await module.exports.isBullishHaramiPattern(input))

    // console.log('Test isBearishHaramiPattern')
    // console.log(await module.exports.isBearishHaramiPattern(input))

    // console.log('Test isBullishHaramiCrossPattern')
    // console.log(await module.exports.isBullishHaramiCrossPattern(input))

    // console.log('Test isBearishHaramiCrossPattern')
    // console.log(await module.exports.isBearishHaramiCrossPattern(input))

    // console.log('Test isBullishMarubozuPattern')
    // console.log(await module.exports.isBullishMarubozuPattern(input))

    // console.log('Test isBearishMarubozuPattern')
    // console.log(await module.exports.isBearishMarubozuPattern(input))

    // console.log('Test isEveningDojiStarPattern')
    // console.log(await module.exports.isEveningDojiStarPattern(input))

    // console.log('Test isEveningStarPattern')
    // console.log(await module.exports.isEveningStarPattern(input))

    // console.log('Test isPiercingLinePattern')
    // console.log(await module.exports.isPiercingLinePattern(input))

    // console.log('Test isBullishSpinningTopPattern')
    // console.log(await module.exports.isBullishSpinningTopPattern(input))

    // console.log('Test isBearishSpinningTopPattern')
    // console.log(await module.exports.isBearishSpinningTopPattern(input))

    // console.log('Test isMorningStarPattern')
    // console.log(await module.exports.isMorningStarPattern(input))

    // console.log('Test isMorningDojiStarPattern')
    // console.log(await module.exports.isMorningDojiStarPattern(input))

    // console.log('Test isThreeBlackCrowsPattern')
    // console.log(await module.exports.isThreeBlackCrowsPattern(input))

    // console.log('Test isThreeWhiteSoldiersPattern')
    // console.log(await module.exports.isThreeWhiteSoldiersPattern(input))

    // console.log('Test isHammerPattern')
    // console.log(await module.exports.isHammerPattern(input))

    // console.log('Test isBullishHammerPattern')
    // console.log(await module.exports.isBullishHammerPattern(input))

    // console.log('Test isBullishInvertedHammerPattern')
    // console.log(await module.exports.isBullishInvertedHammerPattern(input))

    // console.log('Test isBearishHammerPattern')
    // console.log(await module.exports.isBearishHammerPattern(input))

    // console.log('Test isBearishInvertedHammerPattern')
    // console.log(await module.exports.isBearishInvertedHammerPattern(input))

    // console.log('Test isShootingStarPattern')
    // console.log(await module.exports.isShootingStarPattern(input))

    // console.log('Test isHangingManPattern')
    // console.log(await module.exports.isHangingManPattern(input))

    // console.log('Test isTweezerTopPattern')
    // console.log(await module.exports.isTweezerTopPattern(input))

    // console.log('Test isTweezerBottomPattern')
    // console.log(await module.exports.isTweezerBottomPattern(input))

    // console.log('Test CCI')
    // console.log(await module.exports.cci(14, input))

    // console.log('Test VWAP')
    // console.log(await module.exports.vwap(input))

    // console.log('Test KST')
    // console.log(await module.exports.kst(input, 10, 15, 20, 30, 10, 10, 10, 15, 9))
  } catch (err) {
    console.log(err)
    console.log(err)
  }
}
main()
