const { rsi } = require('../indicators/rsi.js')

const calculateRSIValue = async (period, input) => {
  try {
    return await rsi(parseInt(period), 'close', input)
  } catch (err) {
    throw err
  }
}
const rsiCheck = async (period, overBoughtThreshold, overSoldThreshold, input) => {
  const rsiVals = await calculateRSIValue(period, input)
  const rsiVal = rsiVals[rsiVals.length - 1]
  return {
    overBought: rsiVal >= overBoughtThreshold,
    overSold: rsiVal <= overSoldThreshold,
    rsiVal,
  }
}

module.exports = {
  rsiCheck,
}
