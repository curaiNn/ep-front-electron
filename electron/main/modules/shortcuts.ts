import { app, BrowserWindow, globalShortcut } from 'electron'

/**
 * 检查是否为 macOS
 */
const isMac = process.platform === 'darwin'

/**
 * 注册所有全局快捷键
 * 在 app 'ready' 事件之后调用
 */
export const registerGlobalShortcuts = (): void => {
  // 1. 注册开发者工具快捷键
  const devToolsShortcut = isMac ? 'Cmd+Control+Shift+D' : 'Ctrl+Shift+Alt+D'
  try {
    const ret = globalShortcut.register(devToolsShortcut, () => {
      console.log(`全局快捷键 ${devToolsShortcut} 被按下了！`)
      const focusedWindow = BrowserWindow.getFocusedWindow()
      if (focusedWindow) {
        focusedWindow.webContents.toggleDevTools()
      }
    })

    if (!ret) {
      console.warn(`快捷键 ${devToolsShortcut} 注册失败`)
    }
  } catch (error) {
    console.error('注册开发者工具快捷键时出错:', error)
  }

  // 2. 在此注册其他全局快捷键...
}

/**
 * 注销所有全局快捷键
 * 在 app 'will-quit' 事件中调用
 */
export const unregisterAllShortcuts = (): void => {
  globalShortcut.unregisterAll()
}
