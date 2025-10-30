import { app, BrowserWindow } from 'electron'
import { startApp } from './modules/startApp'
import { createApplicationMenu } from './modules/menu'
import { registerIpcHandlers } from './ipc'

// 1. 导入新的 shortcuts 模块
import { registerGlobalShortcuts, unregisterAllShortcuts } from './modules/shortcuts'

// 核心应用生命周期
app.whenReady().then(() => {
  // 2. 创建菜单栏 (不再注册快捷键)
  createApplicationMenu()

  // 3. 注册全局快捷键
  registerGlobalShortcuts()

  // 4. 注册所有 IPC 监听器
  registerIpcHandlers()

  // 5. 启动应用 (创建窗口)
  startApp()
})

// 在所有窗口关闭时退出应用 (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 6. 在应用退出前，注销所有全局快捷键
app.on('will-quit', () => {
  unregisterAllShortcuts()
})

// 在 macOS 上，点击 Dock 栏图标时重新创建窗口
app.on('activate', () => {
  // 当所有窗口都关闭时，重新启动应用
  if (BrowserWindow.getAllWindows().length === 0) {
    startApp()
  }
})
