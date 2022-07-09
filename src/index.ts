import { client, C_Game, C_User, C_Runes, C_Lobby } from "lcinterface"
import { app, ipcMain } from "electron"
import fetch from "node-fetch"
import { create_window, main_window, overlay_window, notification } from "./electron"
import { rune_table, champion_table, get_version, get_items } from "./form_data"
import { sleep, time, getKeyByValue, file, lanes } from "./utils"
import { get_rune_from_web, get_skill_order } from "./web_rune"
import { script } from "./script_manager"

const interfaces = {
  user: new C_User({canCallUnhooked: false}),
  game: new C_Game({canCallUnhooked: false}),
  runes: new C_Runes({canCallUnhooked: false}),
  lobby: new C_Lobby({canCallUnhooked: false}),
  hook: (credentials: ICredentials) => {
    interfaces.user.hook(credentials)
    interfaces.game.hook(credentials)
    interfaces.runes.hook(credentials)
    interfaces.lobby.hook(credentials)
  },
  unhook: () => {
    interfaces.user.unhook()
    interfaces.game.unhook()
    interfaces.runes.unhook()
    interfaces.lobby.unhook()
  }
}

const resourcedata = {
  DATA_DRAGON_VERSION: "",
  update: async function () {
    // get data dragon version
    this.DATA_DRAGON_VERSION = await get_version()
    // check game version
    if (file.get<IChampionTable>("championTable.json").version !== this.DATA_DRAGON_VERSION || file.get<IRuneTable>("runeTable.json").version !== this.DATA_DRAGON_VERSION || file.get<IItems>("items.json").version !== this.DATA_DRAGON_VERSION) {
      // update our local championTable
      file.write<IChampionTable>("championTable.json", {
        version: this.DATA_DRAGON_VERSION,
        data: await champion_table()
      })
  
      // update our local runeTable
      file.write<IRuneTable>("runeTable.json", {
        version: this.DATA_DRAGON_VERSION,
        data: await rune_table()
      })
  
      // update local items
      file.write<IItems>("items.json", await get_items())
    }
  }
}

async function await_login(): Promise<void> {
  while (true) {
    // have we logged in?
    if (await interfaces.game.virtualCall<void>(interfaces.game.dest.login, {}, "get", false).catch<boolean>(() => false))
      return
    
    // prevent unnecessary spamming of retrys
    await sleep(1 * time.SECOND)
  }
}

const user: CUser = {
  setStatus: async function(status: string): Promise<IUser> {
    let user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")
    user_data.statusMessage = status
    return await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, user_data, "put")
  },
  setRank: async function (tier: string, rank: string): Promise<IUser> {
    let user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")
    user_data.lol.rankedLeagueTier = tier
    user_data.lol.rankedLeagueDivision = rank
    return await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, user_data, "put")
  }
}

