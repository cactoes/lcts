const { ipcRenderer } = require("electron")

let config = {}

VanillaTilt.init(document.querySelectorAll(".card"), {
  max: 10,
  speed: 200,
  glare: true,
  "max-glare": 0.3
})
let setup = false
async function update_config() {
  ipcRenderer.send("getConfig")
}

ipcRenderer.on("config", (e, data) => {
  config = data
  if (!setup) {
    setup= true
    for (var i = 0; i < AllLanesOneImg.length; i++) {
      const a = AllLanesOneImg[i].src.split("/")
      if ( a[a.length - 1] == `Position_Challenger-${config.auto.champion.defaultLane}.png`) {
        AllLanesOneImg[i].className = "active_img"
      }
    }
    
    for (var i = 0; i < AllLanesTwoImg.length; i++) {
      const a = AllLanesOneImg[i].src.split("/")
      if ( a[a.length - 1] == `Position_Challenger-${config.auto.spells.defaultLane}.png`) {
        AllLanesTwoImg[i].className = "active_img"
      }
    }
  }
})

update_config()

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

  ipcRenderer.send("saveLanes", {
    championId: activeChampion,
    spellsId: activeSpell,
  })

  update_config()
})