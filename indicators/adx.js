const indicators = require('technicalindicators')

// adxInput ={
//     period
//     high
//     low
//     close
// }

const adxCalculator = async (adxInput) => await indicators.ADX.calculate(adxInput)

const adx = async (period, input) => {
  try {
    const adxInput = {
      ...input,
      period,
    }
    return await adxCalculator(adxInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  adx,
  adxCalculator,
}
