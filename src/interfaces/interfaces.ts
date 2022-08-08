// node_modules
import { C_Game, C_Lobby, C_Runes, C_User } from "lcinterface"

export namespace Interfaces {
  export const game = new C_Game({ canCallUnhooked: false })
  export const lobby = new C_Lobby({ canCallUnhooked: false })
  export const runes = new C_Runes({ canCallUnhooked: false })
  export const user = new C_User({ canCallUnhooked: false })

  export function hook(credentials: Credentials): boolean {
    if (!game.hook(credentials))
      throw new HookError()

    if (!lobby.hook(credentials))
      throw new HookError()
    
    if (!runes.hook(credentials))
      throw new HookError()

    if (!user.hook(credentials))
      throw new HookError()
    
    return true
  }

  export function unhook(): boolean {
    if (!game.unhook())
      return false

    if (!lobby.unhook())
      return false

    if (!runes.unhook())
      return false

    if (!user.unhook())
      return false
    
    return true
  }

  export class HookError extends Error {
    constructor() {
      super("One or more hook(s) failed to hook")
    }
  }

}