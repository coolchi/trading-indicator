const indicators = require('technicalindicators')

const cci = async (cciPeriod, input) => {
  try {
    const cciInput = {
      ...input,
      period: cciPeriod,
    }
    return await indicators.CCI.calculate(cciInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  cci,
}
