interface ILane {
  [key: string]: number[]
}

interface IChampionTable {
  version: string
  data: {
    [key: string]: number
  }
}

interface IChampionTable_base {
  [key: string]: number
}

interface IRuneTable {
  version: string
  data: {
    runes: {
      [key:string]: number
      Domination: number
      Inspiration: number
      Precision: number
      Resolve: number
      Sorcery: number
    }
    styles: {
      [key:string]: number
      AdaptiveForce: number
      CDRScaling: number
      AttackSpeed: number
      Armor: number
      MagicRes: number
      HealthScaling: number
    }
    keyStones: {
      [key: string]: { [key:string]: number }
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
      [key:string]: { [key: string]: number }[]
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
  async setStatus(status: string): Promise<IUser>
  async setRank(tier: string, rank: string): Promise<IUser>
}

interface CGame {
  available: boolean
  acceptedMatch: boolean
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

interface IRuneReforged {
  id: number
  key: string
  icon: string
  name: string
  slots: { runes: IRuneBase[] }[]
}

interface IRuneTable_base {
  runes: {
    [key: string]: number
  }
  styles: {
    [key: string]: number
  }
  keyStones: {
    [key: string]: {
      [key: string]: number
    }
  }
  perks: {
    [key: string]: {[key: string]: number}[]
  }
}

interface IRuneBase {
  id: number
  key: string
  icon: string
  name: string
  shortDesc: string
  longDesc: string
}

interface IChampionRefoged {
  type: string
  format: string
  version: string
  data: IChampion_base[]
}

interface IChampion_base {
  version: string
  id: string
  key: string
  name: string
  title: string
  blurb: string
  info: {
    attack: number
    defense: number
    magic: number
    difficulty: number
  }
  image: {
    full: string
    sprite: string
    group: string
    x: number
    y: number
    w: number
    h: number
    tags: [index: string]
    partype: string
    stats: {
      hp: number
      hpperlevel: number
      mp: number
      mpperlevel: number
      movespeed: number
      armor: number
      armorperlevel: number
      spellblock: number
      spellblockperlevel: number
      attackrange: number
      hpregen: number
      hpregenperlevel: number
      mpregen: number
      mpregenperlevel: number
      crit: number
      critperlevel: number
      attackdamage: number
      attackdamageperlevel: number
      attackspeedperlevel: number
      attackspeed: number
    }
  }
}

interface IRuneWebBase {
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

interface IConfig {
  auto: {
    acceptMatch: boolean
    champion: {
      set: boolean
      lock: boolean
      ban: boolean
      checkLane: boolean
      defaultLane: string
      lanePick: {
        [key: string]: string[]
        top: string[]
        jungle: string[]
        middle: string[]
        bottom: string[]
        utility: string[]
      }
      laneBan: {
        [key: string]: string[]
        top: string[]
        jungle: string[]
        middle: string[]
        bottom: string[]
        utility: string[]
      }
    }
    runes: {
      set: boolean,
      prefix: string
    }
    spells: {
      set: boolean
      checkLane: boolean
      defaultLane: string
      lane: {
        [key: string]: Array<string, 2>
        top: Array<string, 2>
        jungle: Array<string, 2>
        middle: Array<string, 2>
        bottom: Array<string, 2>
        utility: Array<string, 2>
      }
    }
  }
  misc: {
    status: string,
    rank: {
      tier: string,
      rank: string
    }
  }
}