const game: CGame = {
  available: false,
  acceptedMatch: false,
  GAMEFLOW_PHASE: '',
  GAMEFLOW_PHASE_LAST: '',
  championPickIndex: 0,
  championBanIndex: 0,
  hasSetRunes: false,
  hasSetSummonerSpells: false,
  gameDataLoop: false,
  hasSentSkillOrder: false,

  updateGameflow: async function(): Promise<void> {
    // update the gameflow phase
    try { this.GAMEFLOW_PHASE = await interfaces.game.virtualCall<string>(interfaces.game.dest.gameflow, {}, "get") } catch {  }
    
    // liveGameDataLoop
    this.loopChampionSelectData()

    // main gameflow check
    if (this.GAMEFLOW_PHASE !== this.GAMEFLOW_PHASE_LAST) {
  
      // default resets on gameflow == any
      if (this.acceptedMatch)
        this.acceptedMatch = false

      // do something depening on the gameflow state
      switch (this.GAMEFLOW_PHASE) {
        case interfaces.game.gameflow.NONE:
          break
        case interfaces.game.gameflow.LOBBY:
          if (file.get<IConfig>("config.json").misc.script && typeof script.onPartyJoin == "function")
            script.onPartyJoin(user, lobby, file.get<IConfig>("config.json"))
          break
        case interfaces.game.gameflow.MATCHMAKING:
          break
        case interfaces.game.gameflow.READYCHECK:
          // reset champion select values
          this.championPickIndex = 0
          this.championBanIndex = 0
          this.hasSetRunes = false
          this.hasSetSummonerSpells = false

          // auto accept match if we want to
          if (file.get<IConfig>("config.json").auto.acceptMatch)
            this.autoAcceptMatch()
          break
        case interfaces.game.gameflow.CHAMPSELECT:
          break
        case interfaces.game.gameflow.INPROGRESS:
          if (this.gameDataLoop == false)
            this.sendGameData()
          break
        case interfaces.game.gameflow.ENDOFGAME:
          break
        case interfaces.game.gameflow.WAITINGFORSTATS:
          break
      }

      // stop loop if we aren't in game
      if (this.GAMEFLOW_PHASE !== interfaces.game.gameflow.INPROGRESS) {
        if (this.gameDataLoop) {
          clearInterval(this.gameDataLoop)
          this.gameDataLoop = false
          this.hasSentSkillOrder = false
        }
      }

      // update the gameflow last phase
      this.GAMEFLOW_PHASE_LAST = this.GAMEFLOW_PHASE
    }

    // recheck the phase after 1 second
    await sleep(1 * time.SECOND)
    if (this.available)
      this.updateGameflow()
  },
  autoAcceptMatch: async function(): Promise<void> {
    if (this.acceptedMatch)
      return
    this.acceptedMatch = true
    interfaces.game.virtualCall<void>(interfaces.lobby.dest.matchaccept, {}, "post", false)
  },
  autoSetChampion: async function(currentAction: IAction, lane: string): Promise<void> {
      // define all the champions we want to try and pick (from data.get<IConfig>("config.json"))
      const championPicks: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out championPicks from data.get<IConfig>("config.json")
      for (const currentLane in file.get<IConfig>("config.json").auto.champion.lanePick) {
        // get all champions in current lane
        file.get<IConfig>("config.json").auto.champion.lanePick[currentLane].forEach((champion: string) => {
          // save their id
          championPicks[currentLane].push( file.get<IChampionTable>("championTable.json").data[champion] )
        })
      }

      // define all the champions we want to try and ban (from data.get<IConfig>("config.json"))
      const championBans: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // check if we can do something
      if (!currentAction.isInProgress)
        return
      
      // check if we are done
      if (currentAction.completed)
        return

      // check if this is our turn to PICK
      if (currentAction.type == "pick") {
        // check if we have a champion selected
        if (currentAction.championId == 0 || currentAction.championId !== championPicks[lane][game.championPickIndex])
          interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}`, { championId: championPicks[lane][game.championPickIndex] }, "patch", false)
        
        // check if we want to lock in our selected champion
        else if (file.get<IConfig>("config.json").auto.champion.lock && currentAction.championId == championPicks[lane][game.championPickIndex])
          interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][game.championPickIndex] }, "post", false)

        // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
        else
          game.championPickIndex = (game.championPickIndex == championPicks[lane].length) ? 0 : game.championPickIndex + 1
      
        // check if this is our turn to BAN
      } else if (currentAction.type == "ban") {
        // check if we have a champion selected
        if (currentAction.championId == 0 || currentAction.championId !== championBans[lane][game.championBanIndex])
          interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}`, { championId: championBans[lane][game.championBanIndex] }, "patch", false)
        
        // check if we want to ban our champion
        else if (file.get<IConfig>("config.json").auto.champion.ban && currentAction.championId == championBans[lane][game.championBanIndex])
          interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][game.championBanIndex] }, "post", false)

        // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
        else
          game.championBanIndex = (game.championBanIndex == championBans[lane].length) ? 0 : game.championBanIndex + 1
    }
  },
  autoSetRunes: async function(currentAction: IAction, lane: string): Promise<void> {
      // set runes if we are locked in (rune name has to start with rune.prefix)
      if (!game.hasSetRunes && currentAction.completed && currentAction.type == "pick") {
        game.hasSetRunes = true
      
      const rune_data = await get_rune_from_web(getKeyByValue(file.get<IChampionTable>("championTable.json").data, currentAction.championId).toLowerCase(), file.get<IConfig>("config.json").auto.runes.prefix)

      const user_runes = await interfaces.runes.virtualCall<ISavedRune[]>(interfaces.runes.dest.runes, {}, "get")
      const target_rune: ISavedRune | undefined = user_runes.find((r: ISavedRune) => r.name.startsWith(file.get<IConfig>("config.json").auto.runes.prefix))

      // runes
      if (target_rune)
        await interfaces.runes.virtualCall<void>(interfaces.runes.dest.runes + `/${target_rune?.id}`, rune_data, "put", false)
    }
  },
  autoSetSummonerSpells: async function(currentAction: IAction, lane: string): Promise<void> {
    // define all our summoner spells
    const summonerSpells: ILane = {
      top: [], jungle: [], middle: [], bottom: [], utility: []
    }

    // fill out summonerSpells from data.get<IConfig>("config.json")
    for (const lane in file.get<IConfig>("config.json").auto.spells.lane) {
      // save their id
      summonerSpells[lane][0] = interfaces.runes.spell[ file.get<IConfig>("config.json").auto.spells.lane[lane][0] ].id
      summonerSpells[lane][1] = interfaces.runes.spell[ file.get<IConfig>("config.json").auto.spells.lane[lane][1] ].id
    }

    // set spells if we are locked in
    if (!game.hasSetSummonerSpells && currentAction.completed && currentAction.type == "pick")
      await interfaces.runes.virtualCall<void>(interfaces.runes.dest.spells, { spell1Id: summonerSpells[lane][0], spell2Id: summonerSpells[lane][1] }, "patch", false)
      
  },
  sendGameData: async function(): Promise<void> {
    try {
      // get the client data
      const liveClientData = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata").then<Promise<ILiveClientData>>((response: Response | any) => {
        // return the json response
        return response.json()
      })

      // send the data to the client
      overlay_window.webContents.send("liveClientData", liveClientData)

      // find us in the list
      const me = liveClientData.allPlayers.find(p => p.summonerName == liveClientData.activePlayer.summonerName)

      // if we haven't sent over our skill order
      if (!this.hasSentSkillOrder) {
        // only call once per match
        this.hasSentSkillOrder = true

        // get our skill order
        const ability_levels: string[] = await get_skill_order(me?.championName.toLowerCase() || "")
        
        // send our skill order
        overlay_window.webContents.send("abilityLevelOrder", ability_levels)
      }
    } catch { }
    // repeat every second
    this.gameDataLoop = this.gameDataLoop || setInterval(this.sendGameData.bind(this), 1 * time.SECOND)
  },
  loopChampionSelectData: async function(): Promise<void> {
    if (this.GAMEFLOW_PHASE == interfaces.game.gameflow.CHAMPSELECT) {
      // get our local players data (for summoner id)
      const user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")

      // get data of the lobby we are in
      const lobby_data = await interfaces.lobby.virtualCall<ILobby>(interfaces.lobby.dest.lobby, {}, "get")

      // get the data of the champion select data
      const champSelectData = await interfaces.game.virtualCall<IChampSelect>(interfaces.game.dest.champselect, {}, "get")

      // find ourself in the champion select data
      const localUserChampSelect: IActor | undefined = champSelectData.myTeam.find((p: IActor) => p.summonerId == user_data.summonerId)

      // get our (primary) lane
      const lane: string = lobby_data.localMember.firstPositionPreference == ""? file.get<IConfig>("config.json").auto.champion.defaultLane : lobby_data.localMember.firstPositionPreference.toLowerCase()

      // lane checks
      if (file.get<IConfig>("config.json").auto.champion.checkLane && localUserChampSelect?.assignedPosition.toLowerCase() !== lane)
        if (lobby_data.gameConfig.queueId == 420 || lobby_data.gameConfig.queueId == 440)
          return

      // loop trough all the actions
      for (const pair in champSelectData.actions) {
        for (const action in champSelectData.actions[pair]) {
          // get the current action data
          const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId

          // is it our turn
          if (currentAction.actorCellId !== localUserChampSelect?.cellId)
            continue

          // do we want to set our runes
          if (file.get<IConfig>("config.json").auto.runes.set)
            this.autoSetRunes(currentAction, lane)

          // do we want to set out spells
          if (file.get<IConfig>("config.json").auto.spells.set)
            this.autoSetSummonerSpells(currentAction, lane)

          // do we want to set our champion
          if (file.get<IConfig>("config.json").auto.champion.set)
            this.autoSetChampion(currentAction, lane)

        }
      }
    }
  }
}

