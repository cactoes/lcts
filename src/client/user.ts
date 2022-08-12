// node_modules
import { app } from "electron"
import { LCIClient } from "lcinterface"

// local
import { Config } from "../config/config"
import { IO } from "../io/io"
import { Utils } from "../utils/utils"
import { Web } from "../web/web"

export namespace User {
  export const methods: Methods ={
    setStatus: async function(status: string) {
      let user_data = await LCIClient.virtualCall<IUser>(LCIClient.endpoints.user.me, "get")
      user_data.statusMessage = status
      return await LCIClient.virtualCall<IUser>(LCIClient.endpoints.user.me, "put", user_data)
    },
    setRank: async function(tier: string, rank: string) {
      let user_data = await LCIClient.virtualCall<IUser>(LCIClient.endpoints.user.me, "get")
      user_data.lol.rankedLeagueTier = tier
      user_data.lol.rankedLeagueDivision = rank
      return await LCIClient.virtualCall<IUser>(LCIClient.endpoints.user.me, "put", user_data)
    },
    setRunes: async function(currentAction: IAction) {
      const currentChampionName = Utils.getKeyByValue(IO.file.get<IChampionTable>("resources/data/championTable.json").data, currentAction.championId).toLowerCase()

      const new_rune = await Web.getRune(currentChampionName, Config.get().auto.runes.prefix, app)

      const user_runes = await LCIClient.virtualCall<ISavedRune[]>(LCIClient.endpoints.runes.runes, "get")

      const target_rune: ISavedRune | undefined = user_runes.find((rune: ISavedRune) => rune.name.startsWith(Config.get().auto.runes.prefix))

      if (target_rune)
        await LCIClient.virtualCall<void>(LCIClient.endpoints.runes.runes + `/${target_rune?.id}`, "put", new_rune)
    },
    setSpells: async function(currentAction: IAction, lane: string, spell1Id: number, spell2Id: number) {
      const summonerSpells: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      for (const lane in Config.get().auto.spells.lane) {
        summonerSpells[lane][0] = LCIClient.game.spells[ Config.get().auto.spells.lane[lane][0] ].id
        summonerSpells[lane][1] = LCIClient.game.spells[ Config.get().auto.spells.lane[lane][1] ].id
      }

      if (currentAction.completed && currentAction.type == "pick") {
        if (spell1Id !== summonerSpells[lane][0] || spell2Id !== summonerSpells[lane][1])
          await LCIClient.virtualCall<void>(LCIClient.endpoints.runes.spells, "patch", { spell1Id: summonerSpells[lane][0], spell2Id: summonerSpells[lane][1] })
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