// built-in
import * as vm from "vm"

// node_modules
import * as outputAPI from "@nut-tree/nut-js"
import inputAPI from "gkm"

// local
import { IO } from "../io/io"
import { Config } from "../config/config"
import { Lobby } from "../client/lobby"
import { User } from "../client/user"
import * as window from "./activeWindow"
import { Client } from "../client/client"
import { Interfaces } from "../interfaces/interfaces"
import { Utils } from "../utils/utils"

const sandbox = vm.createContext()

const scriptRaw = IO.file.raw("resources/data/script.js")

vm.runInContext(scriptRaw, sandbox)

const script: Script.IScript = vm.runInContext("new LCScript()", sandbox)

export namespace Script {
  export interface IScript {
    onUserConnect(user: User.Methods, lobby: Lobby.Methods, config: Config.IConfig): boolean
    onPartyJoin(user: User.Methods, lobby: Lobby.Methods, config:  Config.IConfig): boolean
  }

  export const methods = {
    auto: {
      kiter: {
        isRunning: false,
        timer: setTimeout(()=>{}, 0),
        attackSpeed: 1,

        run: function() {
          if (Client.GameFlow.getCurrent() !== Interfaces.game.gameflow.INPROGRESS || !Config.get().script.auto.kiter.enabled)
            return
          
          this.isRunning = true

          outputAPI.keyboard.type(Config.get().script.auto.kiter.keybinds.attackMove.toLowerCase())
          outputAPI.mouse.rightClick()

          clearTimeout(this.timer)

          this.timer = setTimeout(() => { this.isRunning = false }, this.attackSpeed * Utils.time.SECOND)
        }
      }
    }
  }

  export const event = {
    onUserConnect: function(): boolean {
      if (typeof script.onUserConnect == "function")
        return script.onUserConnect(User.methods, Lobby.methods, Config.get())
      else
        throw new InvalidClassFunctionError("onUserConnect")
    },

    onPartyJoin: function(): boolean {
      if (typeof script.onPartyJoin == "function")
      return script.onPartyJoin(User.methods, Lobby.methods, Config.get())
    else
      throw new InvalidClassFunctionError("onPartyJoin")
    }
  }

  inputAPI.events.on("key.pressed", async (key: string[]) => {
    const config = Config.get().script
    switch (key[0]) {
      case config.auto.kiter.keybinds.activate.toUpperCase():
        if (!methods.auto.kiter.isRunning)
          if (window.getActive()?.title == "League of Legends (TM) Client")
            methods.auto.kiter.run()
        break
    }
  })

  class InvalidClassFunctionError extends Error {
    constructor(className: string) {
      super(`Class function '${className}' expected but not found`)
    }
  }
}