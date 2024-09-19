const indicators = require('technicalindicators')

const sma = async (smaLength, sourceType, input) => {
  try {
    const smaInput = {
      values: input[sourceType],
      period: smaLength,
    }
    return await indicators.SMA.calculate(smaInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  sma,
}
