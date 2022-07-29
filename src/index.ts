// node_modules
import * as lcinterface from "lcinterface"
import { app, ipcMain } from "electron"
import fetch            from "node-fetch"

// local
import * as electron    from "./electron"
import * as utils       from "./utils"
import * as web         from "./web_rune"
import * as resource    from "./resource_manager"
import { script }       from "./script_manager"

// all our interfaces
const interfaces = {
  user: new lcinterface.C_User({canCallUnhooked: false}),
  game: new lcinterface.C_Game({canCallUnhooked: false}),
  runes: new lcinterface.C_Runes({canCallUnhooked: false}),
  lobby: new lcinterface.C_Lobby({canCallUnhooked: false}),
  hook_all: (credentials: ICredentials) => {
    interfaces.user.hook(credentials)
    interfaces.game.hook(credentials)
    interfaces.runes.hook(credentials)
    interfaces.lobby.hook(credentials)
  },
  unhook_all: () => {
    interfaces.user.unhook()
    interfaces.game.unhook()
    interfaces.runes.unhook()
    interfaces.lobby.unhook()
  }
}

// login checker
const await_login = async (): Promise<boolean> => {
  // block any code until this has completed
  while (true) {
    // if we are logged in return (if not / error keep retrying)
    if (await interfaces.game.virtualCall<void>(interfaces.game.dest.login, {}, "get", false).catch<boolean>(() => false))
      return true
    
    // prevent unnecessary spamming of retrys
    await utils.sleep(utils.time.SECOND)
  }
}

