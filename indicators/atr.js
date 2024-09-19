const indicators = require('technicalindicators')

const atr = async (period, input) => {
  try {
    const atrInput = {
      ...input,
      period,
    }
    return await indicators.atr.calculate(atrInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  atr,
}
