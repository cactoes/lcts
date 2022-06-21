interface ILane {
  [key: string]: number[]
}

interface IChampionTable {
  version: string
  data: {
    [key: string]: number
  }
}

interface IRuneTable {
  version: string
  data: {
    runes: {
      Domination: number
      Inspiration: number
      Precision: number
      Resolve: number
      Sorcery: number
    }
    styles: {
      AdaptiveForce: number
      CDRScaling: number
      AttackSpeed: number
      Armor: number
      MagicRes: number
      HealthScaling: number
    }
    keyStones: {
      Domination: {
        Electrocute: number
        Predator: number
        DarkHarvest: number
        HailOfBlades: number
      }
      Inspiration: {
        GlacialAugment: number
        UnsealedSpellbook: number
        FirstStrike: number
      }
      Precision: {
        PressTheAttack: number
        LethalTempo: number
        FleetFootwork: number
        Conqueror: number
      }
      Resolve: {
        GraspOfTheUndying: number
        Aftershock: number
        Guardian: number
      }
      Sorcery: {
        SummonAery: number
        ArcaneComet: number
        PhaseRush: number
      }
    }
    perks: {
      Domination: [
        {
          CheapShot: number
          TasteOfBlood: number
          SuddenImpact: number
        },
        {
          ZombieWard: number
          GhostPoro: number
          EyeballCollection: number
        },
        {
          TreasureHunter: number
          IngeniousHunter: number
          RelentlessHunter: number
          UltimateHunter: number
        }
      ]
      Inspiration: [
        {
          HextechFlashtraption: number
          MagicalFootwear: number
          PerfectTiming: number
        },
        {
          FuturesMarket: number
          MinionDematerializer: number
          BiscuitDelivery: number
        },
        {
          CosmicInsight: number
          ApproachVelocity: number
          TimeWarpTonic: number
        }
      ]
      Precision: [
        {
          Overheal: number
          Triumph: number
          PresenceOfMind: number
        },
        {
          LegendAlacrity: number
          LegendTenacity: number
          LegendBloodline: number
        },
        {
          CoupDeGrace: number
          CutDown: number
          LastStand: number
        }
      ]
      Resolve: [
        {
          Demolish: number
          FontOfLife: number
          ShieldBash: number
        },
        {
          Conditioning: number
          SecondWind: number
          BonePlating: number
        },
        {
          Overgrowth: number
          Revitalize: number
          Unflinching: number
        }
      ]
      Sorcery: [
        {
          NullifyingOrb: number
          ManaflowBand: number
          NimbusCloak: number
        },
        {
          Transcendence: number
          Celerity: number
          AbsoluteFocus: number
        },
        {
          Scorch: number
          Waterwalking: number
          GatheringStorm: number
        }
      ]
    }
  }
}

interface IUser {
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
  },
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

interface CUser {
  async setStatus(status: string): void
  async setRank(tier: string, rank: string): void
}

interface CGame {
  available: boolean
  acceptedMatch: boolean
  AAMEnabled: boolean
  APCEnabled: boolean
  APSSEnabled: boolean
  GAMEFLOW_PHASE: string
  GAMEFLOW_PHASE_LAST: string
  championPickIndex: number
  championBanIndex: number
  hasSetRunes: boolean
  hasSetSummonerSpells: boolean

  async updateGameflow(): void
  async autoAcceptMatch(): void
  async autoPickChampion(): void
  async autoPickSummonerSpells(): void
}

interface IActor {
  assignedPosition: string,
  cellId: number,
  championId: number,
  championPickIntent: number,
  entitledFeatureType: string,
  selectedSkinId: number,
  spell1Id: number,
  spell2Id: number,
  summonerId: number,
  team: number,
  wardSkinId: number
}

interface IMember {
  allowedChangeActivity: boolean,
  allowedInviteOthers: boolean,
  allowedKickOthers: boolean,
  allowedStartActivity: boolean,
  allowedToggleInvite: boolean,
  autoFillEligible: boolean,
  autoFillProtectedForPromos: boolean,
  autoFillProtectedForSoloing: boolean,
  autoFillProtectedForStreaking: boolean,
  botChampionId: number,
  botDifficulty: string,
  botId: string,
  firstPositionPreference: string,
  isBot: boolean,
  isLeader: boolean,
  isSpectator: boolean,
  puuid: string,
  ready: boolean,
  secondPositionPreference: string,
  showGhostedBanner: boolean,
  summonerIconId: number,
  summonerId: number,
  summonerInternalName: string,
  summonerLevel: number,
  summonerName: string,
  teamId: number
}

