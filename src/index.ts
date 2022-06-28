import { create_window, main_window, overlay_window, notification } from "./electron"
import { client, C_Game, C_User, C_Runes, C_Lobby } from "lcinterface"
import { rune_table, champion_table, get_version, get_items } from "./form_data"
import { get_rune_from_web } from "./web_rune"
import { script } from "./script_manager"
import { app, ipcMain } from "electron"
import fetch from "node-fetch"
import * as fs from "fs"

const getKeyByValue = (object: any, value: number): string => Object.keys(object).find(key => object[key] === value) || ""
const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))
const SECOND: number = 1000

const file = {
  get: <T>(filename: string): T => JSON.parse(fs.readFileSync("resources/data/" + filename).toString()),
  write: <T>(filename: string, filedata: T): void => fs.writeFileSync("resources/data/" + filename, JSON.stringify(filedata, null, 2))
}

const interfaces = {
  user: new C_User({canCallUnhooked: false}),
  game: new C_Game({canCallUnhooked: false}),
  runes: new C_Runes({canCallUnhooked: false}),
  lobby: new C_Lobby({canCallUnhooked: false})
}

const resourcedata = {
  DATA_DRAGON_VERSION: "",
  update: async function () {
    // get data dragon version
    this.DATA_DRAGON_VERSION = await get_version()
    // check game version
    if (file.get<IChampionTable>("championTable.json").version !== this.DATA_DRAGON_VERSION || file.get<IRuneTable>("runeTable.json").version !== this.DATA_DRAGON_VERSION || file.get<IItems>("items.json").version !== this.DATA_DRAGON_VERSION) {
      // update out championTable
      file.write<IChampionTable>("championTable.json", {
        version: this.DATA_DRAGON_VERSION,
        data: await champion_table()
      })
  
      // update out runeTable
      file.write<IRuneTable>("runeTable.json", {
        version: this.DATA_DRAGON_VERSION,
        data: await rune_table()
      })
  
      // update items
      file.write<IItems>("items.json", await get_items())
    }
  }
}

async function await_login(): Promise<boolean> {
  let logged_in: boolean = false
  while(!logged_in) {
    try {
      await interfaces.game.virtualCall<boolean>(interfaces.game.dest.login, {}, "get")
      return true
    } catch {
      console.log("not logged in")
    }
    await sleep(1 * SECOND)
  }
  return false
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

  updateGameflow: async function(): Promise<void> {
    // update the gameflow phase
    try { this.GAMEFLOW_PHASE = await interfaces.game.virtualCall<string>(interfaces.game.dest.gameflow, {}, "get") } catch {  }
    
    // these methods need to run multiple times
    if (file.get<IConfig>("config.json").auto.champion.set)
      this.autoSetChampion()

    if (file.get<IConfig>("config.json").auto.spells.set)
      this.autoSetSummonerSpells()
    
    if (file.get<IConfig>("config.json").auto.runes.set)
      this.autoSetRunes()

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
        }
      }

      // update the gameflow last phase
      this.GAMEFLOW_PHASE_LAST = this.GAMEFLOW_PHASE
    }

    // recheck the phase after 1 second
    await sleep(1 * SECOND)
    if (this.available)
      this.updateGameflow()
  },
  autoAcceptMatch: async function(): Promise<void> {
    if (this.acceptedMatch)
      return
    this.acceptedMatch = true
    interfaces.game.virtualCall<void>(interfaces.lobby.dest.matchaccept, {}, "post", false)
  },
  autoSetChampion: async function(): Promise<void> {
    if (this.GAMEFLOW_PHASE == interfaces.game.gameflow.CHAMPSELECT) {
      // get our local players data (for summoner id)
      const user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")

      // get data of the lobby we are in
      const lobby_data = await interfaces.lobby.virtualCall<ILobby>(interfaces.lobby.dest.lobby, {}, "get")

      // get the data of the champion select data
      const champSelectData = await interfaces.game.virtualCall<IChampSelect>(interfaces.game.dest.champselect, {}, "get")

      // find ourself in the champion select data
      const localUserChampSelect: IActor | undefined = champSelectData.myTeam.find((p: IActor) => p.summonerId == user_data.summonerId)
      
      // define all the champions we want to try and pick (from data.get<IConfig>("config.json"))
      const championPicks: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out championPicks from data.get<IConfig>("config.json")
      for (const lane in file.get<IConfig>("config.json").auto.champion.lanePick) {
        // get all champions in current lane
        file.get<IConfig>("config.json").auto.champion.lanePick[lane].forEach((champion: string) => {
          // save their id
          championPicks[lane].push( file.get<IChampionTable>("championTable.json").data[champion] )
        })
      }

      // define all the champions we want to try and ban (from data.get<IConfig>("config.json"))
      const championBans: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out championBans from data.get<IConfig>("config.json")
      for (const lane in file.get<IConfig>("config.json").auto.champion.laneBan) {
        // get all champions in current lane
        file.get<IConfig>("config.json").auto.champion.laneBan[lane].forEach((champion: string) => {
          // save their id
          championBans[lane].push( file.get<IChampionTable>("championTable.json").data[champion] )
        })
      }

      // get our (primary) lane
      const lane: string = lobby_data.localMember.firstPositionPreference == ""? file.get<IConfig>("config.json").auto.champion.defaultLane : lobby_data.localMember.firstPositionPreference.toLowerCase()
      
      // lane checks
      if (file.get<IConfig>("config.json").auto.champion.checkLane && localUserChampSelect?.assignedPosition.toLowerCase() !== lane)
        return

      // loop trough all the actions
      for (const pair in champSelectData.actions) {
        for (const action in champSelectData.actions[pair]) {
          // get the current action data
          const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId

          // is it our turn
          if (currentAction.actorCellId !== localUserChampSelect?.cellId)
            continue
          
          // check if we can do something
          if (!currentAction.isInProgress)
            continue
          
          // check if we are done
          if (currentAction.completed)
            continue

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
        }
      }
    }
  },
  autoSetRunes: async function(): Promise<void> {
    if (this.GAMEFLOW_PHASE == interfaces.game.gameflow.CHAMPSELECT) {
      // get our local players data (for summoner id)
      const user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")

      // get the data of the champion select data
      const champSelectData = await interfaces.game.virtualCall<IChampSelect>(interfaces.game.dest.champselect, {}, "get")

      // find ourself in the champion select data
      const localUserChampSelect: IActor | undefined = champSelectData.myTeam.find((p: IActor) => p.summonerId == user_data.summonerId)
      // loop trough all the actions
      for (const pair in champSelectData.actions) {
        for (const action in champSelectData.actions[pair]) {
          // get the current action data
          const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId

          // is it us
          if (currentAction.actorCellId !== localUserChampSelect?.cellId)
            continue

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
        }
      }
    }
  },
  autoSetSummonerSpells: async function(): Promise<void> {
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
      const lane: string = lobby_data.localMember.firstPositionPreference == ""? file.get<IConfig>("config.json").auto.spells.defaultLane : lobby_data.localMember.firstPositionPreference.toLowerCase()
      
      // lane checks
      if (file.get<IConfig>("config.json").auto.spells.checkLane && localUserChampSelect?.assignedPosition.toLowerCase() !== lane)
        return
      
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

      // loop trough all the actions
      for (const pair in champSelectData.actions) {
        for (const action in champSelectData.actions[pair]) {
          // get the current action data
          const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId

          // is it us
          if (currentAction.actorCellId !== localUserChampSelect?.cellId)
            continue

          // set spells if we are locked in
          if (!game.hasSetSummonerSpells && currentAction.completed && currentAction.type == "pick")
            await interfaces.runes.virtualCall<void>(interfaces.runes.dest.spells, { spell1Id: summonerSpells[lane][0], spell2Id: summonerSpells[lane][1] }, "patch", false)
        }
      }
    }
  },
  sendGameData: async function(): Promise<void> {
    try {
      const page_data: any = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata")
      const p = await page_data.json()
      overlay_window.webContents.send("liveClientData", p)
    } catch (e) {
      console.log("not yet in game")
    }
    this.gameDataLoop = this.gameDataLoop || setInterval(this.sendGameData.bind(this), 10 * SECOND)
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
  interfaces.user.hook(credentials)
  interfaces.game.hook(credentials)
  interfaces.runes.hook(credentials)
  interfaces.lobby.hook(credentials)
  
  // setup dest for checking if we are logged in (tho any endpoint will do)
  interfaces.game.addDest("login", "/lol-login/v1/session")

  // wait for client to be logged in
  await await_login()

  // make sure gameloop can start/continue
  game.available = true

  console.log("connected")

  // gameflow checker (loop)
  game.updateGameflow()

  // update ui
  main_window.webContents.send('logged_in', true)

  if (file.get<IConfig>("config.json").misc.script && typeof script.onUserConnect == "function")
    script.onUserConnect(user, lobby, file.get<IConfig>("config.json"))
})

