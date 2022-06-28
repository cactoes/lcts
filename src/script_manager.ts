import * as vm from "vm"
import { file } from "./utils"

// create our "safe space"
const sandbox = vm.createContext()

// get the script in string from
const scriptFile = file.raw("script.js")

// upload the class to the sandbox
vm.runInContext(scriptFile, sandbox)

// create the script obj and export
export const script: IScript = vm.runInContext("new LCScript()", sandbox)