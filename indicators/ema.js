const indicators = require('technicalindicators')

const ema = async (emaLength, sourceType, input) => {
  try {
    const emaInput = {
      values: input[sourceType],
      period: emaLength,
    }
    return await indicators.EMA.calculate(emaInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  ema,
}
