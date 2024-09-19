const { threewhitesoldiers } = require('technicalindicators')

const isThreeWhiteSoldiersPattern = async (input) => {
  try {
    const singleInput = {
      open: input.open.slice(-4, -1),
      high: input.high.slice(-4, -1),
      low: input.low.slice(-4, -1),
      close: input.close.slice(-4, -1),
    }
    return threewhitesoldiers(singleInput)
  } catch (err) {
    throw err
  }
}

module.exports = {
  isThreeWhiteSoldiersPattern,
}
