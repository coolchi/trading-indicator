const { sma } = require('../indicators/sma.js')
const { vwap } = require('../indicators/vwap.js')
const { crossover, crossunder } = require('../utils/cross.js')

const calculateMA = async (MA_FAST, MA_SLOW, input) => {
  try {
    const MA_FAST_VAL = await sma(parseInt(MA_FAST), 'close', input)
    const MA_SLOW_VAL = await sma(parseInt(MA_SLOW), 'close', input)
    return {
      fast: MA_FAST_VAL,
      slow: MA_SLOW_VAL,
    }
  } catch (err) {
    throw err
  }
}

let maFastVal
let maSlowVal
const goldenCross = async (MA_FAST, MA_SLOW, input) => {
  if (maFastVal == undefined || maSlowVal == undefined) {
    const maVal = await calculateMA(MA_FAST, MA_SLOW, input)
    maFastVal = maVal.fast
    maSlowVal = maVal.slow
  }

  return crossover(maFastVal, maSlowVal)
}

const deathCross = async (MA_FAST, MA_SLOW, input) => {
  if (maFastVal == undefined || maSlowVal == undefined) {
    const maVal = await calculateMA(MA_FAST, MA_SLOW, input)
    maFastVal = maVal.fast
    maSlowVal = maVal.slow
  }

  return crossunder(maFastVal, maSlowVal)
}

const maCross = async (MA_FAST, MA_SLOW, input) => ({
  goldenCross: await goldenCross(MA_FAST, MA_SLOW, input),
  deathCross: await deathCross(MA_FAST, MA_SLOW, input),
})

const priceCrossSMA = async (period, input) => {
  const maVal = await sma(parseInt(period), 'close', input)
  const price = input.close.slice(-2)
  const up = crossover(price, maVal)
  const down = crossunder(price, maVal)
  return {
    cross: up || down,
    direction: up ? 'up' : down ? 'down' : 'none',
  }
}

const vwapCrossSMA = async (period, input) => {
  const vwap = await vwap(input)
  const maVal = await sma(parseInt(period), 'close', input)
  const price = vwap.slice(-2)
  const up = crossover(price, maVal)
  const down = crossunder(price, maVal)
  return {
    cross: up || down,
    direction: up ? 'up' : down ? 'down' : 'none',
  }
}

module.exports = {
  maCross,
  goldenCross,
  deathCross,
  priceCrossSMA,
  vwapCrossSMA,
}
