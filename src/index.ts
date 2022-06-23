import { create_window, main_window, overlay_window } from "./electron"
import { client, C_Game, C_User, C_Runes, C_Lobby } from "lcinterface"
import { rune_table, champion_table, get_version } from "./form_data"
import { get_rune_from_web } from "./web_rune"
import { script } from "./script_manager"
import { app, ipcMain } from "electron"
import * as fs from "fs"

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const SECOND: number = 1000

const getKeyByValue = (object: any, value: number): string => Object.keys(object).find(key => object[key] === value) || ""

const champion = (): IChampionTable => JSON.parse(fs.readFileSync("resources/data/championTable.json").toString())
const rune = (): IRuneTable => JSON.parse(fs.readFileSync("resources/data/runeTable.json").toString())
const config = (): IConfig => JSON.parse(fs.readFileSync("resources/data/config.json").toString())

const interfaces = {
  user: new C_User({canCallUnhooked: false}),
  game: new C_Game({canCallUnhooked: false}),
  runes: new C_Runes({canCallUnhooked: false}),
  lobby: new C_Lobby({canCallUnhooked: false})
}

const await_login = async (): Promise<boolean> => {
  let logged_in = false
  while(!logged_in) {
    try {
      await interfaces.game.virtualCall<boolean>(interfaces.game.dest.login, {}, "get") && (logged_in = true)
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
  updateGameflow: async function() {
    // update the gameflow phase
    try { this.GAMEFLOW_PHASE = await interfaces.game.virtualCall<string>(interfaces.game.dest.gameflow, {}, "get") } catch {  }
    
    // call methods that depend on the gameflow check || depend on checking every second
    if (config().auto.champion.set)
      this.autoPickChampion()

    if (config().auto.spells.set)
      this.autoPickSummonerSpells()

    if (this.GAMEFLOW_PHASE !== this.GAMEFLOW_PHASE_LAST) {
      overlay_window.webContents.send('game_state', this.GAMEFLOW_PHASE) // send to overlay_page
      
      // call methods that depend on the gameflow update
      if (config().auto.acceptMatch)
        this.autoAcceptMatch()
  
      // reset any state changes
      if (this.acceptedMatch)
        this.acceptedMatch = false
      
      if (this.GAMEFLOW_PHASE == interfaces.game.gameflow.LOBBY) {
        if (typeof script.onPartyJoin == "function" && config().misc.script) {
          script.onPartyJoin(user, lobby)
        }
      }

      if (this.GAMEFLOW_PHASE !== interfaces.game.gameflow.CHAMPSELECT) {
        this.championPickIndex = 0
        this.championBanIndex = 0
        this.hasSetRunes = false
        this.hasSetSummonerSpells = false
      }

      // update the gameflow last phase
      this.GAMEFLOW_PHASE_LAST = this.GAMEFLOW_PHASE
    }

    // recheck the phase after 1 second
    await sleep(1 * SECOND)
    if (this.available)
      this.updateGameflow()
  },
  autoAcceptMatch: async function() {
    if (this.GAMEFLOW_PHASE == interfaces.game.gameflow.READYCHECK) {
      if (!this.acceptedMatch) {
        this.acceptedMatch = true
        interfaces.game.virtualCall<void>(interfaces.lobby.dest.matchaccept, {}, "post", false)
      }
    }
  },
  autoPickChampion: async function() {
    if (this.GAMEFLOW_PHASE == interfaces.game.gameflow.CHAMPSELECT) {
      // get our local players data (for summoner id)
      const user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")

      // get data of the lobby we are in
      const lobby_data = await interfaces.lobby.virtualCall<ILobby>(interfaces.lobby.dest.lobby, {}, "get")

      // get the data of the champion select data
      const champSelectData = await interfaces.game.virtualCall<IChampSelect>(interfaces.game.dest.champselect, {}, "get")

      // find ourself in the champion select data
      const localUserChampSelect: IActor | undefined = champSelectData.myTeam.find((p: IActor) => p.summonerId == user_data.summonerId)
      
      // define all the champions we want to try and pick (from config())
      const championPicks: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out championPicks from config()
      for (const lane in config().auto.champion.lanePick) {
        // get all champions in current lane
        config().auto.champion.lanePick[lane].forEach((c_champion: string) => {
          // save their id
          championPicks[lane].push( champion().data[c_champion] )
        })
      }

      // define all the champions we want to try and ban (from config())
      const championBans: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out championBans from config()
      for (const lane in config().auto.champion.laneBan) {
        // get all champions in current lane
        config().auto.champion.laneBan[lane].forEach((c_champion: string) => {
          // save their id
          championBans[lane].push( champion().data[c_champion] )
        })
      }

      // get our (primary) lane
      const lane: string = lobby_data.localMember.firstPositionPreference == ""? config().auto.champion.defaultLane : lobby_data.localMember.firstPositionPreference.toLowerCase()
      
      // lane checks
      if (config().auto.champion.checkLane && localUserChampSelect?.assignedPosition.toLowerCase() !== lane)
        return

      // loop trough all the actions
      for (const pair in champSelectData.actions) {
        for (const action in champSelectData.actions[pair]) {
          // get the current action data
          const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId

          // set runes if we are locked in (rune name has to start with rune.prefix)
          if (config().auto.runes.set && !game.hasSetRunes && currentAction.completed && currentAction.championId == championPicks[lane][game.championPickIndex]) {
            game.hasSetRunes = true

            const rune_data = await get_rune_from_web(getKeyByValue(champion().data, championPicks[lane][game.championPickIndex]).toLowerCase(), config().auto.runes.prefix)

            const user_runes = await interfaces.runes.virtualCall<ISavedRune[]>(interfaces.runes.dest.runes, {}, "get")
            const target_rune: ISavedRune | undefined = user_runes.find((r: ISavedRune) => r.name.startsWith(config().auto.runes.prefix))

            // runes
            if (target_rune)
              await interfaces.runes.virtualCall<void>(interfaces.runes.dest.runes + `/${target_rune?.id}`, rune_data, "put", false)
          }

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
            else if (config().auto.champion.lock && currentAction.championId == championPicks[lane][game.championPickIndex])
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
            else if (config().auto.champion.ban && currentAction.championId == championBans[lane][game.championBanIndex])
              interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][game.championBanIndex] }, "post", false)

            // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
            else
              game.championBanIndex = (game.championBanIndex == championBans[lane].length) ? 0 : game.championBanIndex + 1
          }
        }
      }
    }
  },
  autoPickSummonerSpells: async function() {
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
      const lane: string = lobby_data.localMember.firstPositionPreference == ""? config().auto.spells.defaultLane : lobby_data.localMember.firstPositionPreference.toLowerCase()
      
      // lane checks
      if (config().auto.spells.checkLane && localUserChampSelect?.assignedPosition.toLowerCase() !== lane)
        return
      
      // define all our summoner spells
      const summonerSpells: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out summonerSpells from config()
      for (const lane in config().auto.spells.lane) {
        // save their id
        summonerSpells[lane][0] = interfaces.runes.spell[ config().auto.spells.lane[lane][0] ].id
        summonerSpells[lane][1] = interfaces.runes.spell[ config().auto.spells.lane[lane][1] ].id
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
  }
}

