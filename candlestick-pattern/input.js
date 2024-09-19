const getOHLCV = require('../indicators/ohlcv.js')
const detachSource = require('../indicators/source.js')

const getCandleStickInput = async (ex, ticker, interval, isFuture = false) => {
  const ohlcv = await getOHLCV(ex, ticker, interval, isFuture)
  const source = detachSource(ohlcv)
  return {
    ohlcv,
    input: source,
  }
}
module.exports = {
  getCandleStickInput,
}
