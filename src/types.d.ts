declare module "gkm"

type GameFlows = "None" | "Lobby" | "Matchmaking" | "ReadyCheck" | "ChampSelect" | "InProgress" | "WaitingForStats" | "EndOfGame" | "OutOfClient"

interface Credentials {
  address: string
  username: string
  port: number
  pid: number
  password: string
  protocol: string
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

interface IRPCError {
  errorCode: string,
  httpStatus: number,
  implementationDetails: object,
  message: string
}

interface ILane {
  [key: string]: number[]
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

interface IChampionTable_base {
  [key: string]: number
}

interface IChampionTable {
  version: string
  data: {
    [key: string]: number
  }
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
  allPlayers: IAllPlayers[]
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

interface IAllPlayers {
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

interface IRenderData {
  typeID: number
  data: {
    state: boolean
    text: string
  }
}