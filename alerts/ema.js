const { ema } = require('../indicators/ema.js')
const { crossover, crossunder } = require('../utils/cross.js')

const calculateEMA = async (EMA_FAST, EMA_SLOW, input) => {
  try {
    const EMA_FAST_VAL = await ema(parseInt(EMA_FAST), 'close', input)
    const EMA_SLOW_VAL = await ema(parseInt(EMA_SLOW), 'close', input)
    return {
      fast: EMA_FAST_VAL,
      slow: EMA_SLOW_VAL,
    }
  } catch (err) {
    throw err
  }
}

// let emaFastVal, emaSlowVal
const egoldenCross = async (EMA_FAST, EMA_SLOW, input) => {
  let emaFastVal
  let emaSlowVal

  // if (emaFastVal == undefined || emaSlowVal == undefined) {
  const emaVal = await calculateEMA(EMA_FAST, EMA_SLOW, input)
  emaFastVal = emaVal.fast
  emaSlowVal = emaVal.slow
  // }

  return crossover(emaFastVal, emaSlowVal)
}

const edeathCross = async (EMA_FAST, EMA_SLOW, input) => {
  let emaFastVal
  let emaSlowVal
  // if (emaFastVal == undefined || emaSlowVal == undefined) {
  const emaVal = await calculateEMA(EMA_FAST, EMA_SLOW, input)
  emaFastVal = emaVal.fast
  emaSlowVal = emaVal.slow
  // }

  return crossunder(emaFastVal, emaSlowVal)
}

const emaCross = async (EMA_FAST, EMA_SLOW, input) => ({
  egoldenCross: await egoldenCross(EMA_FAST, EMA_SLOW, input),
  edeathCross: await edeathCross(EMA_FAST, EMA_SLOW, input),
})

const priceCrossEMA = async (period, input) => {
  const maVal = await ema(parseInt(period), 'close', input)
  const price = input.slice(-2)
  const up = crossover(price, maVal)
  const down = crossunder(price, maVal)
  return {
    cross: up || down,
    direction: up ? 'up' : down ? 'down' : 'none',
  }
}

const vwapCrossEMA = async (period, input) => {
  const vwap = await vwap(input)
  const maVal = await ema(parseInt(period), 'close', input)
  const price = vwap.slice(-2)
  const up = crossover(price, maVal)
  const down = crossunder(price, maVal)
  return {
    cross: up || down,
    direction: up ? 'up' : down ? 'down' : 'none',
  }
}

module.exports = {
  emaCross,
  priceCrossEMA,
  vwapCrossEMA,
}
