import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

import { findViewMap } from '../view/findView'

export function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 启动时隐藏，由 appLifecycle 控制
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 监听 "found-in-page" 结果
  mainWindow.webContents.on('found-in-page', (event, result) => {
    const findView = findViewMap.get(mainWindow)
    if (findView) {
      findView.webContents.send('found-in-page', result)
    }
  })

  // --- 加载页面 ---
  if (is.dev && process.env['EL†ECTRON_RENDERER_URL']) {
    // 开发模式
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // 自动打开开发者工具
    // mainWindow.webContents.openDevTools()
  } else {
    // 生产模式
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  return mainWindow
}
