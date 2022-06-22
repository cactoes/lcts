import * as vm from "vm"
import * as fs from "fs"

// create our "safe space"
const sandbox = vm.createContext()

// get the script int string from
const scriptFile = fs.readFileSync("data/script.js").toString()

// upload the class to the sandbox
vm.runInContext(scriptFile, sandbox)

// create the script obj and export
export const script: IScript = vm.runInContext("new LCScript()", sandbox)