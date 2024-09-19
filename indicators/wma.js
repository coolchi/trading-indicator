const indicators = require('technicalindicators')

const wma = async (wmaLength, sourceType, input) => {
  try {
    const wmaInput = {
      values: input[sourceType],
      period: wmaLength,
    }
    return await indicators.WMA.calculate(wmaInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  wma,
}
