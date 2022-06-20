import fetch from "node-fetch"
const DOMParser = require("jsdom")

const fs = require("fs")


const runeTable: any = JSON.parse(fs.readFileSync("data/runeTable.json").toString())

String.prototype.remove_left_side = function () {
  return this.split("-")[1]
}

async function get_base_build(champion_name: string): Promise<any> {
  const page_raw = await fetch(`https://u.gg/lol/champions/${champion_name}/build`)
  const page_data = await page_raw.text()

  const rune_base = new DOMParser.JSDOM(page_data).window.document.querySelectorAll(".recommended-build_runes")[0]

  const rune_obj = {
    name: rune_base.querySelectorAll("div")[1].querySelectorAll("span")[0].innerHTML,
    runes: {
      primary: rune_base.querySelectorAll(".perk-style-title")[0].innerHTML,
      secondary: rune_base.querySelectorAll(".perk-style-title")[1].innerHTML
    },
    keystone: [
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[0].classList[2].remove_left_side(),
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[1].classList[2].remove_left_side(),
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[2].classList[2].remove_left_side(),
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[3].classList[2].remove_left_side()
    ],

    primary_perks: [
      [
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[2].classList[1].remove_left_side()
      ],
      [
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[2].classList[1].remove_left_side()
      ],
      [
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[2].classList[1].remove_left_side()
      ]
    ],

    secondary_perks: [
      [
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[2].classList[1].remove_left_side()
      ],
      [
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[2].classList[1].remove_left_side()
      ],
      [
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[2].classList[1].remove_left_side()
      ]
    ],

    styles: [
      [
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[2].classList[1].remove_left_side()
      ],
      [
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[2].classList[1].remove_left_side()
      ],
      [
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[0].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[1].classList[1].remove_left_side(),
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[2].classList[1].remove_left_side()
      ]
    ]
  }

  return rune_obj
}

function from_rune(rune_obj: any) {

  const keystone = runeTable.data.keyStones[ rune_obj.runes.primary ][ Object.keys( runeTable.data.keyStones[ rune_obj.runes.primary ] )[ rune_obj.keystone.indexOf("active") ] ]

  const styles_rebuilt: number[][] = [
    [runeTable.data.styles.AdaptiveForce, runeTable.data.styles.AttackSpeed, runeTable.data.styles.CDRScaling],
    [runeTable.data.styles.AdaptiveForce, runeTable.data.styles.Armor, runeTable.data.styles.MagicRes],
    [runeTable.data.styles.HealthScaling,  runeTable.data.styles.Armor, runeTable.data.styles.MagicRes]
  ]

  const style_1: number = styles_rebuilt[0][ rune_obj.styles[0].indexOf("active") ]
  const style_2: number = styles_rebuilt[1][ rune_obj.styles[1].indexOf("active") ]
  const style_3: number = styles_rebuilt[2][ rune_obj.styles[2].indexOf("active") ]

  const perk_1: number = runeTable.data.perks[ rune_obj.runes.primary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][0] )[ rune_obj.primary_perks[0].indexOf("active") ] ]
  const perk_2: number = runeTable.data.perks[ rune_obj.runes.primary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][1] )[ rune_obj.primary_perks[1].indexOf("active") ] ]
  const perk_3: number = runeTable.data.perks[ rune_obj.runes.primary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][2] )[ rune_obj.primary_perks[2].indexOf("active") ] ]

  let second_perk_list: number[] = []

  rune_obj.secondary_perks.forEach((p: any) => {
    second_perk_list.push(p.indexOf("active"))
  })

  let second_perk_1, second_perk_2

  if (second_perk_list[0] == -1) { // 2nd, 3rd
    second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][1] )[ rune_obj.secondary_perks[1].indexOf("active") ] ]
    second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][2] )[ rune_obj.secondary_perks[2].indexOf("active") ] ]
  } else if (second_perk_list[1] == -1) { // 1st, 3rd
    second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][0] )[ rune_obj.secondary_perks[0].indexOf("active") ] ]
    second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][2] )[ rune_obj.secondary_perks[2].indexOf("active") ] ]
  } else { // 1st, 2nd
    second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][0] )[ rune_obj.secondary_perks[0].indexOf("active") ] ]
    second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][1] )[ rune_obj.secondary_perks[1].indexOf("active") ] ]
  }

  let final_rune = {
    current: true,
    name: "[u.gg] " + rune_obj.name,
    primaryStyleId: runeTable.data.runes[rune_obj.runes.primary],
    selectedPerkIds: [
      keystone,
      perk_1,
      perk_2,
      perk_3,
      second_perk_1,
      second_perk_2,
      style_1,
      style_2,
      style_3
    ],
    subStyleId: runeTable.data.runes[rune_obj.runes.secondary],
  }

  return final_rune
}

export async function get_rune_from_web(champion_name: string): Promise<IRune> {
  const base = await get_base_build(champion_name)
  return from_rune(base)
}