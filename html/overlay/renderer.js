const { ipcRenderer } = require("electron")
const fs = require("fs")

// all item data
const items = JSON.parse(fs.readFileSync("resources/data/items.json"))

// global array for our abilities
let levelArray

ipcRenderer.on("abilityLevelOrder", (e, data) => levelArray = data) 

ipcRenderer.on("overlay", (e, overlay) =>  document.getElementById("main").style = overlay? "opacity: 1;": "opacity: 0;")

ipcRenderer.on("liveClientData", (e, data) => {
  // get current time
  const gameTime = data.gameData.gameTime
  //console.log(gameTime < 1) == loading screen
  
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

  // update ui
  document.getElementById("championData").innerHTML = `( ${localPlayer.championName} ${localPlayer.level + 1}->${levelArray[localPlayer.level]} )`
  document.getElementById("kda").innerHTML = Math.round(kda * 10) / 10
  document.getElementById("goldPerMinute").innerHTML = Math.round((totalGold / gameTime) * 60)
  document.getElementById("csPerMinute").innerHTML = Math.round((localPlayer.scores.creepScore / gameTime) * 60 * 10) / 10
})