interface IInvite {
  invitationId: string,
  invitationType: string,
  state: string,
  timestamp: string,
  toSummonerId: number,
  toSummonerName: string
}

interface ILobby {
  canStartActivity: boolean,
  chatRoomId: string,
  chatRoomKey: string,
  gameConfig: {
    allowablePremadeSizes: number[],
    customLobbyName: string,
    customMutatorName: string,
    customRewardsDisabledReasons: any[],
    customSpectatorPolicy: string,
    customSpectators: any[],
    customTeam100: any[],
    customTeam200: any[],
    gameMode: string,
    isCustom: boolean,
    isLobbyFull: boolean,
    isTeamBuilderManaged: boolean,
    mapId: number,
    maxHumanPlayers: number,
    maxLobbySize: number,
    maxTeamSize: number,
    pickType: string,
    premadeSizeAllowed: boolean,
    queueId: number,
    showPositionSelector: boolean
  },
  invitations: IInvite[],
  localMember: IMember,
  members: IMember[],
  partyId: string,
  partyType: string,
  restrictions: any[],
  warnings: any[]
}

interface IAction {
  actorCellId: number
  championId: number
  completed: boolean
  id: number
  isAllyAction: boolean
  isInProgress: boolean
  pickTurn:number
  type: string
}

interface IChampSelect {
  actions: IAction[][],
  allowBattleBoost: boolean,
  allowDuplicatePicks: boolean,
  allowLockedEvents: boolean,
  allowRerolling: boolean,
  allowSkinSelection: boolean,
  bans: { myTeamBans: string[], numBans: number, theirTeamBans: string[] },
  benchChampionIds: number[],
  benchEnabled: boolean,
  boostableSkinCount: number,
  chatDetails: {
    chatRoomName: string,
    chatRoomPassword: string
  },
  counter: number,
  entitledFeatureState: { additionalRerolls: number, unlockedSkinIds: number[] },
  gameId: number,
  hasSimultaneousBans: boolean,
  hasSimultaneousPicks: boolean,
  isCustomGame: boolean,
  isSpectating: boolean,
  localPlayerCellId: number,
  lockedEventIndex: number,
  myTeam: IActor[],
  recoveryCounter: number,
  rerollsRemaining: number,
  skipChampionSelect: false,
  theirTeam: IActor[],
  timer: {
    adjustedTimeLeftInPhase: number,
    internalNowInEpochMs: number,
    isInfinite: boolean,
    phase: string,
    totalTimeInPhase: number
  },
  trades: any[]
}

interface ICredentials {
  address: string
  username: string
  port: number
  password: string
  protocol: string
}

interface CLobby {
  async setLanes(first: string, second: string): void
  async createLobby(queueId: number): Promise<ILobby>
  async setPartyType(type: string): void
  async startSearch(): void
  async stopSearch(): void
}

declare interface String {
  remove_left_side(): string
}

interface IRune {
  current: boolean
  name: string
  primaryStyleId: number,
  selectedPerkIds: number[],
  subStyleId: number,
}

interface ISavedRune {
  autoModifiedSelections: any[],
  current: boolean,
  id: number,
  isActive: boolean,
  isDeletable: boolean,
  isEditable: boolean,
  isValid: boolean,
  lastModified: number,
  name: string,
  order: number,
  primaryStyleId: number,
  selectedPerkIds: number[],
  subStyleId: number
}

interface ISpellTable {
  Barrier: {
    id: number,
    key: string
  },
  Cleanse: {
    id: number,
    key: string
  },
  Exhaust: {
    id: number,
    key: string
  },
  Flash: {
    id: number,
    key: string
  },
  Ghost: {
    id: number,
    key: string
  },
  Heal: {
    id: number,
    key: string
  },
  Smite: {
    id: number,
    key: string
  },
  Teleport: {
    id: number,
    key: string
  },
  Clarity: {
    id: number,
    key: string
  },
  Ignite: {
    id: number,
    key: string
  },
  Mark: {
    id: number,
    key: string
  }
}