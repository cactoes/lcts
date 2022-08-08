// node_modules
import { app } from "electron"

// local
import { Config } from "../config/config"
import { Interfaces } from "../interfaces/interfaces"
import { IO } from "../io/io"
import { Utils } from "../utils/utils"
import { Web } from "../web/web"
import { Client } from "./client"

export namespace User {
  export const methods: Methods ={
    setStatus: async function(status: string) {
      let user_data = await Interfaces.user.virtualCall<IUser>(Interfaces.user.dest.me, {}, "get")
      user_data.statusMessage = status
      return await Interfaces.user.virtualCall<IUser>(Interfaces.user.dest.me, user_data, "put")
    },
    setRank: async function(tier: string, rank: string) {
      let user_data = await Interfaces.user.virtualCall<IUser>(Interfaces.user.dest.me, {}, "get")
      user_data.lol.rankedLeagueTier = tier
      user_data.lol.rankedLeagueDivision = rank
      return await Interfaces.user.virtualCall<IUser>(Interfaces.user.dest.me, user_data, "put")
    },
    setRunes: async function(currentAction: IAction) {
      if (Client.methods.championSelect.runes.set || !(currentAction.completed && currentAction.type == "pick"))
        return

      Client.methods.championSelect.runes.set

      const currentChampionName = Utils.getKeyByValue(IO.file.get<IChampionTable>("resources/data/championTable.json").data, currentAction.championId).toLowerCase()

      const new_rune = await Web.getRune(currentChampionName, Config.get().auto.runes.prefix, app)
      
      const user_runes = await Interfaces.runes.virtualCall<ISavedRune[]>(Interfaces.runes.dest.runes, {}, "get")
      
      const target_rune: ISavedRune | undefined = user_runes.find((r: ISavedRune) => r.name.startsWith(Config.get().auto.runes.prefix))

      if (target_rune)
        await Interfaces.runes.virtualCall<void>(Interfaces.runes.dest.runes + `/${target_rune?.id}`, new_rune, "put", false)
    },
    setSpells: async function(currentAction: IAction, lane: string, spell1Id: number, spell2Id: number) {
      const summonerSpells: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      for (const lane in Config.get().auto.spells.lane) {
        summonerSpells[lane][0] = Interfaces.runes.spell[ Config.get().auto.spells.lane[lane][0] ].id
        summonerSpells[lane][1] = Interfaces.runes.spell[ Config.get().auto.spells.lane[lane][1] ].id
      }

      if (currentAction.completed && currentAction.type == "pick") {
        if (spell1Id !== summonerSpells[lane][0] || spell2Id !== summonerSpells[lane][1])
          await Interfaces.runes.virtualCall<void>(Interfaces.runes.dest.spells, { spell1Id: summonerSpells[lane][0], spell2Id: summonerSpells[lane][1] }, "patch", false)
      }
    }
  }

  export interface Methods {
    setStatus(status: string): Promise<IUser>
    setRank(tier: string, rank: string): Promise<IUser>
    setRunes(currentAction: IAction): Promise<void>
    setSpells(currentAction: IAction, lane: string, spell1Id: number, spell2Id: number): Promise<void>
  }

  export interface IUser {
    availability: string
    gameName: string
    gameTag: string
    icon: number
    id: string
    lastSeenOnlineTimestamp: string
    lol: {
      challengeCrystalLevel: string
      challengeTitleSelected: string
      challengeTokensSelected: string
      championId: string
      companionId: string
      damageSkinId: string
      gameId: string
      gameMode: string
      gameQueueType: string
      gameStatus: string
      iconOverride: string
      isObservable: string
      level: string
      mapId: string
      mapSkinId: string
      masteryScore: string
      puuid: string
      queueId: string
      rankedLeagueDivision: string
      rankedLeagueQueue: string
      rankedLeagueTier: string
      rankedLosses: string
      rankedPrevSeasonDivision: string
      rankedPrevSeasonTier: string
      rankedSplitRewardLevel: string
      rankedWins: string
      regalia: string
      skinVariant: string
      skinname: string
      timeStamp: string
    }
    name: string
    patchline: string
    pid: string
    platformId: string
    product: string
    productName: string
    puuid: string
    statusMessage: string
    summary: string
    summonerId: number
    time: number
  }
}