// all our custom client methods
const clientMethods: IClientMethods = {
  lobby: {
    setLanes: async function(firstPreference: string, secondPreference: string) {
      return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.position, { firstPreference, secondPreference }, "put", false)
    },
    create: async function(queueId: number) {
      return await interfaces.lobby.virtualCall<Promise<ILobby>>(interfaces.lobby.dest.lobby, { queueId }, "post")
    },
    leave: async function() {
      return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.lobby, { }, "delete", false)
    },
    setPartyType: async function(type: string) {
      return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.partytype, type, "put", false)
    },
    startSearch: async function() {
      return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.search, {}, "post", false)
    },
    stopSearch: async function() {
      return await interfaces.lobby.virtualCall<Promise<void>>(interfaces.lobby.dest.search, {}, "delete", false)
    }
  },
  user: {
    setStatus: async function(status: string) {
      let user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")
      user_data.statusMessage = status
      return await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, user_data, "put")
    },
    setRank: async function(tier: string, rank: string) {
      let user_data = await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, {}, "get")
      user_data.lol.rankedLeagueTier = tier
      user_data.lol.rankedLeagueDivision = rank
      return await interfaces.user.virtualCall<IUser>(interfaces.user.dest.me, user_data, "put")
    },
    setRunes: async function(currentAction: IAction) {
       // set runes if we are locked in
      if (clientMethods.client.championSelect.runes.set || !(currentAction.completed && currentAction.type == "pick"))
        return

      // we have set our runes
      clientMethods.client.championSelect.runes.set = true

      // get our champion's name
      const currentChampionName = utils.getKeyByValue(utils.file.get<IChampionTable>("championTable.json").data, currentAction.championId).toLowerCase()

      // get the rune form u.gg
      const new_rune = await web.get_rune(currentChampionName, utils.file.get<IConfig>("config.json").auto.runes.prefix)
      
      // get all our runes
      const user_runes = await interfaces.runes.virtualCall<ISavedRune[]>(interfaces.runes.dest.runes, {}, "get")
      
      // get the rune we want to replace
      const target_rune: ISavedRune | undefined = user_runes.find((r: ISavedRune) => r.name.startsWith(utils.file.get<IConfig>("config.json").auto.runes.prefix))

      // if we have a rune we want to replace, replace it
      if (target_rune)
        await interfaces.runes.virtualCall<void>(interfaces.runes.dest.runes + `/${target_rune?.id}`, new_rune, "put", false)
    },
    setSpells: async function(currentAction: IAction, lane: string, spell1Id: number, spell2Id: number) {
      // define all our summoner spells
      const summonerSpells: ILane = {
        top: [], jungle: [], middle: [], bottom: [], utility: []
      }

      // fill out summonerSpells from data.get<IConfig>("config.json")
      for (const lane in utils.file.get<IConfig>("config.json").auto.spells.lane) {
        // save their id
        summonerSpells[lane][0] = interfaces.runes.spell[ utils.file.get<IConfig>("config.json").auto.spells.lane[lane][0] ].id
        summonerSpells[lane][1] = interfaces.runes.spell[ utils.file.get<IConfig>("config.json").auto.spells.lane[lane][1] ].id
      }

      // set spells if we are locked in
      if (currentAction.completed && currentAction.type == "pick") {
        // and if we have the incorrect summoner spells
        if (spell1Id !== summonerSpells[lane][0] || spell2Id !== summonerSpells[lane][1])
          await interfaces.runes.virtualCall<void>(interfaces.runes.dest.spells, { spell1Id: summonerSpells[lane][0], spell2Id: summonerSpells[lane][1] }, "patch", false)
      }
    }
  },
  client: {
    connected: false,
    sentSkillOrder: false,
    phase: {
      current: "",
      last: ""
    },
    acceptMatch: async function() {
      const readyCheckData = await interfaces.lobby.virtualCall<IReadyCheck>(interfaces.lobby.dest.readycheck, {}, "get")
      if (readyCheckData.playerResponse == "None")
        interfaces.game.virtualCall<void>(interfaces.lobby.dest.matchaccept, {}, "post", false)
    },
    sendGameData: async function(pollInterval: number) {
      try {
        // get the client data
        const liveClientData = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata").then<Promise<ILiveClientData>>((response: Response | any) => {
          // return the json response
          return response.json()
        })

        // if we arent loaded in game yet retry later
        if (utils.reinterpret_cast<IRPC_Error>(liveClientData).httpStatus == 404)
          throw new Error("RPC_ERROR CAN IGONRE")

        // get our champion name from our Ability name xd
        const championName: string = liveClientData.activePlayer.abilities.E.id.split("E")[0].toLowerCase()
        
        // send the data to the client
        electron.overlay_window.webContents.send("liveClientData", liveClientData)

        // if we havent sent our skill order yet do so
        if (!this.sentSkillOrder) {
          // make sure we only send once
          this.sentSkillOrder = true

          // get our skill order
          const skillOrder: string[] = await web.get_skill_order(championName)
          
          // send our skill order
          electron.overlay_window.webContents.send("abilityLevelOrder", skillOrder)
        }
      } catch {
         // we dont care abt any errors
      }

      // await pollInterval before we want to run our loop again
      await utils.sleep(pollInterval)
      // if we are still conected resend data
      if (this.phase.current == interfaces.game.gameflow.INPROGRESS)
        this.sendGameData(pollInterval)
    },
    gameflowChecker: async function(pollInterval: number) {
      // update the current gameflow phase
      this.phase.current = await interfaces.game.virtualCall<string>(interfaces.game.dest.gameflow, {}, "get").catch(() => "OUTOFCLIENT")

      // check if phase has changed
      if (this.phase.current !== this.phase.last) {
        switch (this.phase.current) {
          case interfaces.game.gameflow.NONE:
            break
          case interfaces.game.gameflow.LOBBY:
            if (utils.file.get<IConfig>("config.json").misc.script)
              script.exec("onPartyJoin", clientMethods.user, clientMethods.lobby, utils.file.get<IConfig>("config.json"))
            break
          case interfaces.game.gameflow.MATCHMAKING:
            break
          case interfaces.game.gameflow.READYCHECK:
            // auto accept match if we want to
            if (utils.file.get<IConfig>("config.json").auto.acceptMatch)
              this.acceptMatch()
            break
          case interfaces.game.gameflow.CHAMPSELECT:
            this.championSelect.update(utils.time.SECOND)
            break
          case interfaces.game.gameflow.INPROGRESS:
            this.sendGameData(utils.time.SECOND)
            break
          case interfaces.game.gameflow.ENDOFGAME:
            break
          case interfaces.game.gameflow.WAITINGFORSTATS:
            break
        }

        // reset triggers so we can reuse them
        if (this.phase.current !== interfaces.game.gameflow.INPROGRESS) {
          this.sentSkillOrder = false
          this.championSelect.reset()
        }

        // update last gameflow
        this.phase.last = this.phase.current
      }

      // await pollInterval before we want to run our loop again
      await utils.sleep(pollInterval)
      // if we are still conected recheck phase
      if (this.connected)
        this.gameflowChecker(pollInterval)
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
        if (clientMethods.client.phase.current !== interfaces.game.gameflow.CHAMPSELECT)
          return

        // get data of the lobby we are in
        const lobby_data = await interfaces.lobby.virtualCall<ILobby>(interfaces.lobby.dest.lobby, {}, "get")

        // get the data of the champion select data
        const champSelectData = await interfaces.game.virtualCall<IChampSelect>(interfaces.game.dest.champselect, {}, "get")

        // make sure we are still in champselect (incase someone dodged)
        if (utils.reinterpret_cast<IRPC_Error>(champSelectData).httpStatus == 404)
          return

        // find ourself in the champion select data
        const localUserChampSelect = utils.reinterpret_cast<IActor>(champSelectData.myTeam.find((player: IActor) => player.cellId == champSelectData.localPlayerCellId))

        // get our lane data
        const lane = {
          isCorrect: false,
          using: utils.file.get<IConfig>("config.json").auto.champion.defaultLane
        }

        if (lobby_data.gameConfig == undefined || (lobby_data.gameConfig.queueId !== interfaces.lobby.queueId.ranked.solo_duo && lobby_data.gameConfig.queueId !== interfaces.lobby.queueId.ranked.flex && lobby_data.gameConfig.queueId !== interfaces.lobby.queueId.normal.draft)) {
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
            if (utils.file.get<IConfig>("config.json").auto.runes.set)
              clientMethods.user.setRunes(currentAction)

            // do we want to set out spells
            if (utils.file.get<IConfig>("config.json").auto.spells.set) {
              // no need for lane check (imo)
              clientMethods.user.setSpells(currentAction, lane.using, localUserChampSelect.spell1Id, localUserChampSelect.spell2Id)
            }

            // do we want to hover (+ lock/ban) our champion
            if (utils.file.get<IConfig>("config.json").auto.champion.set) {
              // do we want to check the lane and are we one the right lane
              if (utils.file.get<IConfig>("config.json").auto.champion.checkLane) {
                if (lane.isCorrect)
                  this.hoverBanLock(currentAction, lane.using)
              }
              else
                this.hoverBanLock(currentAction, lane.using)
            }
          }
        }

        await utils.sleep(pollInterval)
        this.update(pollInterval)
      },
      hoverBanLock: async function(currentAction: IAction, lane: string) {
        // define all the champions we want to try and pick (from data.get<IConfig>("config.json"))
        const championPicks: ILane = utils.convertToId(utils.file.get<IConfig>("config.json").auto.champion.lanePick)

        // define all the champions we want to try and ban (from data.get<IConfig>("config.json"))
        const championBans: ILane = utils.convertToId(utils.file.get<IConfig>("config.json").auto.champion.laneBan)

        // check if we can do something
        if (!currentAction.isInProgress || currentAction.completed)
          return
        
        // check if this is our turn to PICK
        if (currentAction.type == "pick") {
          // check if we have a champion selected
          if (currentAction.championId == 0 || currentAction.championId !== championPicks[lane][this.champion.index.pick])
            interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}`, { championId: championPicks[lane][this.champion.index.pick] }, "patch", false)
          
          // check if we want to lock in our selected champion
          else if (utils.file.get<IConfig>("config.json").auto.champion.lock && currentAction.championId == championPicks[lane][this.champion.index.pick])
            interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][this.champion.index.pick] }, "post", false)

          // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
          else
            this.champion.index.pick = (this.champion.index.pick == championPicks[lane].length) ? 0: this.champion.index.pick + 1
        
          // check if this is our turn to BAN
        } else if (currentAction.type == "ban") {
          // check if we have a champion selected
          if (currentAction.championId == 0 || currentAction.championId !== championBans[lane][this.champion.index.ban])
            interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}`, { championId: championBans[lane][this.champion.index.ban] }, "patch", false)
          
          // check if we want to ban our champion
          else if (utils.file.get<IConfig>("config.json").auto.champion.ban && currentAction.championId == championBans[lane][this.champion.index.ban])
            interfaces.game.virtualCall<void>(interfaces.game.dest.action + `/${currentAction.id}/complete`, { championId: championPicks[lane][this.champion.index.ban] }, "post", false)

          // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
          else
            this.champion.index.ban = (this.champion.index.ban == championBans[lane].length) ? 0: this.champion.index.ban + 1
        }
      }
    }
  }
}

