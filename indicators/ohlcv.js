const ccxt = require('ccxt')

const getOHLCV = async (ex, ticker, interval, isFuture = false) => {
  if (!ccxt.exchanges.includes(ex)) {
    console.log(ex)
    throw 'Exchange is not supported'
  }
  try {
    const exchangeId = ex
    const exchangeClass = ccxt[exchangeId]

    let exchange
    if (isFuture) {
      exchange = new exchangeClass({
        options: {
          defaultMarket: 'future',
        },
      })
    } else {
      exchange = new exchangeClass({})
    }
    return await exchange.fetchOHLCV(ticker, interval)
  } catch (err) {
    throw `Ticker ${ticker} is not supported`
  }
}
// console.log(getOHLCV("binance", "BTC/USDT", "15m", true))
module.exports = getOHLCV
