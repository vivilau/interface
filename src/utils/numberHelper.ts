import { BigNumber } from '@ethersproject/bignumber'
import JSBI from 'jsbi'
export function Big2number(bignumber: BigNumber, decimal: number) {
  if (bignumber) return bignumber.div(BigNumber.from(10).pow(decimal)).toNumber()
  return bignumber
}
export function numFixed(bignumber: BigNumber, decimal: number) {
  const n = Big2number(bignumber, decimal)
  const b = n.toFixed(4)
  return b !== '0.0000' ? b : n === 0 ? '0' : '<0.0001'
}
export function JSBI2num(jsbi: JSBI, decimal: number) {
  if (jsbi) return JSBI.toNumber(JSBI.divide(jsbi, JSBI.BigInt(10 ** decimal)))
  return jsbi
}
