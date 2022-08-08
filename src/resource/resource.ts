// built-in
import fetch from "node-fetch"

// local
import { IO } from "../io/io"

export namespace Resource {
  export let DD_VERSION: string = ""

  export async function getLatestDDVersion(): Promise<string> {
    const version: string[] = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then<Promise<string[]>>((version: Response | any) => {
      return version.json()
    })

    return version[0]
  }

  export async function getItems(): Promise<IItems> {
    const version: string = await getLatestDDVersion()

    const item_data = await fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`).then<Promise<IItems>>((data: Response | any ) => {
      return data.json()
    })

    return item_data
  }

  export async function runeTable(): Promise<IRuneTable_base> {
    const version: string = await getLatestDDVersion()
    
    const rune_data: IRuneReforged[] = await fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`).then<Promise<IRuneReforged[]>>((data: Response | any) => {
      return data.json()
    })
  
    let final: IRuneTable_base = {
      runes: {},
      styles: {
        AdaptiveForce: 5008,
        CDRScaling: 5007,
        AttackSpeed: 5005,
        Armor: 5002,
        MagicRes: 5003,
        HealthScaling: 5001
      },
      keyStones: {},
      perks: {}
    }
  
    rune_data.forEach((rune: IRuneReforged) => {
      final.runes[rune.key] = rune.id
      
      final.keyStones[rune.key] = {}
      final.perks[rune.key] = [{},{},{}]
  
      rune.slots[0].runes.forEach((keyStone: IRuneBase) => {
        final.keyStones[rune.key][keyStone.key] = keyStone.id
      })
  
      for (var i = 0; i < 3; i++) {
        rune.slots[i + 1].runes.forEach((perk: IRuneBase) => {
          final.perks[rune.key][i][perk.key] = perk.id
        })
      }
    })
  
    return final
  }

  export async function championTable(): Promise<IChampionTable_base> {
    const version: string = await getLatestDDVersion()
  
    const all_champion_data: IChampionRefoged = await fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`).then<Promise<IChampionRefoged>>((data: Response | any) => {
      return data.json()
    })
  
    let final: IChampionTable_base = {}
  
    for (const champion in all_champion_data.data) {
      final[all_champion_data.data[champion].id] = parseInt(all_champion_data.data[champion].key)
    }
  
    return final
  }

  export async function update(): Promise<boolean> {
    DD_VERSION = await getLatestDDVersion()
  
    if ( IO.file.get<IChampionTable>("resources/data/championTable.json").version !== DD_VERSION ) {
      IO.file.write<IChampionTable>("resources/data/championTable.json", {
        version: DD_VERSION, data: await championTable()
      })
    }
  
    if ( IO.file.get<IRuneTable>("resources/data/runeTable.json").version !== DD_VERSION ) {
      IO.file.write<IRuneTable>("resources/data/runeTable.json", {
        version: DD_VERSION, data: await runeTable()
      })
    }
  
    if ( IO.file.get<IItems>("resources/data/items.json").version !== DD_VERSION )
      IO.file.write<IItems>("resources/data/items.json", await getItems())
    
    return true
  }

  export interface IRuneBase {
    id: number
    key: string
    icon: string
    name: string
    shortDesc: string
    longDesc: string
  }
  
  export interface IRuneReforged {
    id: number
    key: string
    icon: string
    name: string
    slots: { runes: IRuneBase[] }[]
  }

  export interface IChampion_base {
    // incomplete
    key: string
    id: number
  }

  export interface IChampionRefoged {
    type: string
    format: string
    version: string
    data: IChampion_base[]
  }
  
}