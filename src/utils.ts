import * as fs from "fs"

export const getKeyByValue = (object: any, value: number): string => Object.keys(object).find(key => object[key] === value) || ""
export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))
export const reinterpret_cast = <T>(variable: any): T => (variable as T)

export const time: ITime = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60000,
}
export const lanes: string[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]

export const file: IFile = {
  get: <T>(filename: string): T => JSON.parse(fs.readFileSync("resources/data/" + filename).toString()),
  write: <T>(filename: string, filedata: T): void => fs.writeFileSync("resources/data/" + filename, JSON.stringify(filedata, null, 2)),
  raw: (filename: string): string => fs.readFileSync("resources/data/" + filename).toString()
}

export const convertToId = (laneObj: any): ILane => {
  Object.keys(laneObj).map(function(lane: string) {
    laneObj[lane] = laneObj[lane].map((champion: string) => file.get<IChampionTable>("championTable.json").data[champion])
  })

  return reinterpret_cast<ILane>(laneObj)
}