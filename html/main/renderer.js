const { ipcRenderer } = require("electron")
const { open } = require("openurl")

// config for local access
let config = {}
// have we setup the ui
let firstTimeSetup = false

// conversion table for tiers
const tierlist = {
  "iron": 1,
  "bronze": 2,
  "silver": 3,
  "gold": 4,
  "platinum": 5,
  "diamond": 6,
  "master": 7,
  "challenger": 8
}

// conversion table for ranks
const ranklist = {
  "I": 1,
  "II": 2,
  "III": 3,
  "IV": 4
}

// conversion table for spells
const spellList = {
  "Barrier": {
    "value": 1,
    "id": 0
  },
  "Cleanse": {
    "value": 2,
    "id": 1
  },
  "Exhaust": {
    "value": 3,
    "id": 3
  },
  "Flash": {
    "value": 4,
    "id": 4
  },
  "Ghost": {
    "value": 5,
    "id": 6
  },
  "Heal": {
    "value": 6,
    "id": 7
  },
  "Smite": {
    "value": 7,
    "id": 11
  },
  "Teleport": {
    "value": 8,
    "id": 12
  },
  "Ignite": {
    "value": 9,
    "id": 14
  },
  "Mark": {
    "value": 10,
    "id": 32
  }
}

// typeIDs
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

// all dom elements
const AllImgChapionDefault = document.getElementById("DefaultLaneChampion").querySelectorAll("img")
const AllImgSpellsDefault = document.getElementById("DefaultLaneSpells").querySelectorAll("img")
const AllToggles = document.getElementsByClassName("toggle")
const AllMenuButtons = document.getElementsByClassName("menu__box")[0].querySelectorAll("a")
const AllMenus = document.getElementById("content").querySelectorAll("div")
const AllSpellButtons = document.getElementsByClassName("spells__container")

// send request to ipcmain to retrieve to config
const call_update_config = () => ipc_send("get", ui.get.config, {})
// for when we want to send something to ipcmain
const ipc_send = (type, typeID, data) => ipcRenderer.send(type, { typeID, data }) && call_update_config()

// convert id to text or text to id
const convertTier = (input) => input % 1 == 0? Object.keys(tierlist)[input - 1] : tierlist[input]
const convertRank = (input) => input % 1 == 0? Object.keys(ranklist)[input - 1] : ranklist[input]
const converSpell = (input) => {
  if (input % 1 == 0) {
    for (const spell in spellList)
      if (spellList[spell].value == input)
        return spell
  }
  else
    return spellList[input]
}

ipcRenderer.on("logged_in", (e, state) => {
  document.getElementById("status").style = state? "background-color: #89F38D;":""
  document.getElementById("status_text").innerHTML = state? "Connected":"Disconnected"
})

// when ipcmain send us config data do we update our local config ( + setup ui )
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

  // set the active lane in the ui from config
  for (var i = 0; i < 5; i++) {
    const imgPrefix = AllImgChapionDefault[i].src.split("/")
    if (imgPrefix[imgPrefix.length - 1] == `Position_Challenger-${config.auto.champion.defaultLane}.png`) {
      AllImgChapionDefault[i].className = "active"
    }
  }

  // set the active lane in the ui from config
  for (var i = 0; i < 5; i++) {
    const imgPrefix = AllImgSpellsDefault[i].src.split("/")
    if (imgPrefix[imgPrefix.length - 1] == `Position_Challenger-${config.auto.spells.defaultLane}.png`) {
      AllImgSpellsDefault[i].className = "active"
    }
  }

  // set buttons to (in)active in the ui from the config
  document.getElementById("LaneCheck").className = config.auto.champion.checkLane? "toggle toggle_active":"toggle"
  document.getElementById("HoverChampion").className = config.auto.champion.set? "toggle toggle_active":"toggle"
  document.getElementById("LockChampion").className = config.auto.champion.lock? "toggle toggle_active":"toggle"
  document.getElementById("BanChampion").className = config.auto.champion.ban? "toggle toggle_active":"toggle"
  document.getElementById("ImportRunes").className = config.auto.runes.set? "toggle toggle_active":"toggle"
  document.getElementById("UseScripts").className = config.misc.script? "toggle toggle_active":"toggle"
  document.getElementById("AcceptMatch").className = config.auto.acceptMatch? "toggle toggle_active":"toggle"
  document.getElementById("SetStatus").className = config.misc.status.set? "toggle toggle_active":"toggle"
  document.getElementById("SetRank").className = config.misc.rank.set? "toggle toggle_active":"toggle"
  document.getElementById("IGOverlay").className = config.overlay? "toggle toggle_active":"toggle"
  document.getElementById("SetSpells").className = config.auto.spells.set? "toggle toggle_active":"toggle"
  document.getElementById("tier").value = convertTier(config.misc.rank.tier)
  document.getElementById("rank").value = convertRank(config.misc.rank.rank)
  document.getElementById("statusText").value = config.misc.status.text
  document.getElementById("runePrefix").value = config.auto.runes.prefix

  for (const lane in config.auto.spells.lane) {
    document.getElementById("spells_" + lane + "_1").value = converSpell(config.auto.spells.lane[lane][0]).value
    document.getElementById("spells_" + lane + "_2").value = converSpell(config.auto.spells.lane[lane][1]).value
  }
}

