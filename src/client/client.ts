// built-in
import fetch from "node-fetch"

// node_modules
import { LCIClient } from "lcinterface"
import { app } from "electron"

// local
import { Electron } from "../electron/electron"
import { Config } from "../config/config"
import { IO } from "../io/io"
import { Utils } from "../utils/utils"
import { Web } from "../web/web"
import { Lobby } from "./lobby"
import { User } from "./user"
import { Script } from "../script/script"

export namespace Client {
  let conected = false
  export let hasSentSkillOrder = false

  export async function connect(): Promise<boolean> {
    while (true) {
      if ( await LCIClient.virtualCall<void>(LCIClient.endpoints.game.gameflow, "get").catch<boolean>(() => false) ) {
          conected = true
          GameFlow.start()
          return true
        }
      await Utils.sleep(Utils.time.SECOND)
    }
  }

  export function disconnect(): void {
    if (conected) {
      conected = false
      GameFlow.stop()
    }
  }

  export function getState(): boolean {
    return conected
  }

  export interface IGameFlow {
    current: GameFlows
    last: string
    pollInterval: number
    gameFlowTimeout: boolean | NodeJS.Timer

    start(): void
    stop(): void
    getCurrent(): GameFlows
    setPollInterval(pollInterval: number): void
  }

  export const GameFlow: IGameFlow = {
    current: "OutOfClient",
    last: "",
    pollInterval: 1000,
    gameFlowTimeout: false,

    start: async function() {
      this.current = await LCIClient.virtualCall<GameFlows>(LCIClient.endpoints.game.gameflow, "get").catch(() => "OutOfClient")

      if (this.current !== this.last) {
        switch (this.current) {
          case LCIClient.game.gameflows.NONE:
            break
          case LCIClient.game.gameflows.LOBBY:
            if (Config.get().misc.userScript)
              Script.event.onPartyJoin()
            break
          case LCIClient.game.gameflows.MATCHMAKING:
            break
          case LCIClient.game.gameflows.READYCHECK:
            if (Config.get().auto.acceptMatch)
              Client.methods.acceptMatch()
            break
          case LCIClient.game.gameflows.CHAMPSELECT:
            Client.methods.championSelect.update(Utils.time.SECOND)
            break
          case LCIClient.game.gameflows.INPROGRESS:
            Client.updateGameData(Utils.time.SECOND)
            break
          case LCIClient.game.gameflows.ENDOFGAME:
            break
          case LCIClient.game.gameflows.WAITINGFORSTATS:
            break
        }
      
        if (this.current !== LCIClient.game.gameflows.INPROGRESS) {
          Client.hasSentSkillOrder = false
          Client.methods.championSelect.reset()
        }

        this.last = this.current
      }

      this.gameFlowTimeout = this.gameFlowTimeout || setInterval(this.start.bind(this), this.pollInterval)
    },

    stop: function() {
      if (this.gameFlowTimeout)
        clearInterval(Utils.reinterpret_cast<NodeJS.Timer>(this.gameFlowTimeout))
    },

    getCurrent: function() {
      return this.current
    },

    setPollInterval: function(pollInterval: number) {
      this.pollInterval = pollInterval
    }
  }

  export async function updateGameData(pollInterval: number) {
    try {
      const liveClientData = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata").then<Promise<ILiveClientData>>((response: Response | any) => {
        return response.json()
      })
      
      if (Utils.reinterpret_cast<IRPCError>(liveClientData).httpStatus == 404)
        throw new RPCError()
      
      Electron.overlay_window.webContents.send("liveClientData", liveClientData)

