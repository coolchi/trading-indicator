const indicators = require('technicalindicators')

const macd = async (fastPeriod, slowPeriod, signalPeriod, sourceType, input) => {
  try {
    return await indicators.MACD.calculate({
      values: input[sourceType],
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    })
  } catch (err) {
    throw err
  }
}
module.exports = {
  macd,
}
