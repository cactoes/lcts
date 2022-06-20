import { client, C_Game, C_User, C_Runes, C_Lobby } from "lcinterface"
import { runes, championTable, getVersion } from "./form_data"
import { get_rune_from_web } from "./web_rune"

const fs = require("fs")

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const SECOND: number = 1000

const getKeyByValue = (object: any, value: number): string => {
  let final: string | undefined = Object.keys(object).find(key => object[key] === value)
  
  if (!final)
    final = ""
  
  return final
}

const champion: IChampionTable = JSON.parse(fs.readFileSync("data/championTable.json").toString())
const rune: IRuneTable = JSON.parse(fs.readFileSync("data/runeTable.json").toString())
const spellTable: ISpellTable = {
  Barrier: {
    id: 0,
    key: "SummonerBarrier"
  },
  Cleanse: {
    id: 1,
    key: "SummonerBoost"
  },
  Exhaust: {
    id: 3,
    key: "SummonerExhaust"
  },
  Flash: {
    id: 4,
    key: "SummonerFlash"
  },
  Ghost: {
    id: 6,
    key: "SummonerHaste"
  },
  Heal: {
    id: 7,
    key: "SummonerHeal"
  },
  Smite: {
    id: 11,
    key: "SummonerSmite"
  },
  Teleport: {
    id: 12,
    key: "SummonerTeleport"
  },
  Clarity: {
    id: 13,
    key: "SummonerMana"
  },
  Ignite: {
    id: 14,
    key: "SummonerDot"
  },
  Mark: {
    id: 32,
    key: "SummonerSnowball"
  }
}

const interfaces = {
  user: new C_User({canCallUnhooked: false}),
  game: new C_Game({canCallUnhooked: false}),
  runes: new C_Runes({canCallUnhooked: false}),
  lobby: new C_Lobby({canCallUnhooked: false})
}

const user: CUser = {
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
  }
}

const game: CGame = {
  available: false,
  acceptedMatch: false,
  AAMEnabled: true,
  APCEnabled: true,
  GAMEFLOW_PHASE: '',
  GAMEFLOW_PHASE_LAST: '',
  championPickIndex: 0,
  championBanIndex: 0,
  hasSetRunes: false,
  updateGameflow: async function() {
    // update the gameflow phase
    try { this.GAMEFLOW_PHASE = await interfaces.game.virtualCall<string>(interfaces.game.dest.gameflow, {}, "get") } catch {  }
    
    // call methods that depend on the gameflow check || depend on checking every second
    if (this.APCEnabled)
      this.autoPickChampion()

    if (this.GAMEFLOW_PHASE !== this.GAMEFLOW_PHASE_LAST) {
      console.log(this.GAMEFLOW_PHASE)
      // call methods that depend on the gameflow update
      if (this.AAMEnabled)
        this.autoAcceptMatch()
  
      // reset any state changes
      if (this.acceptedMatch)
        this.acceptedMatch = false
      
      if (this.GAMEFLOW_PHASE !== interfaces.game.gameflow.CHAMPSELECT) {
        this.championPickIndex = 0
        this.championBanIndex = 0
        this.hasSetRunes = false
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
      
      // define all the champions we want to try and pick
      const championPicks: ILane = {
        top: [ champion.data["Irelia"], champion.data["Gwen"] ],
        jungle: [ champion.data["Lilia"], champion.data["Gwen"] ],
        middle: [ champion.data["Irelia"], champion.data["Oriana"] ],
        bottom: [ champion.data["Caitlyn"], champion.data["Kaisa"] ],
        support: [ champion.data["Pyke"], champion.data["Lux"] ]
      }

      // define all the champions we want to try and ban
      const championBans: ILane = {
        top: [ champion.data["Garen"] ],
        jungle: [ champion.data["Belveth"] ],
        middle: [ champion.data["Akali"] ],
        bottom: [ champion.data["Ezreal"] ],
        support: [ champion.data["Nautilus"] ]
      }

      // define all our summoner spells
      const summonerSpells: ILane = {
        top: [ spellTable.Teleport.id, spellTable.Flash.id ],
        jungle: [ spellTable.Smite.id, spellTable.Flash.id ],
        middle: [ spellTable.Ignite.id, spellTable.Flash.id ],
        bottom: [ spellTable.Heal.id, spellTable.Flash.id ],
        support: [ spellTable.Ignite.id, spellTable.Flash.id ]
      }

      // do we want to lock in or only pick
      const lockChampion: boolean = true
      const lockBanChampion: boolean = true

      // do we want to set our runes automatically (rune name has to start with "_change" || "[u.gg]")
      const autoSetRunes: boolean = true

      // do we want to set our summner spell auitomatically
      const autoSetSummoners: boolean = true

      // do we want to check if we have our chosen (primary) lane
      const checkLane: boolean = false

      // set our default lane incase we dont have one
      const defaultLane: string = "bottom"

      // get our (primary) lane
      const lane: string = lobby_data.localMember.firstPositionPreference == ""? defaultLane : lobby_data.localMember.firstPositionPreference.toLowerCase()
      
      // lane checks
      if (checkLane && localUserChampSelect?.assignedPosition.toLowerCase() !== lane)
        return

      // loop trough all the actions
      for (const pair in champSelectData.actions) {
        for (const action in champSelectData.actions[pair]) {
          // get the current action data
          const currentAction: IAction = champSelectData.actions[pair][action] // championId, completed, id, isAllyAction, isInProgress, pickTurn, type, actorCellId

          // set runes if we are locked in
          if (autoSetRunes && !game.hasSetRunes && currentAction.completed && currentAction.championId == championPicks[lane][game.championPickIndex]) {
            game.hasSetRunes = true
            
            const rune_data = await get_rune_from_web(getKeyByValue(champion.data, championPicks[lane][game.championPickIndex]).toLowerCase())

            const user_runes = await interfaces.runes.virtualCall<ISavedRune[]>(interfaces.runes.dest.runes, {}, "get")
            const target_rune: ISavedRune | undefined = user_runes.find((r: ISavedRune) => r.name.startsWith("_change") || r.name.startsWith("[u.gg]"))

            // summoner spells
            if (autoSetSummoners)
              await interfaces.lobby.virtualCall<void>("/lol-champ-select/v1/session/my-selection", { spell1Id: summonerSpells[lane][0], spell2Id: summonerSpells[lane][1] }, "patch", false)

            // runes
            if (target_rune)
              await interfaces.runes.virtualCall<void>(interfaces.runes.dest.runes + `/${target_rune?.id}`, rune_data, "put", false)
          }

          // is it our trun
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
              interfaces.game.virtualCall<void>(`/lol-champ-select/v1/session/actions/${currentAction.id}`, { championId: championPicks[lane][game.championPickIndex] }, "patch", false)
            
            // check if we want to lock in our selected champion
            else if (lockChampion && currentAction.championId == championPicks[lane][game.championPickIndex])
              interfaces.game.virtualCall<void>(`/lol-champ-select/v1/session/actions/${currentAction.id}/complete`, { championId: championPicks[lane][game.championPickIndex] }, "post", false)
  
            // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
            else
              game.championPickIndex = (game.championPickIndex == championPicks[lane].length) ? 0 : game.championPickIndex + 1
          
            // check if this is our turn to BAN
          } else if (currentAction.type == "ban") {
            // check if we have a champion selected
            if (currentAction.championId == 0 || currentAction.championId !== championBans[lane][game.championBanIndex])
              interfaces.game.virtualCall<void>(`/lol-champ-select/v1/session/actions/${currentAction.id}`, { championId: championBans[lane][game.championBanIndex] }, "patch", false)
            
            // check if we want to ban our champion
            else if (lockBanChampion && currentAction.championId == championBans[lane][game.championBanIndex])
              interfaces.game.virtualCall<void>(`/lol-champ-select/v1/session/actions/${currentAction.id}/complete`, { championId: championPicks[lane][game.championBanIndex] }, "post", false)

            // if we couldnt pick our champion try next champion in the list, if we had all retry the entire list?
            else
              game.championBanIndex = (game.championBanIndex == championBans[lane].length) ? 0 : game.championBanIndex + 1
          }
        }
      }

    }
  }
}