// events for images
for (var i = 0; i < AllImgChapionDefault.length; i++) {
  AllImgChapionDefault[i].addEventListener("click", (e) => {
    // reset all the elements
    for (var j = 0; j < AllImgChapionDefault.length; j++) {
      AllImgChapionDefault[j].className = ""
    }
    // enable the one that was clicked
    e.target.className = "active"
    // update cfg
    ipc_send("save", ui.save.champion.defaultLane, { text: e.target.src.split("-")[1].split(".")[0].toLowerCase() })
  })
  AllImgSpellsDefault[i].addEventListener("click", (e) => {
    // reset all the elements
    for (var j = 0; j < AllImgSpellsDefault.length; j++) {
      AllImgSpellsDefault[j].className = ""
    }
    // enable the one that was clicked
    e.target.className = "active"
    // update cfg
    ipc_send("save", ui.save.spells.defaultLane, { text: e.target.src.split("-")[1].split(".")[0].toLowerCase() })
  })
}

// events for toggles
for (var i = 0; i < AllToggles.length; i++) {
  AllToggles[i].addEventListener("click", (e) => {
    e.target.className = e.target.className == "toggle"? "toggle toggle_active":"toggle"
    switch (e.target.id) {
      case "LaneCheck":
        ipc_send("save", ui.save.champion.checkLane, { state: e.target.className == "toggle toggle_active" })
        break
      case "HoverChampion":
        ipc_send("save", ui.save.champion.hover, { state: e.target.className == "toggle toggle_active" })
        break
      case "LockChampion":
        ipc_send("save", ui.save.champion.lock, { state: e.target.className == "toggle toggle_active" })
        break
      case "BanChampion":
        ipc_send("save", ui.save.champion.ban, { state: e.target.className == "toggle toggle_active" })
        break
      case "ImportRunes":
        ipc_send("save", ui.save.runes.import, { state: e.target.className == "toggle toggle_active" })
        break
      case "UseScripts":
        ipc_send("save", ui.save.use_scripts, { state: e.target.className == "toggle toggle_active" })
        break
      case "AcceptMatch":
        ipc_send("save", ui.save.accept_match, { state: e.target.className == "toggle toggle_active" })
        break
      case "SetStatus":
        ipc_send("save", ui.save.status.set, { state: e.target.className == "toggle toggle_active" })
        break
      case "SetRank":
        ipc_send("save", ui.save.rank.set, { state: e.target.className == "toggle toggle_active" })
        break
      case "IGOverlay":
        ipc_send("save", ui.save.overlay, { state: e.target.className == "toggle toggle_active" })
        break
      case "SetSpells":
        ipc_send("save", ui.save.spells.set, { state: e.target.className == "toggle toggle_active" })
        break
    }
  })
}
  
// menu buttons
for (var i = 0; i < AllMenuButtons.length; i++) {
  AllMenuButtons[i].addEventListener("click", () => {
    for (var j = 0; j < AllMenuButtons.length; j++) {
      AllMenuButtons[j].className = "menu__item"
    }
    for (var j = 0; j < AllMenus.length; j++) {
      if (AllMenus[j].className.startsWith("content__container noselect"))
        AllMenus[j].className = "content__container noselect"
    }
  })
}

// spells buttons
for (var i = 0; i < AllSpellButtons.length; i++) {
  AllSpellButtons[i].addEventListener("change", (e) => {
    const [base, lane, index] = e.target.id.split("_")
    ipc_send("save",  ui.save.spells.data, { text: [converSpell(e.target.value), lane, index] })
  })
}

document.getElementById("HomeButton").addEventListener("click", (e) => {
  e.target.className = "menu__item active"
  document.getElementById("Home").className = "content__container noselect selected"
})
document.getElementById("BlindButton").addEventListener("click", (e) => {
  e.target.className = "menu__item active"
  document.getElementById("BlindPickSettings").className = "content__container noselect selected"
})
document.getElementById("GeneralButton").addEventListener("click", (e) => {
  e.target.className = "menu__item active"
  document.getElementById("ChampionSelectSettings").className = "content__container noselect selected"
})
document.getElementById("RunesButton").addEventListener("click", (e) => {
  e.target.className = "menu__item active"
  document.getElementById("RuneSettings").className = "content__container noselect selected"
})
document.getElementById("MiscButton").addEventListener("click", (e) => {
  e.target.className = "menu__item active"
  document.getElementById("MiscSettings").className = "content__container noselect selected"
})
document.getElementById("SpellsButton").addEventListener("click", (e) => {
  e.target.className = "menu__item active"
  document.getElementById("SpellsSettings").className = "content__container noselect selected"
})

// runes prefix
document.getElementById("runePrefix").addEventListener("keyup", (e) => ipc_send("save", ui.save.runes.prefix, { text: e.target.value }) )

// status
document.getElementById("statusText").addEventListener("keyup", (e) => ipc_send("save", ui.save.status.data, { text: e.target.value }) )

// tier
document.getElementById("tier").addEventListener("change", (e) => {
  ipc_send("save", ui.save.rank.tier, { text: convertTier(e.target.value) })
})

// rank
document.getElementById("rank").addEventListener("change", (e) => {
  ipc_send("save", ui.save.rank.rank, { text: convertRank(e.target.value) })
})

// github link
document.getElementById("github").addEventListener("click", () => open("https://github.com/cactoes/lcts"))
// u.gg link
document.getElementById("ugg").addEventListener("click", () => open("https://u.gg"))

// window buttons
document.getElementById("min").addEventListener("click", () => ipc_send("min", -1, {}))
document.getElementById("close").addEventListener("click", () => ipc_send("close", -1, {}))

// after setup is done get config for the first time
call_update_config()