import * as utils from "./utils"
import puppeteer from "puppeteer"

import { BrowserWindow } from "electron"
import pie from "puppeteer-in-electron"
import puppeteer_core from "puppeteer-core"

const runeTable = utils.file.get<IRuneTable>("runeTable.json")

async function get_base_build(champion_name: string, app: Electron.App): Promise<IRuneWebBase> {
  // i wanna cry
  
  // load the browser
  const browser = await pie.connect(app, puppeteer_core)

  // create a hidden electron window
  const window = new BrowserWindow({ show: false })

  // load the page on that window
  await window.loadURL(`https://u.gg/lol/champions/${champion_name}/build`)

  // get the page data
  const page = await pie.getPage(browser, window)
  
  // page.evaluate create the object for later parsing
  let rune_obj = await page.evaluate<[], () => IRuneWebBase>(() => {
    // parse the text as an html element and select runes part of the DOM
    const rune_base = document.querySelectorAll(".recommended-build_runes")[0] 

    // form the rune base for later parsing
    const rune_obj_internal: IRuneWebBase = {
    name: rune_base.querySelectorAll("div")[1].querySelectorAll("span")[0].innerHTML,
    runes: {
      // get rune tree name so we can create a rune object for the client. check '../data/runeTable.json'
      primary: rune_base.querySelectorAll(".perk-style-title")[0].innerHTML, 
      secondary: rune_base.querySelectorAll(".perk-style-title")[1].innerHTML
    },

    // get keystone
    keystone: [
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[0].classList.toString().split(" ")[2],
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[1].classList.toString().split(" ")[2],
      rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[2].classList.toString().split(" ")[2]
    ],

    // get primary perks
    primary_perks: [
      [
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[1].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ],
      [
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[2].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ],
      [
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ]
    ],

    // get secondary perks
    secondary_perks: [
      [
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[4].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ],
      [
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[5].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ],
      [
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ]
    ],

    // get extra runes (called styles by leagueApi and U.gg)
    styles: [
      [
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[7].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ],
      [
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[8].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ],
      [
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[0].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[1].classList.toString().split(" ")[1],
        rune_base.querySelectorAll(".perks")[9].querySelectorAll("div")[2].classList.toString().split(" ")[1]
      ]
    ]
    }

    // if there are 4 keystones
    if (rune_obj_internal.runes.primary == "Precision" || rune_obj_internal.runes.primary == "Domination") 
    rune_obj_internal.keystone.push( rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[3].classList.toString().split(" ")[2] )

    // if there are 4 perks in last row (Primary)
    if (rune_obj_internal.runes.primary == "Domination") 
    rune_obj_internal.primary_perks[2].push( rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[3].classList.toString().split(" ")[1] )

    // if there are 4 perks in last row (Secondary)
    if (rune_obj_internal.runes.secondary == "Domination") 
    rune_obj_internal.secondary_perks[2].push( rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[3].classList.toString().split(" ")[1] )

    return rune_obj_internal
  })

  // close the electron window
  window.destroy()

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
export async function get_rune(champion_name: string, runePrefix: string, app: Electron.App): Promise<IRune> {
  // get base rune data
  return get_base_build(champion_name, app).then<IRune>((base: IRuneWebBase) => {
    // format the runes so league client can use it
    return form_rune(base, runePrefix)
  })
}

// returns the skill order of requested champion
export async function get_skill_order(champion_name: string, app: Electron.App): Promise<string[]> {
  // i wanna cry

  // load the browser
  const browser = await pie.connect(app, puppeteer_core)

  // create a hidden electron window
  const window = new BrowserWindow({ show: false })

  // load the page on that window
  await window.loadURL(`https://u.gg/lol/champions/${champion_name}/build`)

  // get the page data
  const page = await pie.getPage(browser, window)

  // page.evalute just returns our original skill order array
  let final = await page.evaluate<[], () => string[]>(() => {
    let internal_final = []
    
    // get elements of our skills
    const skills_q = document.querySelectorAll(".skill-order")[0].querySelectorAll("div")
    const skills_w = document.querySelectorAll(".skill-order")[1].querySelectorAll("div")
    const skills_e = document.querySelectorAll(".skill-order")[2].querySelectorAll("div")
    const skills_r = document.querySelectorAll(".skill-order")[3].querySelectorAll("div")
    
    // loop through our skills
    // skills_X.length == 36
    for (var i = 0; i < 36; i++) {
      if(skills_q[i].classList.toString().startsWith("skill-up "))
        internal_final[parseInt(skills_q[i].querySelectorAll("div")[0].innerHTML) - 1] = "q"
      
      if(skills_w[i].classList.toString().startsWith("skill-up "))
        internal_final[parseInt(skills_w[i].querySelectorAll("div")[0].innerHTML) - 1] = "w"

      if(skills_e[i].classList.toString().startsWith("skill-up ")) 
        internal_final[parseInt(skills_e[i].querySelectorAll("div")[0].innerHTML) - 1] = "e"
      
      if(skills_r[i].classList.toString().startsWith("skill-up "))
        internal_final[parseInt(skills_r[i].querySelectorAll("div")[0].innerHTML) - 1] = "r"
    }

    return internal_final
  })

  // close the electron window
  window.destroy()

  // return our skills
  return final
}