const lobby: CLobby = {
  setLanes: async function(firstPreference: string, secondPreference: string) {
    return await interfaces.lobby.virtualCall<void>(interfaces.lobby.dest.position, { firstPreference, secondPreference }, "put", false)
  },
  create: async function(queueId: number) {
    return await interfaces.lobby.virtualCall<Promise<ILobby>>(interfaces.lobby.dest.lobby, { queueId }, "post")
  },
  setPartyType: async function(type: string) {
    return await interfaces.lobby.virtualCall<void>(interfaces.lobby.dest.partytype, type, "put", false)
  },
  startSearch: async function() {
    return await interfaces.lobby.virtualCall<void>(interfaces.lobby.dest.search, {}, "post", false)
  },
  stopSearch: async function() {
    return await interfaces.lobby.virtualCall<void>(interfaces.lobby.dest.search, {}, "delete", false)
  }
}

client.on("connect", async (credentials: ICredentials) => {
  // get game version
  const game_version = await get_version()

  // check game version
  if (champion().version !== game_version || rune().version !== game_version) {
    // update out championTable
    fs.writeFileSync("resources/data/championTable.json", JSON.stringify({
      version: game_version,
      data: await champion_table()
    }, null, 2))

    // update out runeTable
    fs.writeFileSync("resources/data/runeTable.json", JSON.stringify({
      version: game_version,
      data: await rune_table()
    }, null, 2))
  }

  // hook all the interfaces
  interfaces.user.hook(credentials)
  interfaces.game.hook(credentials)
  interfaces.runes.hook(credentials)
  interfaces.lobby.hook(credentials)
  
  // setup dest for checking if we are logged in (tho any endpoint will do)
  interfaces.game.addDest("login", "/lol-login/v1/session")

  // wait for client to be logged in
  await await_login()
  game.available = true
  console.log("connected")

  // gameflow checker (loop)
  game.updateGameflow()
  main_window.webContents.send('logged_in', true)

  if (typeof script.onUserConnect == "function" && config().misc.script) {
    script.onUserConnect(user, lobby)
  }

  // if we are hooked
  //if (interfaces.user.isCorrectState("hooked", true)) {
    // set our status
    //await user.setStatus(config().misc.status)
    // set our display rank
    //await user.setRank(config().misc.rank.tier, config().misc.rank.rank)
  //}

  //if (interfaces.lobby.isCorrectState("hooked", true)) {
    //await lobby.createLobby(interfaces.lobby.queueId.normal.draft)
    //await lobby.setLanes(interfaces.game.lane.BOTTOM, interfaces.game.lane.MIDDLE)
    //await lobby.setPartyType(interfaces.lobby.type.open)

    //await lobby.startSearch()
  //}
})

