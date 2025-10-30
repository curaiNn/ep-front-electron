import { BrowserWindow, BrowserView } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export const findViewMap = new Map<BrowserWindow, BrowserView>()

// 定义 BrowserView 的高度
const FIND_VIEW_HEIGHT = 50 // 匹配 search.html 的 42px + 8px 边距

/**
 * createFindView - 模仿你的 createSearchViewWindow 函数
 * @param mainWindow 主窗口
 */
export async function createFindView(mainWindow: BrowserWindow): Promise<BrowserView> {
  // 1. 使用我们统一的 preload 脚本
  const preloadUrl = join(__dirname, '../preload/index.js')

  const searchView = new BrowserView({
    webPreferences: {
      devTools: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadUrl
    }
  })

  // 2. 【核心修改】使用 Map 存储关联
  findViewMap.set(mainWindow, searchView)

  // 3. 设置位置和大小 (模仿你的代码)
  const bounds = mainWindow.getBounds()
  searchView.setBounds({ x: bounds.width - 380, y: 75, width: 360, height: FIND_VIEW_HEIGHT })

  // 4. 添加到主窗口
  await mainWindow.addBrowserView(searchView)

  // 5. 加载 find.html
  let launchUrl: string
  if (is.dev && process.env.INIT_CWD) {
    launchUrl = join(process.env.INIT_CWD, 'public/find.html')
  } else {
    launchUrl = join(__dirname, '../../dist/find.html')
  }
  await searchView.webContents.loadFile(launchUrl)

  // 6. 立即聚焦
  searchView.webContents.focus()

  // 7. 监听主窗口大小变化，调整位置
  const onResize = () => {
    const newBounds = mainWindow.getBounds()
    searchView.setBounds({ x: newBounds.width - 380, y: 75, width: 360, height: FIND_VIEW_HEIGHT })
  }
  mainWindow.on('resize', onResize)

  const cleanup = () => {
    mainWindow.removeListener('resize', onResize)
    findViewMap.delete(mainWindow)
  }

  mainWindow.once('closed', cleanup)
  searchView.webContents.once('destroyed', cleanup)

  return searchView
}

/**
 * closeFindView - 模仿你 menu.ts 中的关闭逻辑
 */
export function closeFindView(mainWindow: BrowserWindow): void {
  if (!mainWindow) return

  // 停止查找
  mainWindow.webContents.stopFindInPage('clearSelection')

  const searchView = findViewMap.get(mainWindow)

  if (searchView) {
    // 移除 BrowserView
    mainWindow.removeBrowserView(searchView)
    // 销毁 webContents
    searchView.webContents.close()
    // Map 的清理将由 'destroyed' 事件自动处理
  }
}
