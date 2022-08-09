// node_modules
import { client as LCIClient } from "lcinterface"
import { ipcMain, app } from "electron"
import pie from "puppeteer-in-electron"

// local
import { Electron } from "../electron/electron"
import { Client } from "../client/client"
import { User } from "../client/user"
import { Config } from "../config/config"
import { Interfaces } from "../interfaces/interfaces"
import { Script } from "../script/script"
import { Utils } from "../utils/utils"
import { Resource } from "../resource/resource"

LCIClient.on("connect", async (credentials: Credentials) => {
  Interfaces.hook(credentials)

  await Client.awaitLogin()
  Client.GameFlow.start()

  Electron.main_window.webContents.send('logged_in', Client.getState())

  if (Config.get().misc.rank.set)
    User.methods.setRank(Config.get().misc.rank.tier, (Config.get().misc.rank.rank))

  if (Config.get().misc.status.set)
    User.methods.setStatus(Config.get().misc.status.text)
  
  if (Config.get().script.userScript)
    Script.event.onUserConnect()
})

LCIClient.on("disconnect", () => {
  Interfaces.unhook()

  Client.disconnect()
  Client.GameFlow.stop()

  Electron.main_window.webContents.send('logged_in', Client.getState())
})

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
    script: {
      userScripts: 0x0F,
      auto: {
        kiter: {
          enabled: 0x11,
          keybinds: {
            activate: 0x12,
            attackMove: 0x13
          }
        }
      }
    },
    accept_match: 0x14,
    overlay: 0x15,
  },
  get: {
    config: 0x10
  }
}

ipcMain.on("save", (_, { typeID, data }: IRenderData) => {
  let config = Config.get()
  switch (typeID) {
    case ui.save.champion.defaultLane:
      config.auto.champion.defaultLane = data.text
      break
    case ui.save.spells.defaultLane:
      config.auto.spells.defaultLane = data.text
      break
    case ui.save.champion.checkLane:
      config.auto.champion.checkLane = data.state
      break
    case ui.save.champion.hover:
      config.auto.champion.set = data.state
      break
    case ui.save.champion.lock:
      config.auto.champion.lock = data.state
      break
    case ui.save.champion.ban:
      config.auto.champion.ban = data.state
      break
    case ui.save.runes.import:
      config.auto.runes.set = data.state
      break
    case ui.save.runes.prefix:
      config.auto.runes.prefix = data.text
      break
    case ui.save.script.userScripts:
      config.script.userScript = data.state
      break
    case ui.save.script.auto.kiter.enabled:
      config.script.auto.kiter.enabled = data.state
      break
    case ui.save.script.auto.kiter.keybinds.activate:
      config.script.auto.kiter.keybinds.activate = data.text
      break
    case ui.save.script.auto.kiter.keybinds.attackMove:
      config.script.auto.kiter.keybinds.attackMove = data.text
      break
    case ui.save.accept_match:
      config.auto.acceptMatch = data.state
      break
    case ui.save.status.set:
      config.misc.status.set = data.state
      break
    case ui.save.rank.set:
      config.misc.rank.set = data.state
      break
    case ui.save.overlay:
      config.overlay = data.state
      Electron.overlay_window.webContents.send("overlay", data.state)
      break
    case ui.save.status.data:
      config.misc.status.text = data.text
      break
    case ui.save.rank.tier:
      config.misc.rank.tier = data.text
      break
    case ui.save.rank.rank:
      config.misc.rank.rank = data.text
      break
    case ui.save.spells.data:
      const [spell, lane, index] = Utils.reinterpret_cast<string[]>(data.text)
      config.auto.spells.lane[lane][parseInt(index) - 1] = spell
      break
    case ui.save.spells.set:
      config.auto.spells.set = data.state
      break
    default:
      return
  }
  Config.save(config)
})

ipcMain.on("get", (_, { typeID, data }: IRenderData) => {
  const config = Config.get()
  switch (typeID) {
    case ui.get.config:
      Electron.main_window.webContents.send('config', config)
      break
    default:
      return
  }
})

ipcMain.on("close", () => Electron.main_window.close())
ipcMain.on("min", () => Electron.main_window.minimize())

Interfaces.lobby.addDest("readycheck", "/lol-matchmaking/v1/ready-check")

Resource.update().then(() => LCIClient.connect())

app.disableHardwareAcceleration()
pie.initialize(app).then(() => app.on("ready", Electron.createWindow) )