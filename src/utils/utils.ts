export namespace Utils {
  interface Time { 
    MILLISECOND: number
    SECOND: number
    MINUTE: number
  }

  export const getKeyByValue = (object: any, value: number): string => Object.keys(object).find(key => object[key] === value) || ""
  export const reinterpret_cast = <T>(variable: any): T => (variable as T)
  export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

  export const time: Time = {
    MILLISECOND: 1,
    SECOND: 1000,
    MINUTE: 60000,
  }
}