client.on("disconnect", () => {
  // unhook all the interfaces
  interfaces.user.unhook()
  interfaces.game.unhook()
  interfaces.runes.unhook()
  interfaces.lobby.unhook()

  // make sure gameloop doesnt continue
  game.available = false

  // update ui
  main_window.webContents.send('logged_in', false)

  console.log("disconnected")
})

// update our data
resourcedata.update()

// start the client back-end wise
client.connect()

// electron stuff
ipcMain.on("savePicks", (e, data) => {
  let cfg = file.get<IConfig>("config.json")
  cfg.auto.champion.set = data.autoPick
  cfg.auto.champion.lock = data.autoLock
  cfg.auto.champion.ban = data.autoBan
  file.write<IConfig>("config.json", cfg)
})

ipcMain.on("saveRunes", (e, data) => {
  let cfg = file.get<IConfig>("config.json")
  cfg.auto.runes.set = data.autoRunes
  cfg.auto.runes.prefix = data.runesPrefix
  file.write<IConfig>("config.json", cfg)
})

ipcMain.on("saveLanes", (e, data) => {
  let cfg = file.get<IConfig>("config.json")
  const lanes: string[] = [interfaces.game.lane.TOP, interfaces.game.lane.JUNGLE, interfaces.game.lane.MIDDLE, interfaces.game.lane.BOTTOM, interfaces.game.lane.SUPPORT]
  cfg.auto.champion.defaultLane = lanes[data.championId].toLowerCase()
  cfg.auto.spells.defaultLane = lanes[data.spellsId].toLowerCase()
  cfg.auto.champion.checkLane = data.checkChampion
  cfg.auto.spells.checkLane = data.checkSpells
  file.write<IConfig>("config.json", cfg)
})

ipcMain.on("saveMisc", (e, data) => {
  let cfg = file.get<IConfig>("config.json")
  cfg.misc.script = data.scripts
  cfg.misc.status = data.status
  cfg.misc.rank = {
    tier: data.rank.tier.toLowerCase(),
    rank: data.rank.rank.toUpperCase()
  }
  cfg.auto.acceptMatch = data.autoAccept
  file.write<IConfig>("config.json", cfg)
})

ipcMain.on("getConfig", () => main_window.webContents.send('config', file.get<IConfig>("config.json")))
ipcMain.on("closeWindow", () => main_window.close())
ipcMain.on("miniWindow", () => main_window.minimize())

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