const lobby: CLobby = {
  setLanes: async function(firstPreference: string, secondPreference: string): Promise<void> {
    return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.position, { firstPreference, secondPreference }, "put", false)
  },
  create: async function(queueId: number): Promise<ILobby> {
    return await interfaces.lobby.virtualCall<Promise<ILobby>>(interfaces.lobby.dest.lobby, { queueId }, "post")
  },
  leave: async function(): Promise<void> {
    return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.lobby, { }, "delete", false)
  },
  setPartyType: async function(type: string): Promise<void> {
    return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.partytype, type, "put", false)
  },
  startSearch: async function(): Promise<void> {
    return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.search, {}, "post", false)
  },
  stopSearch: async function(): Promise<void> {
    return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.search, {}, "delete", false)
  }
}

client.on("connect", async (credentials: ICredentials) => {
  // hook all the interfaces
  interfaces.hook(credentials)
  
  // setup dest for checking if we are logged in (tho any endpoint will do)
  interfaces.game.addDest("login", "/lol-login/v1/session")

  // wait for client to be logged in
  await await_login()

  // make sure gameloop can start/continue
  game.available = true

  // update ui
  main_window.webContents.send('logged_in', true)

  // gameflow checker (loop)
  game.updateGameflow()

  // auto rank
  if (file.get<IConfig>("config.json").misc.rank.set)
    await user.setRank(file.get<IConfig>("config.json").misc.rank.tier, file.get<IConfig>("config.json").misc.rank.rank)

  // auto status
  if (file.get<IConfig>("config.json").misc.status.set)
    await user.setStatus(file.get<IConfig>("config.json").misc.status.text)

  if (file.get<IConfig>("config.json").misc.script && typeof script.onUserConnect == "function")
    script.onUserConnect(user, lobby, file.get<IConfig>("config.json"))
})

