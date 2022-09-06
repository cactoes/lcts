// built-in
import * as vm from "vm"

// local
import { IO } from "../io/io"
import { Config } from "../config/config"
import { Lobby } from "../client/lobby"
import { User } from "../client/user"

const sandbox = vm.createContext()

const scriptRaw = IO.file.raw("resources/data/script.js")

vm.runInContext(scriptRaw, sandbox)

const script: Script.IScript = vm.runInContext("new LCScript()", sandbox)

export namespace Script {
  export interface IScript {
    onUserConnect(user: User.Methods, lobby: Lobby.Methods, config: Config.IConfig): boolean
    onPartyJoin(user: User.Methods, lobby: Lobby.Methods, config:  Config.IConfig): boolean
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

  class InvalidClassFunctionError extends Error {
    constructor(className: string) {
      super(`Class function '${className}' expected but not found`)
    }
  }
}