// local
import { IO } from "../io/io"

export namespace Config {
  export function get(): IConfig {
    return IO.file.get<IConfig>("resources/data/config.json")
  }

  export function save(config: IConfig): void {
    IO.file.write<IConfig>("resources/data/config.json", config)
  }

  export interface IConfig {
    auto: {
      acceptMatch: boolean
      champion: {
        set: boolean
        lock: boolean
        ban: boolean
        checkLane: boolean
        defaultLane: string
        lanePick: {
          [key: string]: string[]
          top: string[]
          jungle: string[]
          middle: string[]
          bottom: string[]
          utility: string[]
        }
        laneBan: {
          [key: string]: string[]
          top: string[]
          jungle: string[]
          middle: string[]
          bottom: string[]
          utility: string[]
        }
      }
      runes: {
        set: boolean
        prefix: string
      }
      spells: {
        set: boolean
        defaultLane: string
        lane: {
          [key: string]: [string, string]
          top: [string, string]
          jungle: [string, string]
          middle: [string, string]
          bottom: [string, string]
          utility: [string, string]
        }
      }
    }
    misc: {
      status: {
        text: string
        set: boolean
      }
      rank: {
        tier: string
        rank: string
        set: boolean
      },
      userScript: boolean,
    }
    overlay: boolean
  }
}