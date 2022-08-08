// built-in
import { app } from "electron"
import { EventEmitter } from "stream"
import fetch from "node-fetch"

// local
import { Electron } from "../electron/electron"
import { Config } from "../config/config"
import { Interfaces } from "../interfaces/interfaces"
import { IO } from "../io/io"
import { Utils } from "../utils/utils"
import { Web } from "../web/web"
import { Lobby } from "./lobby"
import { User } from "./user"
import { Script } from "../script/script"

export namespace Client {
  let conected = false
  export let hasSentSkillOrder = false

  export async function awaitLogin(): Promise<boolean> {
    while (true) {
      if ( await Interfaces.game.virtualCall<void>(Interfaces.game.dest.gameflow, {}, "get", false)
        .catch<boolean>(() => false) ) {
          conected = true
          return true
        }
      
      await Utils.sleep(Utils.time.SECOND)
    }
  }

  export function disconnect(): void {
    if (conected) 
      conected = false
  }

  export function getState(): boolean {
    return conected
  }

  export declare interface GameFlow {
    on(event: "new", listner: ( gameflow: GameFlows ) => void): this

    start(): void
    stop(): void
    getCurrent(): GameFlows
    setPollInterval(pollInterval: number): void
  }

  export class GameFlow extends EventEmitter {
    static current: string
    private last: string
    private pollInterval: number
    private gameFlowTimeout: boolean | NodeJS.Timer

    constructor() {
      super()
      GameFlow.current = ""
      this.last = ""
      this.pollInterval = 1000
      this.gameFlowTimeout = false
    }

    public async start() {
      GameFlow.current = await Interfaces.game.virtualCall<string>(Interfaces.game.dest.gameflow, {}, "get").catch(() => "OutOfClient")

      if (GameFlow.current !== this.last) {
        this.emit("new", GameFlow.current)

        this.last = GameFlow.current
      }

      this.gameFlowTimeout = this.gameFlowTimeout || setInterval(this.start.bind(this), this.pollInterval)
    }

    public stop() {
      if (this.gameFlowTimeout)
        clearInterval(Utils.reinterpret_cast<NodeJS.Timer>(this.gameFlowTimeout))
    }

    public static getCurrent() {
      return this.current
    }

    public setPollInterval(pollInterval: number) {
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
      
      Script.methods.auto.kiter.attackSpeed = 1 / liveClientData.activePlayer.championStats.attackSpeed
      
      if (!hasSentSkillOrder) {
        hasSentSkillOrder = true

        const localPlayer = liveClientData.allPlayers.find(player => player.summonerName == liveClientData.activePlayer.summonerName)

        const championName: string = Utils.reinterpret_cast<IAllPlayers>(localPlayer).championName.toLowerCase()
        
        const skillOrder: string[] = await Web.getSkillOrder(championName, app)

        Electron.overlay_window.webContents.send("abilityLevelOrder", skillOrder)
      }
    } catch { /* we dont care abt any errors */ }

