import { BrowserWindow } from 'electron'
import { createLoadingWindow } from './loadingWindow'
import { createWindow } from './mainWindow'

// 模块内的变量来持有窗口对象
let mainWindow: BrowserWindow | null
let loadingWindow: BrowserWindow | null

/**
 * 启动应用 (加载窗口 -> 主窗口)
 */
export function startApp(): void {
  // 1. 立即创建并显示加载窗口
  loadingWindow = createLoadingWindow()

  // 2. 创建主窗口 (但保持隐藏)
  mainWindow = createWindow()

  // 3. 监听主窗口的 'ready-to-show' 事件
  // 这个事件在主窗口的页面 (Vue 应用) 完全加载后触发
  if (mainWindow) {
    mainWindow.once('ready-to-show', () => {
      // 4. 等待 1.5 秒
      setTimeout(() => {
        // 5. 关闭加载窗口
        if (loadingWindow) {
          loadingWindow.close()
          loadingWindow = null
        }
        // 6. 显示主窗口
        mainWindow?.show()
      }, 1500) // 1.5 秒
    })
  }
}