// when the client connects
lcinterface.client.on("connect", async (credentials: ICredentials) => {
  // hook all the interfaces
  interfaces.hook_all(credentials)
  
  // block client until we are logged in
  await await_login()

  // the client is active
  clientMethods.client.connected = true

  // update ui
  electron.main_window.webContents.send('logged_in', clientMethods.client.connected)

  // start gameflow checker
  clientMethods.client.gameflowChecker(utils.time.SECOND)

  // auto rank
  if (utils.file.get<IConfig>("config.json").misc.rank.set)
    await clientMethods.user.setRank(utils.file.get<IConfig>("config.json").misc.rank.tier, utils.file.get<IConfig>("config.json").misc.rank.rank)

  // auto status
  if (utils.file.get<IConfig>("config.json").misc.status.set)
    await clientMethods.user.setStatus(utils.file.get<IConfig>("config.json").misc.status.text)

  // fire script event onUserConnect
  if (utils.file.get<IConfig>("config.json").misc.script)
    script.exec("onUserConnect", clientMethods.user, clientMethods.lobby, utils.file.get<IConfig>("config.json"))
})

// when the client disconnects
lcinterface.client.on("disconnect", () => {
  // unhook all the interfaces
  interfaces.unhook_all()

  // the client is not active
  clientMethods.client.connected = false

  // update ui
  electron.main_window.webContents.send('logged_in', clientMethods.client.connected)
})

