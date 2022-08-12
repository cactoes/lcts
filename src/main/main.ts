// node_modules
import { LCIConnector, LCIClient } from "lcinterface"
import { ipcMain, app } from "electron"
import pie from "puppeteer-in-electron"

// local
import { Electron } from "../electron/electron"
import { Client } from "../client/client"
import { User } from "../client/user"
import { Config } from "../config/config"
import { Script } from "../script/script"
import { Utils } from "../utils/utils"
import { Resource } from "../resource/resource"

const connector = new LCIConnector()

connector.on("connect", async (credentials: Credentials) => {
  LCIClient.hook(credentials)

  await Client.connect()

  Electron.uiWindow.webContents.send('logged_in', Client.getState())

  if (Config.get().misc.rank.set)
    User.methods.setRank(Config.get().misc.rank.tier, (Config.get().misc.rank.rank))

  if (Config.get().misc.status.set)
    User.methods.setStatus(Config.get().misc.status.text)
  
  if (Config.get().script.userScript)
    Script.event.onUserConnect()
})

connector.on("disconnect", () => {
  LCIClient.unhook()

  Client.disconnect()

  Electron.uiWindow.webContents.send('logged_in', Client.getState())
})

const ui = {
  save: 0x00,
  overlay: 0x01,
  spells: 0x02,
  get: {
    config: 0x10
  }
}

ipcMain.on("save", (_, { typeID, path, data }: IRenderData) => {
  let config = Config.get()
  switch (typeID) {
    case ui.save:
      if (data.text)
        Utils.setValueForKeyPath<string>(config, data.text, path)
      else
        Utils.setValueForKeyPath<boolean>(config, data.state, path)
      break
    case ui.overlay:
      config.overlay = data.state
      Electron.overlay_window.webContents.send("overlay", data.state)
      break
    case ui.spells:
      const [spell, lane, index] = Utils.reinterpret_cast<string[]>(data.text)
      config.auto.spells.lane[lane][parseInt(index) - 1] = spell
      break
    default:
      return
  }
  Config.save(config)
})

ipcMain.on("get", (_, { typeID, path, data }: IRenderData) => {
  const config = Config.get()
  switch (typeID) {
    case ui.get.config:
      Electron.uiWindow.webContents.send('config', config)
      break
    default:
      return
  }
})

ipcMain.on("close", () => Electron.uiWindow.close())
ipcMain.on("min", () => Electron.uiWindow.minimize())

LCIClient.addEndpoint("lobby", "readycheck", "/lol-matchmaking/v1/ready-check")

Resource.update().then(() => connector.connect())

app.disableHardwareAcceleration()
pie.initialize(app).then(() => app.on("ready", Electron.createWindow) )