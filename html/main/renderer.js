const { ipcRenderer } = require("electron")

// config for local access
let config = {}
// send request to ipcmain to retrieve to config
const call_update_config = () => ipcRenderer.send("getConfig")
// have we setup the ui
let firstTimeSetup = false

// when ipcmain send us config data do ...
ipcRenderer.on("config", (e, data) => {
  // update our local config
  config = data
  // setup ui if we havent already
  if (!firstTimeSetup)
    setup_ui_on_update()
})

// the ui setup/initialise function
const setup_ui_on_update = async () => {
  // set to true so we dont do setup again
  firstTimeSetup = true

  // set the active lane in th ui from config
  for (var i = 0; i < 5; i++) {
    const imgPrefix = AllLanesOneImg[i].src.split("/")
    if ( imgPrefix[imgPrefix.length - 1] == `Position_Challenger-${config.auto.champion.defaultLane}.png`) {
      AllLanesOneImg[i].className = "active_img"
    }
  }

  // set the active lane in th ui from config
  for (var i = 0; i < 5; i++) {
    const imgPrefix = AllLanesTwoImg[i].src.split("/")
    if ( imgPrefix[imgPrefix.length - 1] == `Position_Challenger-${config.auto.spells.defaultLane}.png`) {
      AllLanesTwoImg[i].className = "active_img"
    }
  }

  // setup all values from config
  document.getElementById("checkLaneChampion").parentElement.className = `lanes__one noselect${config.auto.champion.checkLane? "":" disabled"}`
  document.getElementById("checkLaneSpells").parentElement.className = `lanes__two noselect${config.auto.spells.checkLane? "":" disabled"}`

  document.getElementById("autoPick").className = config.auto.champion.set? "":"disabled2"
  document.getElementById("autoLock").className = config.auto.champion.lock? "":"disabled2"
  document.getElementById("autoBan").className =  config.auto.champion.ban? "":"disabled2"

  document.getElementById("autoRunes").className = config.auto.runes.set? "":"disabled2"
  document.getElementById("runesPrefix").innerHTML = config.auto.runes.prefix

  document.getElementById("status").innerHTML = config.misc.status
  document.getElementById("tier").innerHTML = config.misc.rank.tier
  document.getElementById("rank").innerHTML = config.misc.rank.rank
  document.getElementById("enableScripts").className = `${config.misc.script? "":"disabled2"}`
  document.getElementById("autoAccept").className = `${config.auto.acceptMatch? "":"disabled2"}`
}

// for when we want to send something to ipcmain
const ipc_send = (dest, data) => {
  ipcRenderer.send(dest, data)
}

// global dom elements
const allClose = document.getElementsByClassName("client_close")
const allMini = document.getElementsByClassName("client_mini")
const allClient_status = document.getElementsByClassName("client_status")
const allArrows = document.getElementsByClassName("arrow")

// setup all close buttons
for (var i = 0; i < allClose.length; i++) {
  allClose[i].addEventListener("click", () => { ipc_send("closeWindow") })
}

// setup all minimize buttons
for (var i = 0; i < allMini.length; i++) {
  allMini[i].addEventListener("click", () => { ipc_send("miniWindow") })
}

// setup the left & right arrow
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

// if ipcmain send us a signal that we are (not/no longer) logged in we update the ui
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

// dom elements for the lane imgs
const AllLanesOneImg = document.getElementsByClassName("lanes__one")[0].querySelectorAll("img")
const AllLanesTwoImg = document.getElementsByClassName("lanes__two")[0].querySelectorAll("img")

// make lanes ui interactable
for (var i = 0; i < AllLanesOneImg.length; i++) {
  AllLanesOneImg[i].addEventListener("click", (e) => {
    // reset all the elements
    for (var i = 0; i < AllLanesOneImg.length; i++) {
      AllLanesOneImg[i].className = ""
      // enable the one that was clicked
      e.target.className = "active_img"
    }
  })
  AllLanesTwoImg[i].addEventListener("click", (e) => {
    // reset all the elements
    for (var i = 0; i < AllLanesTwoImg.length; i++) {
      AllLanesTwoImg[i].className = ""
      // enable the one that was clicked
      e.target.className = "active_img"
    }
  })
}

// click events for the ui
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
document.getElementById("saveDefaultLanes").addEventListener("click", (e) => {
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

document.getElementById("autoPick").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
    e.target.parentElement.className =  e.target.parentElement.className == "disabled2"? "":"disabled2"
})
document.getElementById("autoLock").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
    e.target.parentElement.className = e.target.parentElement.className == "disabled2"? "":"disabled2"
})
document.getElementById("autoBan").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
  e.target.parentElement.className =  e.target.parentElement.className == "disabled2"? "":"disabled2"
})

document.getElementById("savePicks").addEventListener("click", (e) => {
  const autoPick = !(document.getElementById("autoPick").className == "disabled2")
  const autoLock = !(document.getElementById("autoLock").className == "disabled2")
  const autoBan = !(document.getElementById("autoBan").className == "disabled2")

  ipc_send("savePicks", {
    autoPick, autoLock, autoBan
  })

  call_update_config()
})
document.getElementById("autoRunes").addEventListener("click", (e) => {
  e.target.className = e.target.className == "disabled2"? "":"disabled2"
})
document.getElementById("saveRunes").addEventListener("click", (e) => {
  const autoRunes = !(document.getElementById("autoRunes").className == "disabled2")
  const runesPrefix = document.getElementById("runesPrefix").innerHTML
  
  ipc_send("saveRunes", {
    autoRunes, runesPrefix
  })

  call_update_config()
})

document.getElementById("enableScripts").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
    e.target.className = e.target.className == "disabled2"? "":"disabled2"
})
document.getElementById("autoAccept").addEventListener("click", (e) => {
  if (e.target.nodeName == "P")
    e.target.className = e.target.className == "disabled2"? "":"disabled2"
})
document.getElementById("saveMisc").addEventListener("click", (e) => {
  const scripts = !(document.getElementById("enableScripts").className == "disabled2")
  const status = document.getElementById("status").innerHTML
  const rank = {
    tier: document.getElementById("tier").innerHTML,
    rank: document.getElementById("rank").innerHTML
  }
  const autoAccept = !(document.getElementById("autoAccept").className == "disabled2")
  ipc_send("saveMisc", {
    scripts, status, rank, autoAccept
  })

  call_update_config()
})

// after setup is done get config for the first time
call_update_config()