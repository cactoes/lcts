import * as utils from "./utils"
import * as data from "./form_data"

export let DD_VERSION: string

export async function update(): Promise<void> {
  // get current data dragon version
  DD_VERSION = await data.get_version()

  // update championTable if needed
  if ( utils.file.get<IChampionTable>("championTable.json").version !== DD_VERSION ) {
    utils.file.write<IChampionTable>("championTable.json", {
      version: DD_VERSION, data: await data.champion_table()
    })
  }

  // update runeTable if needed
  if ( utils.file.get<IRuneTable>("runeTable.json").version !== DD_VERSION ) {
    utils.file.write<IRuneTable>("runeTable.json", {
      version: DD_VERSION, data: await data.rune_table()
    })
  }

  // update items if needed
  if ( utils.file.get<IItems>("items.json").version !== DD_VERSION )
    utils.file.write<IItems>("runeTable.json", await data.get_items())
}