const lobby: CLobby = {
  setLanes: async function(firstPreference: string, secondPreference: string) {
    return await interfaces.lobby.virtualCall<void>(interfaces.lobby.dest.position, { firstPreference, secondPreference }, "put", false)
  },
  createLobby: async function(queueId: number) {
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
  const game_version = await getVersion()
  
  // check game version
  if (champion.version !== game_version || rune.version !== game_version) {
    fs.writeFileSync("data/championTable.json", JSON.stringify({
      version: game_version,
      data: await championTable()
    }, null, 2))

    fs.writeFileSync("data/runeTable.json", JSON.stringify({
      version: game_version,
      data: await runes()
    }, null, 2))
  }

  // hook all the interfaces
  interfaces.user.hook(credentials)
  interfaces.game.hook(credentials)
  interfaces.runes.hook(credentials)
  interfaces.lobby.hook(credentials)
  
  // setup some destinations
  interfaces.game.addDest("login", "/lol-login/v1/session")
  interfaces.game.addDest("champselect", "/lol-champ-select/v1/session")

  // https://lcu.vivide.re/

  // wait for client to be logged in
  await await_login()
  game.available = true
  console.log("connected")

  // gameflow checker (loop)
  game.updateGameflow()
  
  if (interfaces.user.isCorrectState("hooked", true)) {
    await user.setStatus("ぺこら")
    await user.setRank("diamond", "III")
  }

  //console.log(await interfaces.lobby.virtualCall(interfaces.lobby.dest.lobby, {}, "get"))

  if (interfaces.lobby.isCorrectState("hooked", true)) {
    //await lobby.createLobby(interfaces.lobby.queueId.normal.draft)
    //await lobby.setLanes(interfaces.game.lane.BOTTOM, interfaces.game.lane.MIDDLE)
    //await lobby.setPartyType(interfaces.lobby.type.open)

    //await lobby.startSearch()
  }
})

client.on("disconnect", () => {
  // unhook all the interfaces
  interfaces.user.unhook()
  interfaces.game.unhook()
  interfaces.runes.unhook()
  interfaces.lobby.unhook()

  // make sure gameloop doesnt continue
  game.available = false

  console.log("disconnected")
})

client.connect()

const await_login = async () => {
  let logged_in = !1
  for (; !logged_in; ) {
      try {
          await interfaces.game.virtualCall<boolean>(interfaces.game.dest.login, {}, "get") && (logged_in = !0)
      } catch {
          console.log("not logged in")
      }
      await sleep(1 * SECOND)
  }
  return !0
}

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