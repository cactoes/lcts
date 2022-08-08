const { ipcRenderer } = require("electron")
const fs = require("fs")

// all item data
const items = JSON.parse(fs.readFileSync("resources/data/items.json"))

// global array for our abilities
let skillOrder = new Array(18).fill(0)

ipcRenderer.on("abilityLevelOrder", (e, data) => skillOrder = data) 

ipcRenderer.on("overlay", (e, overlay) =>  document.getElementById("main").style = overlay? "opacity: 1;": "opacity: 0;")

ipcRenderer.on("liveClientData", (e, data) => {
  // get current time
  const gameTime = data.gameData.gameTime

  // only dislpay when no longer loading
  document.getElementById("main").style = gameTime > 1? "opacity: 1;": "opacity: 0;"
  
  // get the local player from the list of players
  const localPlayer = data.allPlayers.find(player => player.summonerName == data.activePlayer.summonerName)

  // total gol value (items + gold held)
  let totalGold = 0
  totalGold += data.activePlayer.currentGold
  for (var i in localPlayer.items) {
    totalGold += items.data[localPlayer.items[i].itemID].gold.total
  }

  // get base kda
  let kda = (localPlayer.scores.assists + localPlayer.scores.kills) / localPlayer.scores.deaths || 0

  // abs to make sure its alway + infinity
  if (Math.abs(kda) == Infinity) {
    kda = localPlayer.scores.assists + localPlayer.scores.kills
  }

  let nextToLevelId = 0

  nextToLevelId += data.activePlayer.abilities.Q.abilityLevel
  nextToLevelId += data.activePlayer.abilities.W.abilityLevel
  nextToLevelId += data.activePlayer.abilities.E.abilityLevel
  nextToLevelId += data.activePlayer.abilities.R.abilityLevel

  if (nextToLevelId == 18)
    nextToLevelId = 17

  // update ui
  document.getElementById("gametype").innerHTML = `${data.gameData.gameMode.toLowerCase()}`
  document.getElementById("championData").innerHTML = `( ${localPlayer.championName} ${nextToLevelId + 1}->${skillOrder[nextToLevelId]} )`
  document.getElementById("kda").innerHTML = Math.round(kda * 10) / 10
  document.getElementById("goldPerMinute").innerHTML = Math.round((totalGold / gameTime) * 60)
  document.getElementById("csPerMinute").innerHTML = Math.round((localPlayer.scores.creepScore / gameTime) * 60 * 10) / 10
})