// codes for saving/getting ui stuff
const ui = {
  save: {
    champion: {
      defaultLane: 0x00,
      checkLane: 0x01,
      hover: 0x02,
      lock: 0x03,
      ban: 0x04,
    },
    runes: {
      import: 0x05,
      prefix: 0x06,
    },
    spells: {
      defaultLane: 0x07,
      set: 0x08,
      data: 0x09
    },
    rank: {
      set: 0x0A,
      tier: 0x0B,
      rank: 0x0C
    },
    status: {
      set: 0x0D,
      data: 0x0E
    },
    use_scripts: 0x0F,
    accept_match: 0x11,
    overlay: 0x12,
  },
  get: {
    config: 0x10
  }
}

// when we need to save something reslove it in here
ipcMain.on("save", (_, { typeID, data }: IRenderData) => {
  let config = utils.file.get<IConfig>("config.json")
  switch (typeID) {
    case ui.save.champion.defaultLane:
      config.auto.champion.defaultLane = data.text
      break
    case ui.save.spells.defaultLane:
      config.auto.spells.defaultLane = data.text
      break
    case ui.save.champion.checkLane:
      config.auto.champion.checkLane = data.state
      break
    case ui.save.champion.hover:
      config.auto.champion.set = data.state
      break
    case ui.save.champion.lock:
      config.auto.champion.lock = data.state
      break
    case ui.save.champion.ban:
      config.auto.champion.ban = data.state
      break
    case ui.save.runes.import:
      config.auto.runes.set = data.state
      break
    case ui.save.runes.prefix:
      config.auto.runes.prefix = data.text
      break
    case ui.save.use_scripts:
      config.misc.script = data.state
      break
    case ui.save.accept_match:
      config.auto.acceptMatch = data.state
      break
    case ui.save.status.set:
      config.misc.status.set = data.state
      break
    case ui.save.rank.set:
      config.misc.rank.set = data.state
      break
    case ui.save.overlay:
      config.overlay = data.state
      electron.overlay_window.webContents.send("overlay", data.state)
      break
    case ui.save.status.data:
      config.misc.status.text = data.text
      break
    case ui.save.rank.tier:
      config.misc.rank.tier = data.text
      break
    case ui.save.rank.rank:
      config.misc.rank.rank = data.text
      break
    case ui.save.spells.data:
      const [spell, lane, index] = utils.reinterpret_cast<string[]>(data.text)
      config.auto.spells.lane[lane][parseInt(index) - 1] = spell
      break
    case ui.save.spells.set:
      config.auto.spells.set = data.state
      break
    default:
      return
  }
  utils.file.write<IConfig>("config.json", config)
})

// when we need to get something reslove it in here
ipcMain.on("get", (_, { typeID, data }: IRenderData) => {
  const config = utils.file.get<IConfig>("config.json")
  switch (typeID) {
    case ui.get.config:
      electron.main_window.webContents.send('config', config)
      break
    default:
      return
  }
})

// link ui buttons for closing and minimizing
ipcMain.on("close", () => electron.main_window.close())
ipcMain.on("min", () => electron.main_window.minimize())

// extra endpoints
interfaces.game.addDest("login", "/lol-login/v1/session")
interfaces.lobby.addDest("readycheck", "/lol-matchmaking/v1/ready-check")

// connect after updating our resources
resource.update().then(() => lcinterface.client.connect())

// setup some electron stuff
app.disableHardwareAcceleration()
app.on("ready", electron.create_window)