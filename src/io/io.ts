// built-in
import * as fs from "fs"

export namespace IO {
  export const file = {
    get: <T>(filename: string): T => JSON.parse(fs.readFileSync(filename).toString()),
    write: <T>(filename: string, filedata: T): void => fs.writeFileSync(filename, JSON.stringify(filedata, null, 2)),
    raw: (filename: string): string => fs.readFileSync(filename).toString()
  }
}