    await Utils.sleep(pollInterval)
    if (GameFlow.getCurrent() == Interfaces.game.gameflow.INPROGRESS)
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
      const readyCheckData = await Interfaces.lobby.virtualCall<ReadyCheck>(Interfaces.lobby.dest.readycheck, {}, "get")
      if (readyCheckData.playerResponse == "None")
        Interfaces.lobby.virtualCall<void>(Interfaces.lobby.dest.matchaccept, {}, "post", false)
    },
    championSelect: {
      champion: {
        index: {
          pick: 0,
          ban: 0
        }
      },
      runes: {
        set: false
      },

      reset: function() {
        this.champion.index.pick = 0
        this.champion.index.ban = 0
        this.runes.set = false
      },
      update: async function(pollInterval: number) {
        if (GameFlow.getCurrent() !== Interfaces.game.gameflow.CHAMPSELECT)
          return
          
        const lobby_data = await Interfaces.lobby.virtualCall<Lobby.ILobby>(Interfaces.lobby.dest.lobby, {}, "get")

        // get the data of the champion select data
        const champSelectData = await Interfaces.game.virtualCall<IChampSelect>(Interfaces.game.dest.champselect, {}, "get")

        // make sure we are still in champselect (incase someone dodged)
        if (Utils.reinterpret_cast<IRPCError>(champSelectData).httpStatus == 404)
          return

        // find ourself in the champion select data
        const localUserChampSelect = Utils.reinterpret_cast<IActor>(champSelectData.myTeam.find((player: IActor) => player.cellId == champSelectData.localPlayerCellId))

        // get our lane data
        const lane = {
          isCorrect: false,
          using: Config.get().auto.champion.defaultLane
        }

        if (lobby_data.gameConfig == undefined || (lobby_data.gameConfig.queueId !== Interfaces.lobby.queueId.ranked.solo_duo && lobby_data.gameConfig.queueId !== Interfaces.lobby.queueId.ranked.flex && lobby_data.gameConfig.queueId !== Interfaces.lobby.queueId.normal.draft)) {
          lane.isCorrect = true
        } 
        else if (localUserChampSelect.assignedPosition == lobby_data.localMember.firstPositionPreference.toLowerCase() || localUserChampSelect.assignedPosition == lobby_data.localMember.secondPositionPreference.toLowerCase()) {
          lane.isCorrect = true
          lane.using = localUserChampSelect.assignedPosition
        }


        for (const pair in champSelectData.actions) {
          for (const action in champSelectData.actions[pair]) {
            // get the current action data
            const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId
  
            // is it our action
            if (currentAction.actorCellId !== champSelectData.localPlayerCellId)
              continue
  
            // do we want to set our runes
            if (Config.get().auto.runes.set)
              User.methods.setRunes(currentAction)

            // do we want to set out spells
            if (Config.get().auto.spells.set) {
              // no need for lane check (imo)
              User.methods.setSpells(currentAction, lane.using, localUserChampSelect.spell1Id, localUserChampSelect.spell2Id)
            }

            // do we want to hover (+ lock/ban) our champion
            if (Config.get().auto.champion.set) {
              // do we want to check the lane and are we one the right lane
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
        // define all the champions we want to try and pick (from data.get<IConfig>("config.json"))
        const championPicks: ILane = convertToId(Config.get().auto.champion.lanePick)

        // define all the champions we want to try and ban (from data.get<IConfig>("config.json"))
        const championBans: ILane = convertToId(Config.get().auto.champion.laneBan)

        // check if we can do something
        if (!currentAction.isInProgress || currentAction.completed)
          return
        
        // check if this is our turn to PICK
        if (currentAction.type == "pick") {
          // check if we have a champion selected
          if (currentAction.championId == 0) // || currentAction.championId !== championPicks[lane][this.champion.index.pick]
            Interfaces.game.virtualCall<void>(Interfaces.game.dest.action + `/${currentAction.id}`, { championId: championPicks[lane][this.champion.index.pick] }, "patch", false)
          
          // check if we want to lock in our selected champion
          else if (Config.get().auto.champion.lock && currentAction.championId == championPicks[lane][this.champion.index.pick])
          Interfaces.game.virtualCall<void>(Interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][this.champion.index.pick] }, "post", false)

          // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
          else
            this.champion.index.pick = (this.champion.index.pick == championPicks[lane].length) ? 0: this.champion.index.pick + 1
        
          // check if this is our turn to BAN
        } else if (currentAction.type == "ban") {
          // check if we have a champion selected
          if (currentAction.championId == 0) // || currentAction.championId !== championBans[lane][this.champion.index.ban]
          Interfaces.game.virtualCall<void>(Interfaces.game.dest.action + `/${currentAction.id}`, { championId: championBans[lane][this.champion.index.ban] }, "patch", false)
          
          // check if we want to ban our champion
          else if (Config.get().auto.champion.ban && currentAction.championId == championBans[lane][this.champion.index.ban])
          Interfaces.game.virtualCall<void>(Interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][this.champion.index.ban] }, "post", false)

          // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
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