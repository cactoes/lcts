const ffi = require('ffi-napi')
const wchar = require('ref-wchar-napi')
const ref = require('ref-napi')
const struct = require('ref-struct-di')(ref)

// Create the struct required to save the window bounds
const Rect = struct({
	left: 'long',
	top: 'long',
	right: 'long',
	bottom: 'long'
})
const RectPointer = ref.refType(Rect)

// Create FFI declarations for the C++ library and functions needed (User32.dll), using their "Unicode" (UTF-16) version
var user32 = new ffi.Library('user32', {
	GetForegroundWindow: ['pointer', []],
  GetWindowTextW: ['int', ['pointer', 'pointer', 'int']],
	GetWindowTextLengthW: ['int', ['pointer']],
  GetWindowRect: ['bool', ['pointer', RectPointer]],
})

export interface IWindow {
  title: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

export const getActive = (): undefined | IWindow => {
  // Get a "handle" of the active window
  const activeWindowHandle = user32.GetForegroundWindow()

  // Failed to get active window handle
  if (ref.isNull(activeWindowHandle))
    return undefined

  // Get the window text length in "characters" to create the buffer
  const windowTextLength = user32.GetWindowTextLengthW(activeWindowHandle)
  
  // Allocate a buffer large enough to hold the window text as "Unicode" (UTF-16) characters (using ref-wchar-napi)
	// This assumes using the "Basic Multilingual Plane" of Unicode, only 2 characters per Unicode code point
	// Include some extra bytes for possible null characters
  const windowTextBuffer = Buffer.alloc((windowTextLength * 2) + 4)

  // Write the window text to the buffer (it returns the text size, but it's not used here)
  user32.GetWindowTextW(activeWindowHandle, windowTextBuffer, windowTextLength + 2)
  
  // Remove trailing null characters
  const windowTextBufferClean = ref.reinterpretUntilZeros(windowTextBuffer, wchar.size)
  
  // Create a new instance of Rect, the struct required by the `GetWindowRect` method
  const bounds = new Rect()

  // Get the window bounds and save it into the `bounds` variable. fails if we didnt get the window rect
  if (user32.GetWindowRect(activeWindowHandle, bounds.ref()) === 0)
    return undefined

  return {
    title: wchar.toString(windowTextBufferClean),
    bounds: {
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top
    }
  }
}

// taken from https://github.com/sindresorhus/active-win bc the npm module just wouldnt work