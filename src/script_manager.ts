import * as vm from "vm"
import * as utils from "./utils"

// create our "safe space"
const sandbox = vm.createContext()

// get the script in string from
const scriptFile = utils.file.raw("script.js")

// upload the class to the sandbox
vm.runInContext(scriptFile, sandbox)

// define our actual script
const script_file: IScript = vm.runInContext("new LCScript()", sandbox)

// define our script obj
export const script = {
  exec: async (fn: TScriptFn, user: CUser, lobby: CLobby, config: IConfig) => {
    if (script_file[fn] && typeof script_file[fn] == "function")
      script_file[fn](user, lobby, config)
  }
}