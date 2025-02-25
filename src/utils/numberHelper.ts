import { BigNumber } from '@ethersproject/bignumber'
import JSBI from 'jsbi'
export function Big2number(bignumber: BigNumber, decimal: number) {
  if (bignumber) return bignumber?.div(BigNumber.from(10).pow(decimal - 4)).toNumber() / 10 ** 4
  return bignumber
}
export function numFixed(bignumber: BigNumber | undefined, decimal: number) {
  const n = bignumber && Big2number(bignumber, decimal)
  const b = n?.toFixed(4)
  return b !== '0.0000' ? b : bignumber?.eq(0) ? '0' : '<0.0001'
}
export function JSBI2num(jsbi: JSBI, decimal: number) {
  if (jsbi) return JSBI.toNumber(JSBI.divide(jsbi, JSBI.BigInt(10 ** (decimal - 4)))) / 10 ** 4
  return jsbi
}

export function dateFormat(longTypeDate: BigNumber) {
  let dateType = ''
  const date = new Date()
  date.setTime(longTypeDate.toNumber() * 1000)
  const month = date.getMonth() + 1
  dateType = date.getFullYear() + '-' + month + '-' + date.getDate() //yyyy-MM-dd格式日期
  return dateType
}
