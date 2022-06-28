import * as fs from "fs"

export const getKeyByValue = (object: any, value: number): string => Object.keys(object).find(key => object[key] === value) || ""
export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

export const time: ITime = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60000,
}

export const file: IFile = {
  get: <T>(filename: string): T => JSON.parse(fs.readFileSync("resources/data/" + filename).toString()),
  write: <T>(filename: string, filedata: T): void => fs.writeFileSync("resources/data/" + filename, JSON.stringify(filedata, null, 2)),
  raw: (filename: string): string => fs.readFileSync("resources/data/" + filename).toString()
}