const indicators = require('technicalindicators')

const roc = async (rocLength, sourceType, input) => {
  try {
    const rocInput = {
      values: input[sourceType],
      period: rocLength,
    }
    return await indicators.ROC.calculate(rocInput)
  } catch (err) {
    throw err
  }
}
module.exports = {
  roc,
}
