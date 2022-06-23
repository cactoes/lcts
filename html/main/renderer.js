const { ipcRenderer } = require("electron")

let config = {}
const call_update_config = () => ipcRenderer.send("getConfig")
let firstTimeSetup = false

const sleep = ms => new Promise(r => setTimeout(r, ms));
ipcRenderer.on("config", (e, data) => {
  config = data
  if (!firstTimeSetup)
    setup_ui_on_update()
})

const setup_ui_on_update = async () => {
  firstTimeSetup = true
  for (var i = 0; i < 5; i++) {
    const imgPrefix = AllLanesOneImg[i].src.split("/")
    if ( imgPrefix[imgPrefix.length - 1] == `Position_Challenger-${config.auto.champion.defaultLane}.png`) {
      AllLanesOneImg[i].className = "active_img"
    }
  }

  for (var i = 0; i < 5; i++) {
    const imgPrefix = AllLanesTwoImg[i].src.split("/")
    if ( imgPrefix[imgPrefix.length - 1] == `Position_Challenger-${config.auto.spells.defaultLane}.png`) {
      AllLanesTwoImg[i].className = "active_img"
    }
  }

  document.getElementById("checkLaneChampion").parentElement.className = `lanes__one noselect ${config.auto.champion.checkLane? "":"disabled2"}`
  document.getElementById("checkLaneSpells").parentElement.className = `lanes__two noselect ${config.auto.spells.checkLane? "":"disabled2"}`

  document.getElementById("autoPick").className = config.auto.champion.set? "":"disabled2"
  document.getElementById("autoLock").className = config.auto.champion.lock? "":"disabled2"
  document.getElementById("autoBan").className =  config.auto.champion.ban? "":"disabled2"

  document.getElementById("autoRunes").className = config.auto.runes.set? "":"disabled2"
  document.getElementById("runesPrefix").innerHTML = config.auto.runes.prefix
}

const ipc_send = (dest, data) => {
  ipcRenderer.send(dest, data)
}

const allClose = document.getElementsByClassName("client_close")
for (var i = 0; i < allClose.length; i++) {
  allClose[i].addEventListener("click", () => {ipc_send("closeWindow")})
}

const allMini = document.getElementsByClassName("client_mini")
for (var i = 0; i < allClose.length; i++) {
  allMini[i].addEventListener("click", () => {ipc_send("miniWindow")})
}

const allClient_status = document.getElementsByClassName("client_status")

ipcRenderer.on("logged_in", (e, state) => {
  if (state) {
    for (var i = 0; i < allClient_status.length; i++) {
      allClient_status[i].style = "background-color: rgba(93, 209, 103, 1); animation: none;"
    }
  } else {
    for (var i = 0; i < allClient_status.length; i++) {
      allClient_status[i].style = "background-color: rgba(209, 93, 93, 1); animation: pulse 1s infinite alternate linear;"
    }
  }
})

const allArrows = document.getElementsByClassName("arrow")

for (var i = 0; i < allArrows.length; i++) {
  allArrows[i].addEventListener("click", (e) => {
    const direction = e.target.classList[1]
    const allCards = document.getElementsByClassName("card")
    let activeElementId = undefined
    
    for (var i = 0; i < allCards.length; i++) {
      if (allCards[i].classList[1]) {
        activeElementId = i
        break
      }
    }

    for (var i = 0; i < allCards.length; i++) {
      allCards[i].className = "card"
      allCards[i].style = "display: none;"
    }

    if (direction == "right") {
      const id = activeElementId + 1 == allCards.length? 0:activeElementId + 1
      allCards[id].className = "card current"
      allCards[id].style = "display: flex;"
    } else {
      const id = activeElementId - 1 == -1? allCards.length-1:activeElementId - 1
      allCards[id].className = "card current"
      allCards[id].style = "display: flex;"
    }
  })
}

const AllLanesOneImg = document.getElementsByClassName("lanes__one")[0].querySelectorAll("img")
const AllLanesTwoImg = document.getElementsByClassName("lanes__two")[0].querySelectorAll("img")

for (var i = 0; i < AllLanesOneImg.length; i++) {
  AllLanesOneImg[i].addEventListener("click", (e) => {
    for (var i = 0; i < AllLanesOneImg.length; i++) {
      AllLanesOneImg[i].className = ""
      e.target.className = "active_img"
    }
  })
  AllLanesTwoImg[i].addEventListener("click", (e) => {
    for (var i = 0; i < AllLanesTwoImg.length; i++) {
      AllLanesTwoImg[i].className = ""
      e.target.className = "active_img"
    }
  })
}

document.getElementById("saveDefaultLanes").addEventListener("click", () => {
  let activeChampion = -1
  const currentLaneOne = document.getElementsByClassName("lanes__one")[0].querySelectorAll("img")

  let activeSpell = -1
  const currentLaneTwo = document.getElementsByClassName("lanes__two")[0].querySelectorAll("img")

  for (var i = 0; i < currentLaneOne.length; i++) {
    if (currentLaneOne[i].className == "active_img") {
      activeChampion = i
    }
    if (currentLaneTwo[i].className == "active_img") {
      activeSpell = i
    }
  }

  ipc_send("saveLanes", {
    checkChampion: document.getElementById("checkLaneChampion").parentElement.className == "lanes__one noselect",
    checkSpells: document.getElementById("checkLaneSpells").parentElement.className == "lanes__two noselect",
    championId: activeChampion,
    spellsId: activeSpell,
  })

  call_update_config()
})

document.getElementById("checkLaneChampion").addEventListener("click", (e) => {
  if (e.target.parentElement.className == "lanes__one noselect disabled") {
    e.target.parentElement.className = "lanes__one noselect"
  } else {
    e.target.parentElement.className = "lanes__one noselect disabled"
  }
})

document.getElementById("checkLaneSpells").addEventListener("click", (e) => {
  if (e.target.parentElement.className == "lanes__two noselect disabled") {
    e.target.parentElement.className = "lanes__two noselect"
  } else {
    e.target.parentElement.className = "lanes__two noselect disabled"
  }
})

document.getElementById("autoPick").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
    e.target.parentElement.className =  e.target.parentElement.className == "disabled2"? "":"disabled2"
})
document.getElementById("autoLock").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
  e.target.parentElement.className =  e.target.parentElement.className == "disabled2"? "":"disabled2"
})
document.getElementById("autoBan").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
  e.target.parentElement.className =  e.target.parentElement.className == "disabled2"? "":"disabled2"
})
document.getElementById("autoRunes").addEventListener("click", (e) => {
  e.target.className = e.target.className == "disabled2"? "":"disabled2"
})

document.getElementById("saveRunes").addEventListener("click", () => {
  const autoRunes = !(document.getElementById("autoRunes").className == "disabled2")
  const runesPrefix = document.getElementById("runesPrefix").innerHTML
  
  ipc_send("saveRunes", {
    autoRunes, runesPrefix
  })

  call_update_config()
})

document.getElementById("savePicks").addEventListener("click", () => {
  const autoPick = !(document.getElementById("autoPick").className == "disabled2")
  const autoLock = !(document.getElementById("autoLock").className == "disabled2")
  const autoBan = !(document.getElementById("autoBan").className == "disabled2")

  ipc_send("savePicks", {
    autoPick, autoLock, autoBan
  })

  call_update_config()
})

// after setup is done get config for the first time
call_update_config()