client.on("disconnect", () => {
  // unhook all the interfaces
  interfaces.unhook()

  // make sure gameloop doesnt continue
  game.available = false

  // update ui
  main_window.webContents.send('logged_in', false)
})

// update our data
resourcedata.update()

// start the client back-end wise
client.connect()

const DEFAULT_LANE_CHAMPION = 0x00
const DEFAULT_LANE_SPELLS = 0x01
const LANE_CHECK = 0x02
const HOVER_CHAMPION = 0x03
const LOCK_CHAMPION = 0x04
const BAN_CHAMPION = 0x05
const RUNE_IMPORT = 0x06
const RUNE_PREFIX = 0x07
const USE_SCRIPTS = 0x08
const ACCEPT_MATCH = 0x09
const SET_STATUS = 0x0A
const SET_RANK = 0x0B
const OVERLAY = 0x0C
const STATUS = 0x0D
const TIER = 0x0E
const RANK = 0x0F
const SPELLS = 0x11
const SET_SPELLS = 0x12

const GET_CONFIG = 0x10

// electron stuff
ipcMain.on("save", (_, { typeID, data }: IRenderData) => {
  let config = file.get<IConfig>("config.json")
  switch (typeID) {
    case DEFAULT_LANE_CHAMPION:
      config.auto.champion.defaultLane = data.text.toLowerCase()
      break
    case DEFAULT_LANE_SPELLS:
      config.auto.spells.defaultLane = data.text.toLowerCase()
      break
    case LANE_CHECK:
      config.auto.champion.checkLane = data.state
      break
    case HOVER_CHAMPION:
      config.auto.champion.set = data.state
      break
    case LOCK_CHAMPION:
      config.auto.champion.lock = data.state
      break
    case BAN_CHAMPION:
      config.auto.champion.ban = data.state
      break
    case RUNE_IMPORT:
      config.auto.runes.set = data.state
      break
    case RUNE_PREFIX:
      config.auto.runes.prefix = data.text
      break
    case USE_SCRIPTS:
      config.misc.script = data.state
      break
    case ACCEPT_MATCH:
      config.auto.acceptMatch = data.state
      break
    case SET_STATUS:
      config.misc.status.set = data.state
      break
    case SET_RANK:
      config.misc.rank.set = data.state
      break
    case OVERLAY:
      config.overlay = data.state
      overlay_window.webContents.send("overlay", data.state)
      break
    case STATUS:
      config.misc.status.text = data.text
      break
    case TIER:
      config.misc.rank.tier = data.text
      break
    case RANK:
      config.misc.rank.rank = data.text
      break
    case SPELLS:
      const [spell, lane, index] = data.text.split("_")
      config.auto.spells.lane[lane][parseInt(index) - 1] = spell
      break
    case SET_SPELLS:
      config.auto.spells.set = data.state
      break
    default:
      return
  }
  file.write<IConfig>("config.json", config)
})

