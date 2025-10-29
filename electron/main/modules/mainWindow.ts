import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

/**
 * 创建主窗口 (Main Window)
 */
export function createWindow(): BrowserWindow {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 768,
    show: false, // 关键：主窗口初始时隐藏
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true, // 保持开启以确保安全
      nodeIntegration: false // 保持关闭
    }
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // 这段逻辑和你 windowManager.ts 中的逻辑是一致的
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // 自动打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 路径从: electron/main/modules
    // 到: dist/index.html
    mainWindow.loadFile(join(__dirname, '../../../dist/index.html'))
  }

  return mainWindow
}
