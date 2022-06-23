import fetch from "node-fetch"
import { parse } from 'node-html-parser'
const fs = require("fs")
const runeTable: IRuneTable = JSON.parse(fs.readFileSync("resources/data/runeTable.json").toString())

String.prototype.get_item = function(index: number) {
  return this.split(" ")[index]
}

async function get_base_build(champion_name: string): Promise<IRuneWebBase> {
  // get champion rune page from u.gg in text from
  const page_data: string = await fetch(`https://u.gg/lol/champions/${champion_name}/build`).then<Promise<string>>((value: Response | any) => {
    // can't change .text() return type :( | any is required
    return value.text()
  })

  // parse the text as an html element and select runes part of the DOM
  const rune_base: any = parse(page_data).querySelectorAll(".recommended-build_runes")[0] 
  
  // form the rune base for later parsing
  const rune_obj: IRuneWebBase = {
    name: rune_base.querySelectorAll("div")[1].querySelectorAll("span")[0].innerHTML,
    runes: {
      // get rune tree name so we can create a rune object for the client. check '../data/runeTable.json'
      primary: rune_base.querySelectorAll(".perk-style-title")[0].innerHTML, 
      secondary: rune_base.querySelectorAll(".perk-style-title")[1].innerHTML
    },

    // get keystone
    keystone: [
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[0].classList.toString().get_item(2),
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[1].classList.toString().get_item(2),
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[2].classList.toString().get_item(2)
    ],

    primary_perks: [
      // get primary perks
      [
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[2].classList.toString().get_item(1)
      ],
      [
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[2].classList.toString().get_item(1)
      ],
      [
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[2].classList.toString().get_item(1)
      ]
    ],

    secondary_perks: [
      // get primary perks
      [
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[2].classList.toString().get_item(1)
      ],
      [
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[2].classList.toString().get_item(1)
      ],
      [
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[2].classList.toString().get_item(1)
      ]
    ],

    styles: [
      // get extra runes (called styles by leagueApi and U.gg)
      [
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[2].classList.toString().get_item(1)
      ],
      [
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[2].classList.toString().get_item(1)
      ],
      [
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[0].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[1].classList.toString().get_item(1),
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[2].classList.toString().get_item(1)
      ]
    ]
  }
  
  // if there are 4 keystones
  if (rune_obj.runes.primary == "Precision" || rune_obj.runes.primary == "Domination") 
    rune_obj.keystone.push( rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[3].classList.toString().get_item(2) )

  // if there are 4 perks in last row (Primary)
  if (rune_obj.runes.primary == "Domination") 
    rune_obj.primary_perks[2].push( rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[3].classList.toString().get_item(1) )
  
  // if there are 4 perks in last row (Secondary)
  if (rune_obj.runes.primary == "Domination") 
    rune_obj.secondary_perks[2].push( rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[3].classList.toString().get_item(1) )

  // return total rune object
  return rune_obj 
}

// form a rune template for handler
function form_rune(rune_obj: IRuneWebBase, runePrefix: string): IRune { 
  // get active ("perk-active") keystone id based on rune tree. (Ex. domination -> hail of blades) see '../data/runeTable.json'
  const keystone = runeTable.data.keyStones[ rune_obj.runes.primary ][ Object.keys( runeTable.data.keyStones[ rune_obj.runes.primary ] )[ rune_obj.keystone.indexOf("perk-active") ] ]

  // format the styles for ease of use (this is the same layout as in game, '../data/runeTable.json' has just a list)
  const styles_rebuilt: number[][] = [
    [runeTable.data.styles.AdaptiveForce, runeTable.data.styles.AttackSpeed, runeTable.data.styles.CDRScaling],
    [runeTable.data.styles.AdaptiveForce, runeTable.data.styles.Armor, runeTable.data.styles.MagicRes],
    [runeTable.data.styles.HealthScaling,  runeTable.data.styles.Armor, runeTable.data.styles.MagicRes]
  ]
  
  // get active ("shard-active") style per style row
  const style_1: number = styles_rebuilt[0][ rune_obj.styles[0].indexOf("shard-active") ]
  const style_2: number = styles_rebuilt[1][ rune_obj.styles[1].indexOf("shard-active") ]
  const style_3: number = styles_rebuilt[2][ rune_obj.styles[2].indexOf("shard-active") ]

  // get active ("perk-active") perk from primary rune tree. (Ex. domination -> CheapShot & Zombie Ward & Ultimate Hunter)
  const perk_1: number = runeTable.data.perks[ rune_obj.runes.primary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][0] )[ rune_obj.primary_perks[0].indexOf("perk-active") ] ]
  const perk_2: number = runeTable.data.perks[ rune_obj.runes.primary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][1] )[ rune_obj.primary_perks[1].indexOf("perk-active") ] ]
  const perk_3: number = runeTable.data.perks[ rune_obj.runes.primary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][2] )[ rune_obj.primary_perks[2].indexOf("perk-active") ] ]

  // initialise second perk tree list
  let second_perk_list: number[] = []

  // loop through all 3 perk rows
  rune_obj.secondary_perks.forEach((current_perk_row: string[]) => {
    // get active perk in row (if there is any, bc you can only have 2 out of 3 perks)
    second_perk_list.push(current_perk_row.indexOf("perk-active"))
  })

  // define first and second perk from second perk tree
  let second_perk_1, second_perk_2

  // get active ("perk-active") perk from secondary rune tree. (Ex. domination -> CheapShot & Zombie Ward)
  if (second_perk_list[0] == -1) {
    // second and third row had an active perk. first row was empty
    second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][1] )[ rune_obj.secondary_perks[1].indexOf("perk-active") ] ]
    second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][2] )[ rune_obj.secondary_perks[2].indexOf("perk-active") ] ]
  } else if (second_perk_list[1] == -1) {
    // first and third row had an active perk. second row was empty
    second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][0] )[ rune_obj.secondary_perks[0].indexOf("perk-active") ] ]
    second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][2] )[ rune_obj.secondary_perks[2].indexOf("perk-active") ] ]
  } else {
    // first and second row had an active perk. third row was empty
    second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][0] )[ rune_obj.secondary_perks[0].indexOf("perk-active") ] ]
    second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][1] )[ rune_obj.secondary_perks[1].indexOf("perk-active") ] ]
  }

  // setting perks to a format leagueApi can handle
  let final_rune: IRune = {
    current: true,
    name: `${runePrefix} ` + rune_obj.name,
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

  // return the final rune
  return final_rune
}


// combine into one function for easy use & export
export async function get_rune_from_web(champion_name: string, runePrefix: string): Promise<IRune> {
  // get base rune data
  return get_base_build(champion_name).then<IRune>((base: IRuneWebBase) => {
    // format the runes so league client can use it
    return form_rune(base, runePrefix)
  })
}