ipcMain.on("get", (_, { typeID, data }: IRenderData) => {
  switch (typeID) {
    case GET_CONFIG:
      main_window.webContents.send('config', file.get<IConfig>("config.json"))
      break
    default:
      return
  }
})

ipcMain.on("close", () => main_window.close())
ipcMain.on("min", () => main_window.minimize())

app.disableHardwareAcceleration()
app.on("ready", create_window)

// for later implementation (maybe)
// await this.get(data, this.endpoints.LOL_GAMEFLOW_SESSION)
// .then( async matchData => {
//   const { teamOne, teamTwo, playerChampionSelections } = matchData.gameData
  
//   await Promise.all(teamOne.map( async (player, i) => {
//     const currentChampion = playerChampionSelections.find( pcs => pcs.summonerInternalName == player.summonerInternalName)
//     let playerData = {}

//     // --- check if user is bot
//     if (!player.summonerInternalName.startsWith("bot_")) {
//       playerData = await get(`http://192.168.178.38:8080/web/lol/user-full/${player.summonerInternalName}`)
      
//       // --- append champion id and selected lane to player data
//       playerData.championId = currentChampion.championId
//       playerData.laneSelected = player.selectedPosition? player.selectedPosition:lanes[i]

//     } else {
//       playerData = {
//         username: player.summonerInternalName,
//         championId: player.summonerInternalName.split("_")[1],
//         laneSelected: player.selectedPosition? player.selectedPosition:lanes[i],
//         rank: {tier:"UNRANKED", rank:""}
//       }
//     }
    
//     // --- map the data
//     mappedTeamOne[playerData.laneSelected.toLowerCase()] = playerData 

//     return true
//   }))

//   await Promise.all(teamTwo.map( async (player, i) => {
//     const currentChampion = playerChampionSelections.find( pcs => pcs.summonerInternalName == player.summonerInternalName)
//     let playerData = {}

//     // --- check if user is bot
//     if (!player.summonerInternalName.startsWith("bot_")) {
//       playerData = await get(`http://192.168.178.38:8080/web/lol/user-full/${player.summonerInternalName}`)
      
//       // --- append champion id and selected lane to player data
//       playerData.championId = currentChampion.championId
//       playerData.laneSelected = player.selectedPosition? player.selectedPosition:lanes[i]

//     } else {
//       playerData = {
//         username: player.summonerInternalName,
//         championId: player.summonerInternalName.split("_")[1],
//         laneSelected: player.selectedPosition? player.selectedPosition:lanes[i],
//         rank: {tier:"UNRANKED", rank:""}
//       }
//     }
    
//     // --- map the data
//     mappedTeamTwo[playerData.laneSelected.toLowerCase()] = playerData 

//     return true
//   }))
// })