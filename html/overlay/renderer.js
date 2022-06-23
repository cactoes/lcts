const { ipcRenderer } = require("electron")
const fs = require("fs")

const items = JSON.parse(fs.readFileSync("resources/data/items.json"))

ipcRenderer.on("liveClientData", (e, data) => {
  const game_time = data.gameData.gameTime
  
  const localPlayer = data.allPlayers.find(player => player.summonerName == data.activePlayer.summonerName)
  let totalGold = 0
  totalGold += data.activePlayer.currentGold
  for (var i in localPlayer.items) {
    totalGold += items.data[localPlayer.items[i].itemID].gold.total
  }

  document.getElementById("goldPerMinute").innerHTML = Math.round((totalGold / game_time) * 60)
  document.getElementById("csPerMinute").innerHTML = Math.round((localPlayer.scores.creepScore / game_time) * 60 * 10) / 10
})