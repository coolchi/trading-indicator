const getOHLCV = require('./ohlcv.js')
const detachSource = require('./source.js')

const getDetachSourceFromOHLCV = async (ex, ticker, interval, isFuture = false) => {
  const ohlcv = await getOHLCV(ex, ticker, interval, isFuture)
  const source = detachSource(ohlcv)
  return {
    ohlcv,
    input: source,
  }
}
module.exports = {
  getDetachSourceFromOHLCV,
}
