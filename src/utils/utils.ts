export namespace Utils {
  export const getKeyByValue = (object: any, value: any): string => Object.keys(object).find(key => object[key] === value) || ""
  export const reinterpret_cast = <T>(variable: any): T => (variable as T)
  export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

  export const setValueForKeyPath = <T>(object: any, value: T, keyPath: string): void => {
    if (keyPath.indexOf(".") == -1) {
      object[keyPath] = value
      return 
    }
    
    const chain = keyPath.split('.')
    const firstKey = reinterpret_cast<string>(chain.shift())
    const shiftedKeyPath = chain.join('.')

    setValueForKeyPath(object[firstKey], value, shiftedKeyPath)
  }

  export const time: Time = {
    MILLISECOND: 1,
    SECOND: 1000,
    MINUTE: 60000,
  }

  interface Time { 
    MILLISECOND: number
    SECOND: number
    MINUTE: number
  }
}