client.on("disconnect", () => {
  // unhook all the interfaces
  interfaces.user.unhook()
  interfaces.game.unhook()
  interfaces.runes.unhook()
  interfaces.lobby.unhook()

  // make sure gameloop doesnt continue
  game.available = false
  main_window.webContents.send('logged_in', false)

  console.log("disconnected")
})

client.connect()

ipcMain.on("getConfig", () => {
  main_window.webContents.send('config', config()) // send to overlay_page
})

ipcMain.on("savePicks", (e, data) => {
  let cfg: IConfig = config()
  cfg.auto.champion.set = data.autoPick
  cfg.auto.champion.lock = data.autoLock
  cfg.auto.champion.ban = data.autoBan
  fs.writeFileSync("resources/data/config.json", JSON.stringify(cfg, null, 2))
})

ipcMain.on("saveRunes", (e, data) => {
  let cfg: IConfig = config()
  cfg.auto.runes.set = data.autoRunes
  cfg.auto.runes.prefix = data.runesPrefix
  fs.writeFileSync("resources/data/config.json", JSON.stringify(cfg, null, 2))
})

ipcMain.on("saveLanes", (e, data) => {
  let cfg: IConfig = config()
  const lanes: string[] = [interfaces.game.lane.TOP, interfaces.game.lane.JUNGLE, interfaces.game.lane.MIDDLE, interfaces.game.lane.BOTTOM, interfaces.game.lane.SUPPORT]
  cfg.auto.champion.defaultLane = lanes[data.championId].toLowerCase()
  cfg.auto.spells.defaultLane = lanes[data.spellsId].toLowerCase()
  cfg.auto.champion.checkLane = data.checkChampion
  cfg.auto.spells.checkLane = data.checkSpells
  fs.writeFileSync("resources/data/config.json", JSON.stringify(cfg, null, 2))
})

ipcMain.on("closeWindow", () => {
  main_window.close()
})

ipcMain.on("miniWindow", () => {
  main_window.minimize()
})

// electron stuff -------
app.disableHardwareAcceleration()

// when electron is ready create the window's
app.on("ready", create_window)

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