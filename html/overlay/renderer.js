const { ipcRenderer } = require("electron")
const fs = require("fs")

const items = JSON.parse(fs.readFileSync("resources/data/items.json"))
let levelArray

ipcRenderer.on("abilityLevelOrder", (e, data) => {
  levelArray = data
}) 

ipcRenderer.on("liveClientData", (e, data) => {
  const game_time = data.gameData.gameTime
  
  const localPlayer = data.allPlayers.find(player => player.summonerName == data.activePlayer.summonerName)
  let totalGold = 0
  totalGold += data.activePlayer.currentGold
  for (var i in localPlayer.items) {
    totalGold += items.data[localPlayer.items[i].itemID].gold.total
  }

  try {
    document.getElementById("nextToLevel").innerHTML = `${localPlayer.level}->${levelArray[localPlayer.level - 1]} )`
  } catch {}

  let kda = (localPlayer.scores.assists + localPlayer.scores.kills) / localPlayer.scores.deaths || 0

  if (kda == Infinity) {
    kda = localPlayer.scores.assists + localPlayer.scores.kills
  }

  document.getElementById("championName").innerHTML = `( ${localPlayer.championName}`
  document.getElementById("kda").innerHTML = Math.round(kda * 10) / 10
  document.getElementById("goldPerMinute").innerHTML = Math.round((totalGold / game_time) * 60)
  document.getElementById("csPerMinute").innerHTML = Math.round((localPlayer.scores.creepScore / game_time) * 60 * 10) / 10
})