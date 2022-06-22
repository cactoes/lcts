const { ipcRenderer } = require("electron")

ipcRenderer.on("game_state", (e, msg) => console.log(
  document.getElementById("overlay").innerHTML = msg
))