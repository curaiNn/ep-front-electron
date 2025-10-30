import { ipcMain, BrowserWindow } from 'electron'
import { closeFindView, findViewMap } from '../view/findView' // 导入我们新的关闭函数

/**
 * 帮助函数：
 * 遍历 findViewMap，
 * 查找哪个 BrowserWindow 拥有这个 BrowserView.webContents
 */
function getParentWindow(browserViewWebContents: Electron.WebContents): BrowserWindow | null {
  // 遍历 Map
  for (const [window, view] of findViewMap.entries()) {
    // 检查 view 的 webContents id 是否匹配
    if (view.webContents.id === browserViewWebContents.id) {
      return window
    }
  }
  return null
}

/**
 * 注册与“页内查找”功能相关的所有 IPC 监听器
 * (严格按照你的"成功案例"逻辑)
 */
export function registerFindHandlers(): void {
  // 监听 'search'
  ipcMain.on('search', (event, arg) => {
    // console.log('[IPC Handler] 收到 "search" 请求, 参数:', arg)
    const searchObj = JSON.parse(arg)

    // 将 event 改为 event.sender
    const mainWindow = getParentWindow(event.sender)

    if (mainWindow) {
      mainWindow.webContents.findInPage(searchObj.value, {
        findNext: searchObj.start, // 这是一个 Bug (如我们所讨论的)，但按你的要求保留
        forward: searchObj.next
      })
    } else {
      console.warn('[IPC:search] 警告: 未找到父窗口')
    }
  })

  // 监听 'stop-search'
  ipcMain.on('stop-search', (event, arg) => {
    const mainWindow = getParentWindow(event.sender)
    mainWindow?.webContents.stopFindInPage('clearSelection')
  })

  // 监听 'searchClose'
  ipcMain.on('searchClose', (event, arg) => {
    const mainWindow = getParentWindow(event.sender)
    if (mainWindow) {
      closeFindView(mainWindow)
    }
  })
}
