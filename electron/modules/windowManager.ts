import { BrowserWindow } from 'electron'
import { join } from 'path'

// 导出一个函数用于创建窗口
export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 关键：指定预加载脚本
      preload: join(__dirname, '../preload/index.js'),
      // 允许在渲染进程中使用 Node.js API (为了 preload)
      nodeIntegration: false,
      // 上下文隔离（推荐）
      contextIsolation: true,
      // 关闭沙箱（如果 preload 需要访问 node:fs 等)
      // sandbox: false,
    },
  })

  // --- 加载页面 ---
  // HMR (热模块替换) for renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    // 开发模式：加载 Vite 开发服务器
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    // 自动打开开发者工具
    win.webContents.openDevTools()
  } else {
    // 生产模式：加载构建好的 index.html
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
