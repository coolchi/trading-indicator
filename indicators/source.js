const timeIndex = 0
const oIndex = 1
const hIndex = 2
const lIndex = 3
const cIndex = 4
const vIndex = 5
const detachSource = (ohlcv) => {
  const source = []
  source.open = []
  source.high = []
  source.low = []
  source.close = []
  source.volume = []
  source.timestamp = []
  if (ohlcv.length == 0) {
    return source
  }
  ohlcv.forEach((data) => {
    source.timestamp.push(data[timeIndex])
    source.open.push(data[oIndex])
    source.high.push(data[hIndex])
    source.low.push(data[lIndex])
    source.close.push(data[cIndex])
    source.volume.push(data[vIndex])
  })
  return source
}
module.exports = detachSource