      if (!hasSentSkillOrder) {
        hasSentSkillOrder = true

        const localPlayer = liveClientData.allPlayers.find(player => player.summonerName == liveClientData.activePlayer.summonerName)

        const championName: string = Utils.reinterpret_cast<IAllPlayers>(localPlayer).championName.toLowerCase()
        
        const skillOrder: string[] = await Web.getSkillOrder(championName, app)

        Electron.overlay_window.webContents.send("abilityLevelOrder", skillOrder)
      }
    } catch { /* fetch failed means we are no longer in game */ }

    await Utils.sleep(pollInterval)
    if (GameFlow.getCurrent() == LCIClient.game.gameflows.INPROGRESS)
      updateGameData(pollInterval)
  }

   function convertToId(laneObj: any): ILane {
    Object.keys(laneObj).map(function(lane: string) {
      laneObj[lane] = laneObj[lane].map((champion: string) => IO.file.get<IChampionTable>("resources/data/championTable.json").data[champion])
    })
  
    return Utils.reinterpret_cast<ILane>(laneObj)
  }

  export const methods = {
    acceptMatch: async function() {
      const readyCheckData = await LCIClient.virtualCall<ReadyCheck>(LCIClient.endpoints.lobby.readycheck, "get")
      if (readyCheckData.playerResponse == "None")
        LCIClient.virtualCall<void>(LCIClient.endpoints.lobby.matchaccept, "post")
    },
    championSelect: {
      champion: {
        index: {
          pick: 0,
          ban: 0
        }
      },
      setRunes: false,
      setSpells: false,

      reset: function() {
        this.champion.index.pick = 0
        this.champion.index.ban = 0
        this.setRunes = false
        this.setSpells = false
      },

      update: async function(pollInterval: number) {
        if (GameFlow.getCurrent() !== LCIClient.game.gameflows.CHAMPSELECT)
          return
          
        const lobbyData = await LCIClient.virtualCall<Lobby.ILobby>(LCIClient.endpoints.lobby.lobby, "get")

        const champSelectData = await LCIClient.virtualCall<IChampSelect>(LCIClient.endpoints.game.champselect, "get")

        if (Utils.reinterpret_cast<IRPCError>(champSelectData).httpStatus == 404)
          return

        const localUserChampSelect = Utils.reinterpret_cast<IActor>(champSelectData.myTeam.find((player: IActor) => player.cellId == champSelectData.localPlayerCellId))

        const lane = {
          isCorrect: false,
          using: Config.get().auto.champion.defaultLane
        }

        if (lobbyData.gameConfig == undefined || (lobbyData.gameConfig.queueId !== LCIClient.game.queueId.ranked.solo_duo && lobbyData.gameConfig.queueId !== LCIClient.game.queueId.ranked.flex && lobbyData.gameConfig.queueId !== LCIClient.game.queueId.normal.draft)) {
          lane.isCorrect = true
        } 
        else if (localUserChampSelect.assignedPosition == lobbyData.localMember.firstPositionPreference.toLowerCase() || localUserChampSelect.assignedPosition == lobbyData.localMember.secondPositionPreference.toLowerCase()) {
          lane.isCorrect = true
          lane.using = localUserChampSelect.assignedPosition
        }

        for (const pair in champSelectData.actions) {
          for (const action in champSelectData.actions[pair]) {
            const currentAction: IAction = champSelectData.actions[pair][action]
  
            if (currentAction.actorCellId !== champSelectData.localPlayerCellId)
              continue
  
            if (Config.get().auto.runes.set && !this.setRunes) {
              if (currentAction.completed && currentAction.type == "pick") {
                this.setRunes = true
                User.methods.setRunes(currentAction)
              }
            }

            if (Config.get().auto.spells.set && !this.setSpells) {
              this.setSpells = true
              User.methods.setSpells(currentAction, lane.using, localUserChampSelect.spell1Id, localUserChampSelect.spell2Id)
            }

            if (Config.get().auto.champion.set) {
              if (Config.get().auto.champion.checkLane) {
                if (lane.isCorrect)
                  this.hoverBanLock(currentAction, lane.using)
              }
              else
                this.hoverBanLock(currentAction, lane.using)
            }
          }
        }

        await Utils.sleep(pollInterval)
        this.update(pollInterval)
      },

      hoverBanLock: async function(currentAction: IAction, lane: string) {
        const championPicks: ILane = convertToId(Config.get().auto.champion.lanePick)

        const championBans: ILane = convertToId(Config.get().auto.champion.laneBan)

        if (!currentAction.isInProgress || currentAction.completed)
          return
        
        if (currentAction.type == "pick") {
          if (currentAction.championId == 0) // || currentAction.championId !== championPicks[lane][this.champion.index.pick]
            LCIClient.virtualCall<void>(LCIClient.endpoints.game.action + `/${currentAction.id}`, "patch", { championId: championPicks[lane][this.champion.index.pick] })
          
          else if (Config.get().auto.champion.lock && currentAction.championId == championPicks[lane][this.champion.index.pick])
            LCIClient.virtualCall<void>(LCIClient.endpoints.game.action + `/${currentAction.id}/complete`, "post", { championId: championPicks[lane][this.champion.index.pick] })

          else
            this.champion.index.pick = (this.champion.index.pick == championPicks[lane].length) ? 0: this.champion.index.pick + 1
        
        } else if (currentAction.type == "ban") {
          if (currentAction.championId == 0) // || currentAction.championId !== championBans[lane][this.champion.index.ban]
            LCIClient.virtualCall<void>(LCIClient.endpoints.game.action + `/${currentAction.id}`, "patch", { championId: championBans[lane][this.champion.index.ban] })
          
          else if (Config.get().auto.champion.ban && currentAction.championId == championBans[lane][this.champion.index.ban])
            LCIClient.virtualCall<void>(LCIClient.endpoints.game.action + `/${currentAction.id}/complete`, "post", { championId: championPicks[lane][this.champion.index.ban] })

          else
            this.champion.index.ban = (this.champion.index.ban == championBans[lane].length) ? 0: this.champion.index.ban + 1
        }
      }
    }
  }

  export class RPCError extends Error {
    constructor() {
      super("Can igonre, just make sure to catch")
    }
  }

  export interface ReadyCheck {
    declinerIds: number[]
    dodgeWarning: string
    playerResponse: string
    state: string
    suppressUx: boolean
    timer: number
  }

  export interface IChampSelect {
    actions: IAction[][]
    allowBattleBoost: boolean
    allowDuplicatePicks: boolean
    allowLockedEvents: boolean
    allowRerolling: boolean
    allowSkinSelection: boolean
    bans: { myTeamBans: string[], numBans: number, theirTeamBans: string[] }
    benchChampionIds: number[]
    benchEnabled: boolean
    boostableSkinCount: number
    chatDetails: {
      chatRoomName: string
      chatRoomPassword: string
    }
    counter: number
    entitledFeatureState: { additionalRerolls: number, unlockedSkinIds: number[] }
    gameId: number
    hasSimultaneousBans: boolean
    hasSimultaneousPicks: boolean
    isCustomGame: boolean
    isSpectating: boolean
    localPlayerCellId: number
    lockedEventIndex: number
    myTeam: IActor[]
    recoveryCounter: number
    rerollsRemaining: number
    skipChampionSelect: false
    theirTeam: IActor[]
    timer: {
      adjustedTimeLeftInPhase: number
      internalNowInEpochMs: number
      isInfinite: boolean
      phase: string
      totalTimeInPhase: number
    }
    trades: any[]
  }
  
  export interface IActor {
    assignedPosition: string
    cellId: number
    championId: number
    championPickIntent: number
    entitledFeatureType: string
    selectedSkinId: number
    spell1Id: number
    spell2Id: number
    summonerId: number
    team: number
    wardSkinId: number
  }
}