import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

/**
 * 创建加载窗口 (Loading Window)
 */
export function createLoadingWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 400, // 加载窗口的宽度
    height: 400, // 加载窗口的高度
    frame: false, // 无边框
    transparent: true, // 透明背景 (配合 loading.html 的 CSS)
    show: false, // 初始不显示
    webPreferences: {
      sandbox: false
    }
  })

  // 根据环境加载 loading.html
  if (is.dev) {
    // 根据你提供的 process.env, INIT_CWD 是项目根目录
    // 这是在 dev 模式下定位 public 目录最可靠的方法
    win.loadFile(join(process.env.INIT_CWD, 'public/loading.html'))
  } else {
    // __dirname 是 dist-electron/main/modules
    // 生产环境中, public/loading.html 会被复制到 dist/loading.html
    win.loadFile(join(__dirname, '../../../dist/loading.html'))
  }

  win.on('ready-to-show', () => {
    win.show() // 准备好后显示
  })

  return win
}
