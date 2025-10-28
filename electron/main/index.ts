import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createMainWindow } from './modules/windowManager'
import { autoUpdater } from 'electron-updater'

// 主窗口实例
let mainWindow: BrowserWindow | null = null

function handleAppReady() {
  // 设置应用程序用户模型 ID
  electronApp.setAppUserModelId('com.electron-vue-template')

  // 优化浏览器窗口
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 创建主窗口
  mainWindow = createMainWindow()

  // 仅在开发模式下打开开发者工具
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // 在主窗口加载完成后，延迟检查更新
  // 这可以防止更新检查阻塞应用的启动
  mainWindow.once('ready-to-show', () => {
    // 如果不是开发环境，则检查更新
    if (!is.dev) {
      // 你可以根据需要调整检查更新的频率或时机
      autoUpdater.checkForUpdatesAndNotify()
    }
  })

  // === 更新器事件监听 ===

  // 1. 监听“检查更新”事件
  ipcMain.on('check-for-updates', () => {
    if (!is.dev) {
      autoUpdater.checkForUpdatesAndNotify()
    } else {
      mainWindow?.webContents.send(
        'update-available',
        '开发模式下跳过更新检查',
      )
    }
  })

  // 2. 监听“发现可用更新”
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send(
      'update-available',
      `发现新版本 ${info.version}，正在下载...`,
    )
  })

  // 3. 监听“更新下载完成”
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send(
      'update-downloaded',
      '更新下载完成，重启应用以安装',
    )
    // 你可以在这里提示用户立即重启，或在用户确认后再重启
    // autoUpdater.quitAndInstall()
  })

  // 4. 监听更新错误
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send(
      'update-available',
      `更新出错: ${err.message}`,
    )
  })
}

// === Electron 应用生命周期 ===

app.whenReady().then(handleAppReady)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

