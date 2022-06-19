export {}
const fetch = require("node-fetch")

export const getVersion = async () => {
  const n = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
  return (await n.json())[0]
}

export async function runes() {
  const version = await getVersion()
  const data = await (await fetch(`http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`)).json()

  let final: any = {
    runes: {},
    styles: {
      "AdaptiveForce": 5008,
      "CDRScaling": 5007,
      "AttackSpeed": 5005,
      "Armor": 5002,
      "MagicRes": 5003,
      "HealthScaling": 5001
    },
    keyStones: {},
    perks: {}
  }

  data.forEach((rune: any) => {
    final.runes[rune.key] = rune.id
    final.keyStones[rune.key] = {}
    final.perks[rune.key] = [{},{},{}]

    rune.slots[0].runes.forEach((keyStone: any) => {
      final.keyStones[rune.key][keyStone.key] = keyStone.id
    })

    for (var i = 0; i < 3; i++) {
      rune.slots[i + 1].runes.forEach((perk: any) => {
        final.perks[rune.key][i][perk.key] = perk.id
      })
    }
  })

  return final
}

export const championTable = async () => {
  const v = await getVersion()
  const n = await (await fetch(`http://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`)).json()

  let d: any = {}
  for (const a in n.data)
    d[n.data[a].id] = parseInt(n.data[a].key)
  return d
}

module.exports = {
  getVersion,
  runes,
  championTable,
}