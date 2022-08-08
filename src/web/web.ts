
// local
import { IO } from "../io/io"

// node_modules
import { BrowserWindow } from "electron"
import pie from "puppeteer-in-electron"
import puppeteer_core from "puppeteer-core"


export namespace Web {
  export const runeTable = IO.file.get<IRuneTable>("resources/data/runeTable.json")

  export async function getBaseBuild(championName: string, app: Electron.App) {
    const browser = await pie.connect(app, puppeteer_core)

    const window = new BrowserWindow({ show: false })

    await window.loadURL(`https://u.gg/lol/champions/${championName}/build`)

    const page = await pie.getPage(browser, window)
    
    let rune_obj = await page.evaluate<[], () => IRuneWebBase>(() => {
      const rune_base = document.querySelectorAll(".recommended-build_runes")[0] 

      const rune_obj_internal: IRuneWebBase = {
        name: rune_base.querySelectorAll("div")[1].querySelectorAll("span")[0].innerHTML,
        runes: {
          // get rune tree name so we can create a rune object for the client. check '../data/runeTable.json'
          primary: rune_base.querySelectorAll(".perk-style-title")[0].innerHTML, 
          secondary: rune_base.querySelectorAll(".perk-style-title")[1].innerHTML
        },

        keystone: [
          rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[0].classList.toString().split(" ")[2],
          rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[1].classList.toString().split(" ")[2],
          rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[2].classList.toString().split(" ")[2]
        ],
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

      if (rune_obj_internal.runes.primary == "Precision" || rune_obj_internal.runes.primary == "Domination") 
        rune_obj_internal.keystone.push( rune_base.querySelectorAll(".perks")[0].querySelectorAll("div")[3].classList.toString().split(" ")[2] )

      if (rune_obj_internal.runes.primary == "Domination") 
        rune_obj_internal.primary_perks[2].push( rune_base.querySelectorAll(".perks")[3].querySelectorAll("div")[3].classList.toString().split(" ")[1] )

      if (rune_obj_internal.runes.secondary == "Domination") 
        rune_obj_internal.secondary_perks[2].push( rune_base.querySelectorAll(".perks")[6].querySelectorAll("div")[3].classList.toString().split(" ")[1] )

      return rune_obj_internal
    })

    window.destroy()

    return rune_obj 
  }

  export function formRune(rune_obj: IRuneWebBase, runePrefix: string): IRune {
    const keystone = runeTable.data.keyStones[ rune_obj.runes.primary ][ Object.keys( runeTable.data.keyStones[ rune_obj.runes.primary ] )[ rune_obj.keystone.indexOf("perk-active") ] ]

    const styles_rebuilt: number[][] = [
      [runeTable.data.styles.AdaptiveForce, runeTable.data.styles.AttackSpeed, runeTable.data.styles.CDRScaling],
      [runeTable.data.styles.AdaptiveForce, runeTable.data.styles.Armor, runeTable.data.styles.MagicRes],
      [runeTable.data.styles.HealthScaling,  runeTable.data.styles.Armor, runeTable.data.styles.MagicRes]
    ]
    
    const style_1: number = styles_rebuilt[0][ rune_obj.styles[0].indexOf("shard-active") ]
    const style_2: number = styles_rebuilt[1][ rune_obj.styles[1].indexOf("shard-active") ]
    const style_3: number = styles_rebuilt[2][ rune_obj.styles[2].indexOf("shard-active") ]

    const perk_1: number = runeTable.data.perks[ rune_obj.runes.primary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][0] )[ rune_obj.primary_perks[0].indexOf("perk-active") ] ]
    const perk_2: number = runeTable.data.perks[ rune_obj.runes.primary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][1] )[ rune_obj.primary_perks[1].indexOf("perk-active") ] ]
    const perk_3: number = runeTable.data.perks[ rune_obj.runes.primary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.primary ][2] )[ rune_obj.primary_perks[2].indexOf("perk-active") ] ]

    let second_perk_list: number[] = []

    rune_obj.secondary_perks.forEach((current_perk_row: string[]) => {
      second_perk_list.push(current_perk_row.indexOf("perk-active"))
    })

    let second_perk_1, second_perk_2

    if (second_perk_list[0] == -1) {
      second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][1] )[ rune_obj.secondary_perks[1].indexOf("perk-active") ] ]
      second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][2] )[ rune_obj.secondary_perks[2].indexOf("perk-active") ] ]
    } else if (second_perk_list[1] == -1) {
      second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][0] )[ rune_obj.secondary_perks[0].indexOf("perk-active") ] ]
      second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][2][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][2] )[ rune_obj.secondary_perks[2].indexOf("perk-active") ] ]
    } else {
      second_perk_1 = runeTable.data.perks[ rune_obj.runes.secondary ][0][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][0] )[ rune_obj.secondary_perks[0].indexOf("perk-active") ] ]
      second_perk_2 = runeTable.data.perks[ rune_obj.runes.secondary ][1][ Object.keys( runeTable.data.perks[ rune_obj.runes.secondary ][1] )[ rune_obj.secondary_perks[1].indexOf("perk-active") ] ]
    }

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

    return final_rune
  }

  export async function getRune(championName: string, runePrefix: string, app: Electron.App): Promise<IRune> {
    return getBaseBuild(championName, app).then<IRune>((base: IRuneWebBase) => formRune(base, runePrefix))
  }

  export async function getSkillOrder(championName: string, app: Electron.App): Promise<string[]> {
    const browser = await pie.connect(app, puppeteer_core)
  
    const window = new BrowserWindow({ show: false })
  
    await window.loadURL(`https://u.gg/lol/champions/${championName}/build`)
  
    const page = await pie.getPage(browser, window)
  
    let final = await page.evaluate<[], () => string[]>(() => {
      let internal_final = []
      
      const skills_q = document.querySelectorAll(".skill-order")[0].querySelectorAll("div")
      const skills_w = document.querySelectorAll(".skill-order")[1].querySelectorAll("div")
      const skills_e = document.querySelectorAll(".skill-order")[2].querySelectorAll("div")
      const skills_r = document.querySelectorAll(".skill-order")[3].querySelectorAll("div")
      
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
  
    window.destroy()
  
    return final
  }

  export interface IRuneWebBase {
    name: string
    runes: {
      primary: string
      secondary: string
    }
    keystone: string[]
    primary_perks: string[][]
    secondary_perks: string[][]
    styles: string[][]
  }
}