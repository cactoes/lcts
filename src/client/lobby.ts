import { Interfaces } from "../interfaces/interfaces"

export namespace Lobby {
  export const methods: Methods = {
    setLanes: async function(firstPreference: string, secondPreference: string) {
      return await Interfaces.lobby.virtualCall<Promise<void>>(Interfaces.lobby.dest.position, { firstPreference, secondPreference }, "put", false)
    },
    create: async function(queueId: number) {
      return await Interfaces.lobby.virtualCall<Promise<ILobby>>(Interfaces.lobby.dest.lobby, { queueId }, "post")
    },
    leave: async function() {
      return await Interfaces.lobby.virtualCall<Promise<void>>(Interfaces.lobby.dest.lobby, { }, "delete", false)
    },
    setPartyType: async function(type: string) {
      return await Interfaces.lobby.virtualCall<Promise<void>>(Interfaces.lobby.dest.partytype, type, "put", false)
    },
    startSearch: async function() {
      return await Interfaces.lobby.virtualCall<Promise<void>>(Interfaces.lobby.dest.search, {}, "post", false)
    },
    stopSearch: async function() {
      return await Interfaces.lobby.virtualCall<Promise<void>>(Interfaces.lobby.dest.search, {}, "delete", false)
    }
  }

  export interface Methods {
    setLanes(first: string, second: string): Promise<void>
    create(queueId: number): Promise<ILobby>
    leave(): Promise<void>
    setPartyType(type: string): Promise<void>
    startSearch(): Promise<void>
    stopSearch(): Promise<void>
  }

  export interface ILobby {
    canStartActivity: boolean
    chatRoomId: string
    chatRoomKey: string
    gameConfig: {
      allowablePremadeSizes: number[]
      customLobbyName: string
      customMutatorName: string
      customRewardsDisabledReasons: any[]
      customSpectatorPolicy: string
      customSpectators: any[]
      customTeam100: any[]
      customTeam200: any[]
      gameMode: string
      isCustom: boolean
      isLobbyFull: boolean
      isTeamBuilderManaged: boolean
      mapId: number
      maxHumanPlayers: number
      maxLobbySize: number
      maxTeamSize: number
      pickType: string
      premadeSizeAllowed: boolean
      queueId: number
      showPositionSelector: boolean
    }
    invitations: IInvite[]
    localMember: IMember
    members: IMember[]
    partyId: string
    partyType: string
    restrictions: any[]
    warnings: any[]
  }

  export interface IInvite {
    invitationId: string
    invitationType: string
    state: string
    timestamp: string
    toSummonerId: number
    toSummonerName: string
  }
  
  export interface IMember {
    allowedChangeActivity: boolean
    allowedInviteOthers: boolean
    allowedKickOthers: boolean
    allowedStartActivity: boolean
    allowedToggleInvite: boolean
    autoFillEligible: boolean
    autoFillProtectedForPromos: boolean
    autoFillProtectedForSoloing: boolean
    autoFillProtectedForStreaking: boolean
    botChampionId: number
    botDifficulty: string
    botId: string
    firstPositionPreference: string
    isBot: boolean
    isLeader: boolean
    isSpectator: boolean
    puuid: string
    ready: boolean
    secondPositionPreference: string
    showGhostedBanner: boolean
    summonerIconId: number
    summonerId: number
    summonerInternalName: string
    summonerLevel: number
    summonerName: string
    teamId: number
  }
}