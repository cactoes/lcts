interface ILane {
  [key: string]: number[]
}

interface IChampionRefoged {
  type: string
  format: string
  version: string
  data: IChampion_base[]
}

interface IChampionTable_base {
  [key: string]: number
}

interface IChampionTable {
  version: string
  data: {
    [key: string]: number
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
  } | IRuneTable_base
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

interface IInvite {
  invitationId: string
  invitationType: string
  state: string
  timestamp: string
  toSummonerId: number
  toSummonerName: string
}

interface IMember {
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

interface ILobby {
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

interface IActor {
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

interface IChampSelect {
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

interface ICredentials {
  address: string
  username: string
  port: number
  pid: number
  password: string
  protocol: string
}

interface IRune {
  current: boolean
  name: string
  primaryStyleId: number
  selectedPerkIds: number[]
  subStyleId: number
}

interface ISavedRune {
  autoModifiedSelections: any[]
  current: boolean
  id: number
  isActive: boolean
  isDeletable: boolean
  isEditable: boolean
  isValid: boolean
  lastModified: number
  name: string
  order: number
  primaryStyleId: number
  selectedPerkIds: number[]
  subStyleId: number
}

interface ISpellTable {
  Barrier: {
    id: number
    key: string
  }
  Cleanse: {
    id: number
    key: string
  }
  Exhaust: {
    id: number
    key: string
  }
  Flash: {
    id: number
    key: string
  }
  Ghost: {
    id: number
    key: string
  }
  Heal: {
    id: number
    key: string
  }
  Smite: {
    id: number
    key: string
  }
  Teleport: {
    id: number
    key: string
  }
  Clarity: {
    id: number
    key: string
  }
  Ignite: {
    id: number
    key: string
  }
  Mark: {
    id: number
    key: string
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
      set: boolean
      prefix: string
    }
    spells: {
      set: boolean
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
    status: {
      text: string
      set: boolean
    }
    rank: {
      tier: string
      rank: string
      set: boolean
    }
  }
  script: {
    userScript: boolean
    auto: {
      kiter: {
        enabled: boolean
        keybinds: {
          activate: string
          attackMove: string
        }
      }
    }
  }
  overlay: boolean
}

declare class IScript {
  async onUserConnect(user: CUser, lobby: CLobby, config: IConfig): boolean
  async onPartyJoin(user: CUser, lobby: CLobby, config: IConfig): boolean
}

declare interface String {
  get_item(index: number): string
}

interface IItems {
  type: string
  version: string
  basic: {
    name: string
    rune: {
      isrune:	boolean
      tier:	number
      type:	string
    }
    gold: {
      base: number
      total: number
      sell: number
      purchasable: boolean
    }
    group: string
  description: string
  colloq: string
  plaintext: string
  consumed: boolean
  stacks: number
  depth: number
  consumeOnFull: boolean
  from: any[]
  into: any[]
  specialRecipe: number
  inStore: boolean
  hideFromAll: boolean
  requiredChampion: string
  requiredAlly: string
  stats: {
    FlatHPPoolMod: number
    rFlatHPModPerLevel: number
    FlatMPPoolMod: number
    rFlatMPModPerLevel: number
    PercentHPPoolMod: number
    PercentMPPoolMod: number
    FlatHPRegenMod: number
    rFlatHPRegenModPerLevel: number
    PercentHPRegenMod: number
    FlatMPRegenMod: number
    rFlatMPRegenModPerLevel: number
    PercentMPRegenMod: number
    FlatArmorMod: number
    rFlatArmorModPerLevel: number
    PercentArmorMod: number
    rFlatArmorPenetrationMod: number
    rFlatArmorPenetrationModPerLevel: number
    rPercentArmorPenetrationMod: number
    rPercentArmorPenetrationModPerLevel: number
    FlatPhysicalDamageMod: number
    rFlatPhysicalDamageModPerLevel: number
    PercentPhysicalDamageMod: number
    FlatMagicDamageMod: number
    rFlatMagicDamageModPerLevel: number
    PercentMagicDamageMod: number
    FlatMovementSpeedMod: number
    rFlatMovementSpeedModPerLevel: number
    PercentMovementSpeedMod: number
    rPercentMovementSpeedModPerLevel: number
    FlatAttackSpeedMod: number
    PercentAttackSpeedMod: number
    rPercentAttackSpeedModPerLevel: number
    rFlatDodgeMod: number
    rFlatDodgeModPerLevel: number
    PercentDodgeMod: number
    FlatCritChanceMod: number
    rFlatCritChanceModPerLevel: number
    PercentCritChanceMod: number
    FlatCritDamageMod: number
    rFlatCritDamageModPerLevel: number
    PercentCritDamageMod: number
    FlatBlockMod: number
    PercentBlockMod: number
    FlatSpellBlockMod: number
    rFlatSpellBlockModPerLevel: number
    PercentSpellBlockMod: number
    FlatEXPBonus: number
    PercentEXPBonus: number
    rPercentCooldownMod: number
    rPercentCooldownModPerLevel: number
    rFlatTimeDeadMod: number
    rFlatTimeDeadModPerLevel: number
    rPercentTimeDeadMod: number
    rPercentTimeDeadModPerLevel: number
    rFlatGoldPer10Mod: number
    rFlatMagicPenetrationMod: number
    rFlatMagicPenetrationModPerLevel: number
    rPercentMagicPenetrationMod: number
    rPercentMagicPenetrationModPerLevel: number
    FlatEnergyRegenMod: number
    rFlatEnergyRegenModPerLevel: number
    FlatEnergyPoolMod: number
    rFlatEnergyModPerLevel: number
    PercentLifeStealMod: number
    PercentSpellVampMod: number
  }
  tags:	any[]
  maps: {
    1: boolean
    8: boolean
    10: boolean
    12: boolean
  }
  }
  data: {
    [key: number]: IItems.basic
  }
  groups: { id: string, MaxGroupOwnable: string }[]
  tree: {
    header: string
    tags: string[]
  }[]
}

interface ITime {
  MILLISECOND: number
  SECOND: number
  MINUTE: number
}

interface IFile {
  get<T>(filename: string): T
  write<T>(filename: string, filedata: T): void
  raw(filename: string): string
}

interface IAbility {
  abilityLevel: number
  displayName: string
  id: string
  rawDescription: string
  rawDisplayName: string
}

interface IRawSpells {
  displayName: string
  rawDescription: string
  rawDisplayName: string
}

interface IRuneGeneral {
  displayName: string
  id: number,
  rawDescription: string
  rawDisplayName: string
}

interface ILiveClientData {
  activePlayer: {
    abilities: {
      E: IAbility
      Passive: IAbility
      Q: IAbility
      R: IAbility
      W: IAbility
    }
    championStats: {
      abilityHaste: number
      abilityPower: number
      armor: number
      armorPenetrationFlat: number
      armorPenetrationPercent: number
      attackDamage: number
      attackRange: number
      attackSpeed: number
      bonusArmorPenetrationPercent: number
      bonusMagicPenetrationPercent: number
      critChance: number
      critDamage: number
      currentHealth: number
      healShieldPower: number
      healthRegenRate: number
      lifeSteal: number
      magicLethality: number
      magicPenetrationFlat: number
      magicPenetrationPercent: number
      magicResist: number
      maxHealth: number
      moveSpeed: number
      omnivamp: number
      physicalLethality: number
      physicalVamp: number
      resourceMax: number
      resourceRegenRate: number
      resourceType: string
      resourceValue: number
      spellVamp: number
      tenacity: number
    }
    currentGold: number
    fullRunes: {
      generalRunes: IRuneGeneral[]
      keystone: IRuneGeneral
      primaryRuneTree: IRuneGeneral
      secondaryRuneTree: IRuneGeneral
      statRunes: { id: number, rawDescription: string }[]
    }
    level: number
    summonerName: string
    teamRelativeColors: boolean
  }
  allPlayers: {
    championName: string
    isBot: boolean
    isDead: boolean
    items: {
      canUse: boolean
      consumable: boolean
      count: number
      displayName: string
      itemID: number
      price: number
      rawDescription: string
      rawDisplayName: string
      slot: number
    }[]
    level: number
    position: string
    rawChampionName: string
    rawSkinName: string
    respawnTimer: number
    runes: {
      keystone: IRuneGeneral
      primaryRuneTree: IRuneGeneral
      secondaryRuneTree: IRuneGeneral
    }
    scores: {
      assists: number
      creepScore: number
      deaths: number
      kills: number
      wardScore: number
    }
    skinID: number
    skinName: string
    summonerName: string
    summonerSpells:  {
      summonerSpellOne: IRawSpells
      summonerSpellTwo: IRawSpells
    }
    team: string
  }[]
  events: {
    Events: {
      EventID: number
      EventName: string
      EventTime: number
    }[]
  }
  gameData: {
    gameMode: string
    gameTime: number
    mapName: string
    mapNumber: number
    mapTerrain: string
  }
}

interface IRenderData {
  typeID: number
  data: {
    state: boolean
    text: string
  }
}

interface CLobby {
  async setLanes(first: string, second: string): Promise<void>
  async create(queueId: number): Promise<ILobby>
  async leave(): Promise<void>
  async setPartyType(type: string): Promise<void>
  async startSearch(): Promise<void>
  async stopSearch(): Promise<void>
}

interface CUser {
  async setStatus(status: string): Promise<IUser>
  async setRank(tier: string, rank: string): Promise<IUser>
  async setRunes(currentAction: IAction): Promise<void>
  async setSpells(currentAction: IAction, lane: string, spell1Id: number, spell2Id: number): Promise<void>
}

interface CClient {
  connected: boolean
  sentSkillOrder: boolean
  phase: {
    current: string
    last: string
  }

  async acceptMatch(): Promise<void>
  async sendGameData(pollInterval: number): Promise<void>
  async gameflowChecker(pollInterval: number): Promise<void>
  
  championSelect: {
    champion: {
      index: {
        pick: number
        ban: number
      }
    }
    runes: {
      set: boolean
    }

    async update(pollInterval: number): Promise<void>
    async reset(): void
    async hoverBanLock(currentAction: IAction, lane: string): Promise<void>
  }
}

interface IClientMethods {
  lobby: CLobby,
  user: CUser
  client: CClient
}

interface IReadyCheck {
  declinerIds: number[]
  dodgeWarning: string
  playerResponse: string
  state: string
  suppressUx: boolean
  timer: number
}

interface IRPC_Error {
  errorCode: string,
  httpStatus: number,
  implementationDetails: object,
  message: string
}

interface IScriptMethods {
  auto: {
    kiter: {
      isRunning: boolean
      timer: NodeJS.Timer
      attackSpeed: number

      run(): void
    }
  }
}

interface IWindow {
  title: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

type TScriptFn = "onUserConnect" | "onPartyJoin"

declare module 'gkm'