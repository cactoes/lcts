import { app, BrowserWindow, Notification } from "electron"
import { overlayWindow } from "electron-overlay-window"

export let overlay_window: BrowserWindow
export let main_window: BrowserWindow

// .show() makes it void
export const notification = (title: string, body: string): void => new Notification({ title , body }).show() 

export const create_window = (): void => {
  overlay_window = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    ...overlayWindow.WINDOW_OPTS
  })

  overlay_window.loadFile("html/overlay/index.html")
  overlay_window.setIgnoreMouseEvents(true)
  overlayWindow.attachTo(overlay_window, 'League of Legends (TM) Client')
  overlay_window.webContents.openDevTools({ mode: 'detach', activate: false })

  main_window = new BrowserWindow({
    width: 950,
    height: 550,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  main_window.loadFile("html/main/index.html")
  main_window.setIgnoreMouseEvents(false)
  //main_window.webContents.openDevTools({ mode: 'detach', activate: false })

  main_window.on("close", () => {
    app.quit()
  })
}