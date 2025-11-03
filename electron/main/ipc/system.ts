import { ipcMain } from 'electron'
import * as os from 'os'
import path from 'path'
export function registerSystemInfoHandlers(): void {
  ipcMain.handle('get-system-info', () => {
    // 注意：IP 地址获取逻辑比较复杂，os.networkInterfaces() 会返回所有接口
    // 这里我们先返回一个占位符，或者你可以实现更复杂的逻辑来找到"主要"IP
    const networkInterfaces = os.networkInterfaces()
    let ip = ''
    try {
      // 尝试查找一个非内部的 IPv4 地址
      const externalIPv4 = Object.values(networkInterfaces)
        .flat()
        .find(iface => iface?.family === 'IPv4' && !iface.internal)
      ip = externalIPv4?.address || '127.0.0.1'
    } catch (e) {
      ip = 'Error fetching IP'
    }

    return {
      hostname: os.hostname(), // 客户端hostname
      arch: os.arch(), // 系统架构
      os: os.platform(), // 操作系统 (win32, darwin, linux)
      ip: ip // 客户端 IP (简单示例)
    }
  })
  /**
   * 监听来自渲染进程的 'get-public-file-path' 请求
   * @param event
   * @param fileName 要在 'public' 目录中查找的文件名
   * @returns 文件的绝对文件系统路径
   */
  ipcMain.handle('get-public-file-path', (event, fileName: string): string => {
    //
    // 这正是你建议的逻辑:
    //
    if (process.env['ELECTRON_RENDERER_URL']) {
      // --- 开发环境 ---
      // process.cwd() 是项目根目录 (例如 /path/to/your/project)
      return path.join(process.cwd(), 'public', fileName)
    } else {
      // --- 生产环境 ---
      // 假设主进程脚本(main.js)位于 'dist/electron' 目录中
      return path.join(__dirname, '../', fileName)
    }
  })
}
