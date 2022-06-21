import fetch from "node-fetch"

// get most recent version of the game from riot's data dragon
export async function get_version(): Promise<string> {
  // fetch the versions
  const version: string[] = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then<Promise<string[]>>((version: Response | any) => {
    // can't change .json() return type :( | any is required
    return version.json()
  })
  // return only most recent version in riot's data dragon 
  return version[0]
}

// format/parse runes from all rune date in riot's data dragon
export async function rune_table(): Promise<IRuneTable_base> {
  // get latest ddragon version
  const version: string = await get_version()
  
  // get all the rune data
  const rune_data: IRuneReforged[] = await fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`).then<Promise<IRuneReforged[]>>((data: Response | any) => {
    // can't change .json() return type :( | any is required  
    return data.json()
  })

  // define final array
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

  // loop through all the rune types
  rune_data.forEach((rune: IRuneReforged) => {
    // save rune id of current rune
    final.runes[rune.key] = rune.id
    
    // pre fill the arrays/objs
    final.keyStones[rune.key] = {}
    final.perks[rune.key] = [{},{},{}]

    // loop through all the keystones
    rune.slots[0].runes.forEach((keyStone: IRuneBase) => {
      // and store them
      final.keyStones[rune.key][keyStone.key] = keyStone.id
    })

    // loop through all 3 perk groups
    for (var i = 0; i < 3; i++) {
      // loop through all individual perks per perk group
      rune.slots[i + 1].runes.forEach((perk: IRuneBase) => {
        // and store them
        final.perks[rune.key][i][perk.key] = perk.id
      })
    }
  })

  // return the final array
  return final
}

export async function champion_table(): Promise<IChampionTable_base> {
  // get latest ddragon version
  const version: string = await get_version()

  // get all the champion data
  const all_champion_data: IChampionRefoged = await fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`).then<Promise<IChampionRefoged>>((data: Response | any) => {
    // can't change .json() return type :( | any is required  
    return data.json()
  })

  // define final array
  let final: IChampionTable_base = {}

  // loop through all the champions 
  all_champion_data.data.forEach((champion: IChampion_base) => {
    // and store their key under their id
    final[champion.id] = parseInt(champion.key)
  })

  // return the final array
  return final
}

module.exports = {
  get_version,
  rune_table,
  champion_table,
}