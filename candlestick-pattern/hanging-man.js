const isHangingManPattern = async (input) => {
  try {
    const last = input.open.length - 1
    if (last < 4) {
      console.error(`Require OHLCV of last 5 candles`)
      return false
    }
    let body = input.close[last] - input.open[last]
    const beard = body > 0 ? input.open[last] - input.low[last] : input.close[last] - input.low[last]
    body = Math.abs(body)

    if (beard < 2 * body) {
      return false
    }
    if (input.open[0] - input.close[last - 1] > 0) {
      return false
    }
    return true
  } catch (err) {
    console.error(`Require OHLCV of last 5 candles`)
    return false
  }
}

module.exports = {
  isHangingManPattern,
}
